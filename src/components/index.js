import styled from 'styled-components/native'
import * as components from 'react-native'

components.Picker.propTypes = null

export const View = components.View
export const Text = components.Text
export const Button = components.Button
export const TextInput = components.TextInput

export const Picker = styled(components.Picker)`
  background-color: white;
  padding: 20px;
`

export const Label = styled(components.Text)`
  color: red;
`
