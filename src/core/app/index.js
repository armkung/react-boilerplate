import createForm from 'core/form'
import { TextField, DropdownField } from 'core/form/model/field'

import { firstName, lastName, province } from './fields'

const sections = [
  {
    id: 'insured',
    label: 'Insured',
    fields: [
      firstName.volatile(() => ({
        label: 'FirstName'
      })),
      lastName.volatile(() => ({
        label: 'FirstName'
      })),
      TextField.named('age').volatile(() => ({
        label: 'Age'
      }))
    ]
  },
  {
    id: 'insured_address',
    label: 'Insured Address',
    fields: [
      province.volatile(() => ({
        label: 'Province'
      })),
      DropdownField.named('amphur').volatile(() => ({
        label: 'Amphur'
      }))
    ]
  }
]

export default createForm(sections, {
  getData: () => new Promise(resolve => {
    setTimeout(() => {
      resolve([{ value: 10 }])
    }, 1000)
  })
})