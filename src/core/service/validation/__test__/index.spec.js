import { createValidator, createValidation, ERROR, REQUIRED } from '../index'

describe('validator', () => {
  describe('createValidator', () => {
    const validator = createValidator({
      '.': createValidation(
        [{
          type: REQUIRED,
          rule: (value) => value !== '',
          message: 'required'
        }]
      ),
      'id$': createValidation(
        [{
          type: ERROR,
          rule: (value) => value !== 'id',
          message: 'error'
        }]
      )
    })
    const { isValid, getValidationMessages } = validator('id')

    describe('when required', () => {
      const required = true
      it('isValid = false when empty', () => {
        const value = ''
        expect(isValid({ value, required })).toBe(false)
        expect(getValidationMessages({ value, required })).toEqual([{
          type: REQUIRED,
          message: 'required'
        }])
      })
      it('isValid = true when not empty', () => {
        const value = 'value'
        expect(isValid({ value, required })).toBe(true)
        expect(getValidationMessages({ value, required })).toEqual([])
      })
      it('isValid = false when invalid', () => {
        const value = 'id'
        expect(isValid({ value, required })).toBe(false)
        expect(getValidationMessages({ value, required })).toEqual([{
          type: ERROR,
          message: 'error'
        }])
      })
    })
    describe('when not required', () => {
      const required = false
      it('isValid = true when empty', () => {
        const value = ''
        expect(isValid({ value, required })).toBe(true)
        expect(getValidationMessages({ value, required })).toEqual([])
      })
      it('isValid = true when not empty', () => {
        const value = 'value'
        expect(isValid({ value, required })).toBe(true)
        expect(getValidationMessages({ value, required })).toEqual([])
      })
      it('isValid = false when invalid', () => {
        const value = 'id'
        expect(isValid({ value, required })).toBe(false)
        expect(getValidationMessages({ value, required })).toEqual([{
          type: ERROR,
          message: 'error'
        }])
      })
    })
  })
})