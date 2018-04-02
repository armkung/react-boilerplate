import gql from 'graphql-tag'

import { Application } from 'core/model/app/fragment'

export const update = gql`
  mutation Field($id: String, $value: Value) {
    updateField(id: $id, value: $value) @client {
      ...Application
    }
  }
  ${Application}
`