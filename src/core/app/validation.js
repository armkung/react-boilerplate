import { createValidator, createValidation, REQUIRED } from 'core/form/validation'

export default createValidator({
  '.': createValidation({
    [REQUIRED]: [{
      rule: (value) => value !== '',
      message: 'required'
    }]
  })
})