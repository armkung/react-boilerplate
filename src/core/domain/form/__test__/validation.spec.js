import cases from 'jest-in-case'

import { createValidation } from 'core/service/validation'
import { required } from '../validation'

const testCases = [
  {
    name: 'When required and empty value',
    validation: [required],
    value: '',
    isValid: false
  },
  {
    name: 'When required and not empty value',
    validation: [required],
    value: 'firstName',
    isValid: true
  }
]

cases('App validation', ({ validation = [], value, isValid }) => {
  const validator = createValidation(validation)
  const dependencies = {
    required,
    value
  }
  expect(validator.isValid(dependencies)).toBe(isValid)
}, testCases)