import { onPatch, getRoot, addMiddleware, addDisposer, getParent } from 'mobx-state-tree'

import { Field, DropdownField } from 'core/form/model/field'

export const province = () => DropdownField
  .named('province')

export const firstName = () => Field
  .named('firstName')
  .props({
    value: ''
  })
  .actions((self) => ({
    afterAttach() {
      const form = getRoot(self)
      const section = getParent(self)
      addDisposer(self, onPatch(self, (patch) => {
        if (self.value.length > 3) {
          self.hide()
          form['insured_address'].hide()
        }
        form.setFieldValue(self.sectionId, 'lastName', self.value)
        section.setFieldValue('age', self.value)
      }))
    }
  }))

export const lastName = () => Field
  .named('lastName')
  .props({
    value: ''
  })
  .actions((self) => ({
    afterCreate() {
      addDisposer(self, addMiddleware(self, (action, next) => {
        if (action.name === 'setValue') {
          if (action.args[0] === '') {
            action.args[0] = action.context.value
          }
        }
        return next(action)
      }))
    }
  }))