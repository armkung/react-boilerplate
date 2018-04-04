import { onPatch, getRoot, addMiddleware, addDisposer } from 'mobx-state-tree'

import { TextField, DropdownField } from 'core/model/form/field'

export const province = DropdownField
  .named('province')

export const firstName = TextField
  .named('firstName')
  .actions((self) => ({
    afterAttach() {
      // const form = getRoot(self)
      // const section = self.section
      // addDisposer(self, onPatch(self, (patch) => {
      //   if (self.value && self.value.length > 3) {
      //     self.hide()
      //     form.getSection('insured_address').hide()
      //   }
      //   form.setFieldValue(section.id, 'lastName', self.value)
      //   section.setFieldValue('age', self.value)
      // }))
    }
  }))

export const lastName = TextField
  .named('lastName')
  .actions((self) => ({
    // afterCreate() {
    //   addDisposer(self, addMiddleware(self, (action, next) => {
    //     if (action.name === 'setValue') {
    //       if (action.args[0] === '') {
    //         action.args[0] = action.context.value
    //       }
    //     }
    //     return next(action)
    //   }))
    // }
  }))