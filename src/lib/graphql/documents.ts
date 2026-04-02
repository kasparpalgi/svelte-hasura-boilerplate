/** @file src/lib/graphql/documents.ts */
import { graphql } from './generated/gql';

export const GET_USERS = graphql(`
  query GetUsers {
    users {
      uuid
      name
      email
      created_at
    }
  }
`);
