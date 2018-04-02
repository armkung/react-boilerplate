import { TextField } from '../field'
import createForm from '../index'

describe('createForm', () => {
  const sections = [
    {
      id: 'insured',
      label: 'Insured',
      fields: [
        TextField.named('firstName')
      ]
    }
  ]
  const form = createForm(sections)

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