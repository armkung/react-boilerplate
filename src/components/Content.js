import { delay } from 'lodash/fp'
import { compose, withProps } from 'recompose'
import { observer, inject } from 'mobx-react'
import { View, Text, Label, Picker, PickerItem, Button, TextInput as _TextInput } from './index'
import withDebounceChange from 'hoc/withDebounceChange'

const TextInput = withDebounceChange(1000, 'onChange', (evt) => evt.target.value)(_TextInput)
const Select = withDebounceChange(1000, 'onChange', (evt) => evt.target.value)((props) => <select {...props} />)

const Field = observer(({ field }) =>
  <View>
      <Label>{ field.section.label }:{ field.label }:</Label>
      { field.options ? (
        <Picker mode="dropdown">
          {
            field.options.map((data, index) =>
              <PickerItem
              key={index}
              label={ JSON.stringify(data) } />
            )
          }
        </Picker>
        // <Select
        // value={field.value}
        // onChange={(value)=>field.setValue(value)} >
        //   {
        //     field.options.map((data, index) =>
        //       <option key={index} value={data.value}>
        //         { JSON.stringify(data) }
        //       </option>
        //     )
        //   }
        // </Select>
      ):(
        <TextInput disabled={field.hidden}
        value={field.value}
        onChange={(value)=>field.setValue(value)} />
      )}
      <Text>{ JSON.stringify(field.validationMessages, null, 4) }</Text>
    </View>
)

export default compose(
  inject('form'),
  observer
)(({ form, fullName, fields }) =>
  <View>
  {
    form.allFields.map((field) =>
      <Field key={field.id} field={field} />  
    )
  }
  <Button onPress={form.getSection('insured').save} title="Save Insured" />
  <Button onPress={form.getSection('insured').load} title="Load Insured" />
  <Text>{ 'FullName : ' + form.allSections[0].fullName }</Text>
  <Text>{ JSON.stringify(form.getModel(), null, 4) }</Text>
  <Text>{ JSON.stringify(form.getSnapshot(), null, 4) }</Text>
  </View>
)