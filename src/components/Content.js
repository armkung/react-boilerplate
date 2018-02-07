import { observer } from 'mobx-react'
import FormModel from 'core/form'

const Form = observer(
  ({ form }) => (
    <div>
    {
      form.getFields().map((field, index) => {
        return (
          <div key={index}>
            { field.section.label }:{ field.label }:
            { field.options ? (
              <select>
                {
                  field.options.map((data, index) => <option key={index}>{ JSON.stringify(data) }</option>)
                }
              </select>
            ):(
              <input disabled={field.hidden}
              value={field.value}
              onChange={(evt)=>field.setValue(evt.target.value)} />
            )}
          </div>
        )
      })
    }
    <button onClick={form['insured'].save}>Save Insured</button>
    <button onClick={form['insured'].load}>Load Insured</button>
    <div style={{ whiteSpace: 'pre' }}>{ JSON.stringify(form.getSnapshot(), null, 4) }</div>
    </div>
  )
)

export default () => (
  <Form form={FormModel} />
)