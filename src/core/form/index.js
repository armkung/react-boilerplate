import createForm from './model'
import { Field, DropdownField } from './model/field'
import { firstName, lastName, province } from './fields'

const sections = [
  {
    id: 'insured',
    fields: [
      firstName(),
      lastName(),
      Field.named('age')
    ]
  },
  {
    id: 'insured_address',
    fields: [
      province(),
      DropdownField.named('amphur')
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