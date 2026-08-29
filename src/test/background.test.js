/** @jest-environment node */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const background = fs.readFileSync(path.resolve(__dirname, '../../public/background.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

function loadBackground({ tabs = [{ id: 42 }, { id: 43 }], sidePanel = {}, query } = {}) {
  const chrome = {
    sidePanel: {
      setPanelBehavior: jest.fn().mockResolvedValue(undefined),
      setOptions: jest.fn().mockResolvedValue(undefined),
      open: jest.fn(() => { throw new Error('No user gesture'); }),
      ...sidePanel
    },
    action: { onClicked: { addListener: jest.fn() } },
    runtime: { onStartup: { addListener: jest.fn() } },
    tabs: {
      query: query || jest.fn().mockResolvedValue(tabs),
      onCreated: { addListener: jest.fn() },
      onReplaced: { addListener: jest.fn() }
    }
  };
  const warn = jest.fn();
  vm.runInNewContext(background, { chrome, console: { warn } });
  return {
    chrome,
    warn,
    createTab: chrome.tabs.onCreated.addListener.mock.calls[0][0],
    startBrowser: chrome.runtime.onStartup.addListener.mock.calls[0][0],
    replaceTab: chrome.tabs.onReplaced.addListener.mock.calls[0][0]
  };
}

test('does not declare a global panel or add browser permissions', () => {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../public/manifest.json'), 'utf8'));
  expect(manifest.side_panel).toBeUndefined();
  expect(manifest.permissions).toEqual(['sidePanel']);
});

test('uses native toolbar opening without a gesture-losing custom click handler', async () => {
  const { chrome } = loadBackground();
  await flush();
  expect(chrome.sidePanel.setPanelBehavior).toHaveBeenCalledWith({ openPanelOnActionClick: true });
  expect(chrome.action.onClicked.addListener).not.toHaveBeenCalled();
  expect(chrome.sidePanel.open).not.toHaveBeenCalled();
});

test('prepares each existing tab separately on worker startup without opening it', async () => {
  const { chrome } = loadBackground();
  await flush();
  expect(chrome.tabs.query).toHaveBeenCalledWith({});
  expect(chrome.sidePanel.setOptions.mock.calls).toEqual([
    [{ tabId: 42, path: 'index.html', enabled: true }],
    [{ tabId: 43, path: 'index.html', enabled: true }]
  ]);
  expect(chrome.sidePanel.open).not.toHaveBeenCalled();
});

test('prepares a newly created tab without opening or disabling other panels', async () => {
  const { chrome, createTab } = loadBackground({ tabs: [] });
  await createTab({ id: 44 });
  expect(chrome.sidePanel.setOptions.mock.calls).toEqual([
    [{ tabId: 44, path: 'index.html', enabled: true }]
  ]);
  expect(chrome.sidePanel.open).not.toHaveBeenCalled();
});

test('prepares a replacement tab using its new ID', async () => {
  const { chrome, replaceTab } = loadBackground({ tabs: [] });
  await replaceTab(45, 42);
  expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({ tabId: 45, path: 'index.html', enabled: true });
});

test('reapplies contextual options after a worker restart without opening panels', async () => {
  loadBackground();
  await flush();
  const { chrome } = loadBackground();
  await flush();
  expect(chrome.sidePanel.setOptions).toHaveBeenCalledTimes(2);
  expect(chrome.sidePanel.open).not.toHaveBeenCalled();
});

test('prepares restored tabs at browser startup', async () => {
  const { chrome, startBrowser } = loadBackground({ tabs: [] });
  await flush();
  chrome.tabs.query.mockResolvedValue([{ id: 46 }]);
  await startBrowser();
  expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({ tabId: 46, path: 'index.html', enabled: true });
});

test.each([{}, { id: -1 }, { id: '42' }])('ignores invalid tab IDs: %p', async (tab) => {
  const { chrome, createTab } = loadBackground({ tabs: [] });
  await createTab(tab);
  expect(chrome.sidePanel.setOptions).not.toHaveBeenCalled();
});

test('one tab setup failure does not prevent preparing other tabs', async () => {
  const { chrome, warn } = loadBackground({
    sidePanel: { setOptions: jest.fn().mockRejectedValueOnce(new Error('private diagnostic')).mockResolvedValue(undefined) }
  });
  await flush();
  expect(chrome.sidePanel.setOptions).toHaveBeenCalledTimes(2);
  expect(warn.mock.calls).toEqual([['side_panel_tab_setup_failed']]);
});

test('handles tab query failure while retaining listeners for new tabs', async () => {
  const { chrome, createTab, warn } = loadBackground({
    query: jest.fn().mockRejectedValue(new Error('private diagnostic'))
  });
  await flush();
  await createTab({ id: 44 });
  expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({ tabId: 44, path: 'index.html', enabled: true });
  expect(warn.mock.calls).toEqual([['side_panel_tabs_setup_failed']]);
});

test('handles toolbar setup failures without an unhandled rejection', async () => {
  const { warn } = loadBackground({
    sidePanel: { setPanelBehavior: jest.fn().mockRejectedValue(new Error('private diagnostic')) }
  });
  await flush();
  expect(warn.mock.calls).toEqual([['side_panel_setup_failed']]);
});
