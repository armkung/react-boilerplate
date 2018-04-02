import React from 'react'
import { observer } from 'mobx-react'
import FormModel from 'core/data/form'
import { View, Text, TextInput } from 'components/index'

const Form = observer(({ form }) => {
  const field = form.getFields()[0]
  return (
    <View>
      <TextInput
      value={field.value.value}
      onChange={(evt)=>field.setValue(evt.target.value)} />
      <Text>{ JSON.stringify(form.getSnapshot(), null, 4) }</Text>
    </View>
  )
})

export default () => (
  <Form form={FormModel} />
)