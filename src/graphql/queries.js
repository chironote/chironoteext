/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getUserSubscription = /* GraphQL */ `
  query GetUserSubscription($owner: String!) {
    getUserSubscription(owner: $owner) {
      owner
      tier
      hoursleft
      notesleft
      __typename
    }
  }
`;
export const listUserSubscriptions = /* GraphQL */ `
  query ListUserSubscriptions(
    $owner: String
    $filter: ModelUserSubscriptionFilterInput
    $limit: Int
    $nextToken: String
    $sortDirection: ModelSortDirection
  ) {
    listUserSubscriptions(
      owner: $owner
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      sortDirection: $sortDirection
    ) {
      items {
        owner
        tier
        hoursleft
        notesleft
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getNotes = /* GraphQL */ `
  query GetNotes($owner: String!, $timestamp: String!) {
    getNotes(owner: $owner, timestamp: $timestamp) {
      owner
      timestamp
      transcript
      note
      __typename
    }
  }
`;
export const listNotes = /* GraphQL */ `
  query ListNotes(
    $owner: String
    $timestamp: ModelStringKeyConditionInput
    $filter: ModelNotesFilterInput
    $limit: Int
    $nextToken: String
    $sortDirection: ModelSortDirection
  ) {
    listNotes(
      owner: $owner
      timestamp: $timestamp
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      sortDirection: $sortDirection
    ) {
      items {
        owner
        timestamp
        transcript
        note
        __typename
      }
      nextToken
      __typename
    }
  }
`;
