/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateNotesByOwner = /* GraphQL */ `
  subscription OnCreateNotesByOwner($owner: String!) {
    onCreateNotesByOwner(owner: $owner) {
      owner
      timestamp
      transcript
      note
      __typename
    }
  }
`;
export const onUpdateNotesByOwner = /* GraphQL */ `
  subscription OnUpdateNotesByOwner($owner: String!) {
    onUpdateNotesByOwner(owner: $owner) {
      owner
      timestamp
      transcript
      note
      __typename
    }
  }
`;
export const onCreateUserSubscription = /* GraphQL */ `
  subscription OnCreateUserSubscription(
    $filter: ModelSubscriptionUserSubscriptionFilterInput
    $owner: String
  ) {
    onCreateUserSubscription(filter: $filter, owner: $owner) {
      owner
      tier
      hoursleft
      notesleft
      __typename
    }
  }
`;
export const onUpdateUserSubscription = /* GraphQL */ `
  subscription OnUpdateUserSubscription(
    $filter: ModelSubscriptionUserSubscriptionFilterInput
    $owner: String
  ) {
    onUpdateUserSubscription(filter: $filter, owner: $owner) {
      owner
      tier
      hoursleft
      notesleft
      __typename
    }
  }
`;
export const onDeleteUserSubscription = /* GraphQL */ `
  subscription OnDeleteUserSubscription(
    $filter: ModelSubscriptionUserSubscriptionFilterInput
    $owner: String
  ) {
    onDeleteUserSubscription(filter: $filter, owner: $owner) {
      owner
      tier
      hoursleft
      notesleft
      __typename
    }
  }
`;
export const onCreateNotes = /* GraphQL */ `
  subscription OnCreateNotes(
    $filter: ModelSubscriptionNotesFilterInput
    $owner: String
  ) {
    onCreateNotes(filter: $filter, owner: $owner) {
      owner
      timestamp
      transcript
      note
      __typename
    }
  }
`;
export const onUpdateNotes = /* GraphQL */ `
  subscription OnUpdateNotes(
    $filter: ModelSubscriptionNotesFilterInput
    $owner: String
  ) {
    onUpdateNotes(filter: $filter, owner: $owner) {
      owner
      timestamp
      transcript
      note
      __typename
    }
  }
`;
export const onDeleteNotes = /* GraphQL */ `
  subscription OnDeleteNotes(
    $filter: ModelSubscriptionNotesFilterInput
    $owner: String
  ) {
    onDeleteNotes(filter: $filter, owner: $owner) {
      owner
      timestamp
      transcript
      note
      __typename
    }
  }
`;
