import { withAuthenticator, CheckboxField, Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import config from './amplifyconfiguration.json';
import * as subscriptions from './graphql/subscriptions';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import './App.css';

Amplify.configure(config);
const client = generateClient();

const components = {
  Header: () => <Header />,
  SignUp: {
    FormFields() {
      return (
        <>
          <Authenticator.SignUp.FormFields />
          <CheckboxField
            name="acknowledgement"
            value="yes"
            label={
              <>
                I agree with the <a href="https://public-docs-and-agreements.s3.us-east-2.amazonaws.com/PrivacyTermsConditions.pdf" target="_blank" rel="noopener noreferrer">Terms, Conditions and Privacy Policy</a>
              </>
            }
            required={true}
          />
        </>
      );
    },
  },
};

function App({ signOut, user }) {
  const [latestNote, setLatestNote] = useState('');

  useEffect(() => {
    console.log('Setting up subscription for user:', user.username);
    
    // GraphQL subscription
    const subscription = client.graphql({ 
      query: subscriptions.onUpdateNotesByOwner,
      variables: { owner: user.username }
    }).subscribe({
      next: ({ data }) => {
        console.log('Received subscription data:', data);
        const updatedData = data.onUpdateNotesByOwner;
        console.log('Updated note data:', updatedData);
        setLatestNote(updatedData.note || '');
      },
      error: (error) => {
        console.error('Subscription error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
    });

    return () => {
      console.log('Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [user.username]);

  return (
    <div className="App">
      <div className="container">
        <div className="note-box">
          <textarea
            value={latestNote}
            readOnly
            className="note-textarea"
            placeholder="Waiting for notes..."
          />
        </div>
        <button onClick={signOut} className="sign-out-button">Sign Out</button>
      </div>
    </div>
  );
}

export default withAuthenticator(App, { components });
