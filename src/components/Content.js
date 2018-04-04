import { compose } from 'recompose'
import { observer, inject } from 'mobx-react'
import { View, Text, Label, Picker, PickerItem, Button, TextInput } from './index'

export default compose(
  inject('form'),
  observer
)(({ form }) =>
  <View>
  {
    form.getFields().map((field) => {
      return (
        <View key={field.key}>
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
          ):(
            <TextInput disabled={field.hidden}
            value={field.value}
            onChange={(evt)=>field.setValue(evt.target.value)} />
          )}
        </View>
      )
    })
  }
  <Button onPress={form.getSection('insured').save} title="Save Insured" />
  <Button onPress={form.getSection('insured').load} title="Load Insured" />
  <Text>{ 'FullName : ' + form.getSections()[0].getFullName() }</Text>
  <Text>{ JSON.stringify(form.getModel(), null, 4) }</Text>
  <Text>{ JSON.stringify(form.getSnapshot(), null, 4) }</Text>
  </View>
)