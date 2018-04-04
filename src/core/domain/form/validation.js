import { REQUIRED } from 'core/service/validation'


export const required = {
  type: REQUIRED,
  rule: (value) => value !== '',
  message: 'required'
}