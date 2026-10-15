import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { getUserId } from './recordingAuth';
import useMediaRecorderController from './useMediaRecorderController';

jest.mock('./recordingAuth', () => ({
  getUserId: jest.fn()
}));

class MockMediaRecorder {
  static instances = [];

  static isTypeSupported() {
    return true;
  }

  constructor(stream, options) {
    this.mimeType = options.mimeType || 'audio/webm';
    this.state = 'inactive';
    this.stream = stream;
    MockMediaRecorder.instances.push(this);
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.emitData();
    if (this.onstop) {
      this.onstop();
    }
  }

  emitData() {
    if (this.ondataavailable) {
      this.ondataavailable({
        data: new Blob(['a'.repeat(1200)], { type: this.mimeType }),
        target: this
      });
    }
  }
}

const createDeferred = () => {
  let resolve;
  const promise = new Promise(resolvePromise => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

const flushPromises = async () => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
};

describe('useMediaRecorderController cleanup', () => {
  let container;
  let consoleLog;
  let controller;
  let root;
  let track;

  const refs = {
    filePathRef: { current: null },
    isDiscardingRef: { current: false },
    noSleepRef: {
      current: {
        disable: jest.fn(),
        enable: jest.fn()
      }
    },
    pathStampRef: { current: null },
    timeStampRef: { current: null }
  };

  const callbacks = {
    cancelUploadSession: jest.fn(),
    cleanupNoteGeneration: jest.fn(),
    queueUpload: jest.fn(),
    resetNoteGenerationState: jest.fn(),
    setIsGeneratingSummary: jest.fn(),
    setIsPaused: jest.fn(),
    setIsPreparingTranscript: jest.fn(),
    setIsRecording: jest.fn(),
    setIsTranscriptCompleted: jest.fn(),
    setTextStream: jest.fn(),
    startUploadSession: jest.fn()
  };

  const Harness = () => {
    controller = useMediaRecorderController({
      ...refs,
      ...callbacks
    });
    return null;
  };

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    global.MediaRecorder = MockMediaRecorder;
    MockMediaRecorder.instances = [];
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    track = { stop: jest.fn() };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          active: true,
          getTracks: () => [track]
        })
      }
    });
    getUserId.mockResolvedValue('user-12345678');

    Object.values(callbacks).forEach(callback => callback.mockClear());
    refs.isDiscardingRef.current = false;
    refs.noSleepRef.current.disable.mockClear();
    refs.noSleepRef.current.enable.mockClear();

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(<Harness />);
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    consoleLog.mockRestore();
    delete global.MediaRecorder;
    global.IS_REACT_ACT_ENVIRONMENT = false;
    jest.clearAllMocks();
  });

  test('freezes explicit settings before microphone permission and ignores later preferences', async () => {
    const permission = createDeferred();
    navigator.mediaDevices.getUserMedia.mockReturnValue(permission.promise);
    const settings = { examLayout: true, PILayout: true };
    let starting;
    act(() => {
      starting = controller.startRecording(undefined, settings);
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    });
    settings.examLayout = false; settings.PILayout = false;
    localStorage.setItem('noteSettings', JSON.stringify(settings));
    await act(async () => {
      permission.resolve({ getTracks: () => [track] });
      await starting;
      controller.stopRecording();
      await flushPromises();
    });
    const capture = callbacks.queueUpload.mock.calls[0][2].capture;
    expect(capture.noteSettings).toEqual({ examLayout: true, PILayout: true });
    expect(Object.isFrozen(capture)).toBe(true);
    expect(Object.isFrozen(capture.noteSettings)).toBe(true);
    localStorage.clear();
  });

  test('unmount cleanup cancels the session without finalizing or setting UI state', async () => {
    await act(async () => {
      await controller.startRecording();
    });

    expect(callbacks.startUploadSession).toHaveBeenCalledTimes(1);
    const sessionId = callbacks.startUploadSession.mock.calls[0][0];

    Object.values(callbacks).forEach(callback => callback.mockClear());

    act(() => {
      controller.cleanupRecorder();
    });

    expect(callbacks.cancelUploadSession).toHaveBeenCalledWith(sessionId);
    expect(callbacks.queueUpload).not.toHaveBeenCalled();
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(callbacks.cleanupNoteGeneration).toHaveBeenCalledTimes(1);
    expect(callbacks.setIsRecording).not.toHaveBeenCalled();
    expect(callbacks.setIsPreparingTranscript).not.toHaveBeenCalled();
    expect(callbacks.setTextStream).not.toHaveBeenCalled();
  });

  test('serializes audio events so a final chunk cannot overtake an earlier chunk', async () => {
    const firstUserLookup = createDeferred();
    getUserId
      .mockImplementationOnce(() => firstUserLookup.promise)
      .mockResolvedValue('user-12345678');

    await act(async () => {
      await controller.startRecording();
    });

    const recorder = MockMediaRecorder.instances[0];
    recorder.emitData();
    controller.stopRecording();

    await act(async () => {
      await flushPromises();
    });
    expect(getUserId).toHaveBeenCalledTimes(1);
    expect(callbacks.queueUpload).not.toHaveBeenCalled();

    await act(async () => {
      firstUserLookup.resolve('user-12345678');
      await flushPromises();
    });

    expect(callbacks.queueUpload).toHaveBeenCalledTimes(2);
    expect(callbacks.queueUpload.mock.calls[0][1]).toContain('_recording_chunk_');
    expect(callbacks.queueUpload.mock.calls[1][1]).toContain('_recording_final_');
  });

  test('denied permission rejects startup and cancels its upload session', async () => {
    navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error('denied'));
    await expect(controller.startRecording()).rejects.toThrow('denied');
    expect(callbacks.cancelUploadSession).toHaveBeenCalledTimes(1);
    expect(callbacks.setIsRecording).not.toHaveBeenCalledWith(true);
  });

  test('late microphone permission after cleanup releases the acquired stream', async () => {
    const pending = createDeferred();
    navigator.mediaDevices.getUserMedia.mockReturnValue(pending.promise);
    const start = controller.startRecording();
    controller.cleanupRecorder();
    pending.resolve({ active: true, getTracks: () => [track] });
    await start;
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(MockMediaRecorder.instances).toHaveLength(0);
  });

  test('rotation uploads before finalization and tracks survive until final data is emitted', async () => {
    jest.useFakeTimers();
    await controller.startRecording();
    const recorder = MockMediaRecorder.instances[0];
    jest.advanceTimersByTime(240000);
    await flushPromises();
    expect(recorder.state).toBe('recording');
    expect(track.stop).not.toHaveBeenCalled();
    controller.pauseRecording();
    jest.advanceTimersByTime(240000);
    expect(recorder.state).toBe('paused');
    controller.resumeRecording();
    controller.stopRecording();
    controller.stopRecording();
    await flushPromises();
    expect(callbacks.queueUpload).toHaveBeenCalledTimes(2);
    expect(callbacks.queueUpload.mock.calls[1][1]).toContain('_recording_final_');
    expect(track.stop).toHaveBeenCalledTimes(1);
    controller.cleanupRecorder();
    jest.useRealTimers();
  });

  test('discard suppresses in-flight identity lookup and all late media callbacks', async () => {
    const pending = createDeferred();
    getUserId.mockReturnValue(pending.promise);
    await controller.startRecording();
    const recorder = MockMediaRecorder.instances[0];
    recorder.emitData();
    await flushPromises();
    controller.discardRecording();
    pending.resolve('user');
    await flushPromises();
    expect(callbacks.queueUpload).not.toHaveBeenCalled();
    expect(recorder.ondataavailable).toBeNull();
    expect(track.stop).toHaveBeenCalledTimes(1);
  });


  test('Finish during rotation labels the stopped blob final without creating an empty recorder', async () => {
    await controller.startRecording();
    const recorder = MockMediaRecorder.instances[0];
    recorder.state = 'inactive';
    recorder.emitData();
    controller.stopRecording();
    recorder.onstop();
    await flushPromises();
    expect(callbacks.queueUpload).toHaveBeenCalledTimes(1);
    expect(callbacks.queueUpload.mock.calls[0][1]).toContain('_recording_final_');
    expect(recorder.state).toBe('inactive');
    expect(track.stop).toHaveBeenCalledTimes(1);
    controller.cleanupRecorder();
  });

});
