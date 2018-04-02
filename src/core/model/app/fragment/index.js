import gql from 'graphql-tag'

export const Application = gql`
  fragment Application on Field {
    id
    value
  }
`