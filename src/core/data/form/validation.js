import { createValidator, createValidation, REQUIRED } from 'core/service/validation'

export default createValidator({
  '.': createValidation({
    [REQUIRED]: [{
      rule: (value) => value !== '',
      message: 'required'
    }]
  })
})