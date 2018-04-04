import { TextField } from '../field'
import { Section } from '../section'
import createForm from '../index'

describe('createForm', () => {
  const sections = [
    {
      section: Section.named('insured'),
      fields: [{
        field: TextField.named('firstName')
      }]
    }
  ]
  const form = createForm({ sections })

  describe('getSnapshot', () => {
    it('return correctly', () => {
      const snapshot = form.getSnapshot()
      expect(snapshot).toEqual({
        'insured': {
          'firstName': ''
        }
      })
    })
  })

})