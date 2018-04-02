import cases from 'jest-in-case'

import createValidation from '../validation'

const testCases = [
  {
    name: 'When required and empty value',
    id: 'firstName',
    required: true,
    value: '',
    isValid: false
  },
  {
    name: 'When required and not empty value',
    id: 'firstName',
    required: true,
    value: 'firstName',
    isValid: true
  }
]

cases('App validation', ({ id, required, value, isValid }) => {
  const validator = createValidation(id)
  const dependencies = {
    required,
    value
  }
  expect(validator.isValid(dependencies)).toBe(isValid)
}, testCases)