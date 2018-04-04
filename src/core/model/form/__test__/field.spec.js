import { createField, TextField } from '../field'
import { REQUIRED } from 'core/service/validation'

describe('createForm', () => {
  const field = createField({
    field: TextField.named('insured'),
    required: true,
    validation: [{
      type: REQUIRED,
      rule: (value) => value !== '',
      message: 'empty'
    }]
  }).create()

  it('have required message', async () => {
    field.setValue('')

    expect(field.validationMessages).toEqual([{
      type: REQUIRED,
      message: 'empty'
    }])
  })

})