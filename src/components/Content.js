import React from 'react'
import { observer } from 'mobx-react'
import FormModel from 'core/app'
import { View, Text, Label, Picker, PickerItem, Button, TextInput } from './index'


const Form = observer(
  ({ form }) => (
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
    <Button onPress={form['insured'].save} title="Save Insured" />
    <Button onPress={form['insured'].load} title="Load Insured" />
    <Text>{ JSON.stringify(form.getSnapshot(), null, 4) }</Text>
    </View>
  )
)

export default () => (
  <Form form={FormModel} />
)