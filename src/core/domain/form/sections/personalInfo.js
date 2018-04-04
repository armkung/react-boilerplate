import { compact, over, join, invokeArgs, pipe } from 'lodash/fp'
import { Section } from 'core/model/form/section'
import { TextField, DropdownField } from 'core/model/form/field'

import { required } from 'core/domain/form/validation'
import { firstName, lastName, province } from 'core/domain/form/fields'

const personalInfoSection = Section
  .views((self) => {
    const getFullName = pipe(
      over([
        invokeArgs('getFieldValue', ['firstName']),
        invokeArgs('getFieldValue', ['lastName'])
      ]),
      compact,
      join(' ')
    )

    return {
      get fullName() {
        return getFullName(self)
      }
    }
  })

export const insured = {
  section: personalInfoSection.named('insured'),
  label: 'Insured',
  fields:  [
    {
      field: firstName,
      label: 'FirstName',
      validation: [required]
    },
    {
      field: lastName,
      label: 'LastName'
    },
    {
      field: TextField.named('age'),
      label: 'Age'
    }
  ]
}

export const payer = {
  section: personalInfoSection.named('payer'),
  label: 'Payer',
  fields:  [
    {
      field: firstName,
      label: 'FirstName',
      validation: [required]
    },
    {
      field: lastName,
      label: 'LastName'
    },
    {
      field: TextField.named('age'),
      label: 'Age'
    }
  ]
}

export const insuredAddress = {
  section: personalInfoSection.named('insured_address'),
  label: 'Insured Address',
  fields: [
    {
      field: province,
      label: 'Province'
    },
    {
      field: DropdownField.named('amphur'),
      label: 'Amphur'
    }
  ]
}