import gql from 'graphql-tag'

import { Application } from 'core/model/app/fragment'

export const field = gql`
  query Field($id: String) {
    field(id: $id) @client {
      id
      value
    }
  }
`

export const fields = gql`
  {
    fields @_(keyBy: "id") {
      ...Application
    }
  }
  ${Application}
`