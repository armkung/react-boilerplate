import { get, omit, debounce, noop } from 'libs/fp'
import { lifecycle, compose, withState, mapProps, withHandlers, withProps } from 'recompose'

export default (
  debounceDuration = 600, eventName = 'onChange', getValue = (evt) => evt.target.value
) => compose(
	withState('localValue', 'updateLocalValue', get('value')),
	withHandlers((props) => {
    let isFocus = false
    let isDirty = false

    let lastValue = props.localValue
    const onChange = props[eventName]
    const onDebounceChange = debounce(debounceDuration, (value) => {
      if (isFocus && isDirty) {
        onChange(value)
        isDirty = false
      }
    })

		return {
      isFocus: () => () => isFocus,
      isDirty: () => () => isDirty,
			onFocus: ({ onFocus = noop }) => (...args) => {
        onFocus(...args)

        isFocus = true
        isDirty = false
      },
			onBlur: ({ value, localValue, onBlur = noop }) => (...args) => {
        onBlur(...args)
        if (isDirty && value !== localValue) {
          onChange(lastValue)
        }

        isFocus = false
        isDirty = false
      },
      onDestroy: ({ value, localValue, onBlur = noop }) => () => {
        if (isDirty && value !== localValue) {
          onChange(lastValue)
        }

        isFocus = false
        isDirty = false
      },
      [eventName]: ({ updateLocalValue }) => (...args) => {
        const value = getValue(...args)

        isDirty = true
        lastValue = value
        updateLocalValue(value)
        onDebounceChange(value)
      }
		}
	}),
	lifecycle({
    componentWillUnmount() {
      this.props.onDestroy()
    },
		componentWillReceiveProps(nextProps) {
			if (this.props.localValue !== nextProps.value && !this.props.isDirty()) {
				this.props.updateLocalValue(nextProps.value)
			}
		}
  }),
	withProps(({ isFocus, value, localValue }) => {
		if(isFocus()) {
			return { value: localValue }
		}
		return { value }
	}),
	mapProps(omit(['isFocus', 'isDirty', 'localValue', 'updateLocalValue', 'onDestroy']))
)