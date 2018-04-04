import * as services from 'core/service/data'

import createForm from 'core/model/form'

import { insured, payer, insuredAddress } from './sections'

const sections = [
  insured,
  payer,
  insuredAddress
]

export default (afterCreate) => createForm({
  sections,
  services,
  afterCreate,
  initialState: {}
})
