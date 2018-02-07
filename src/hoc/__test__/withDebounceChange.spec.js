import { connect, Provider } from 'react-redux'
import { createStore } from 'redux'
import { compose, mapProps } from 'recompose'
import { delay } from 'libs/fp'
import { mount } from 'enzyme'

import withDebounceChange from '../withDebounceChange'

describe('withDebounceChange', () => {
  const DEBOUNCE_DURATION = 0
  const hoc = withDebounceChange(
    DEBOUNCE_DURATION,
    'onChange',
    (evt) => evt.target.value
  )
  
  const store = createStore((state, { payload }) => payload)
  const changeState = (payload) => ({ type: 'CHANGE', payload })
  
  const Input = (props) => <input {...props} />
  const Root = compose(
    connect((value) => ({ value })),
    mapProps(({ value }) => ({
      value: value || '',
      onChange: (payload) => store.dispatch(changeState(payload))
    })),
    hoc
  )(Input)

  const wrapper = mount(
    <Provider store={store}>
      <Root />
    </Provider>
  )

  const waitForDelay = () => new Promise(delay(DEBOUNCE_DURATION))

  it('render input', () => {
    expect(wrapper.find(Input)).toHaveLength(1)
  })

  describe('when focus', () => {
    beforeAll(() => {
      wrapper.find(Input).simulate('focus')
      store.dispatch(changeState('test'))
    })
    it('input value is changed after change state', () => {
      wrapper.update()

      expect(wrapper.find(Input).prop('value')).toEqual('test')
    })
  })
  describe('when change some input value', () => {
    beforeAll(() => {
      wrapper.find(Input).simulate('change', { target: { value: 'hello' } })
      store.dispatch(changeState('test'))
    })

    it('input value is not changed after change state', () => {
      wrapper.update()
      
      expect(wrapper.find(Input).prop('value')).toEqual('hello')
    })

    it('state is not changed before debounce', () => {
      expect(store.getState()).toEqual('test')
    })
    
    it('state is changed after debounce', async() => {
      await waitForDelay(DEBOUNCE_DURATION)
      expect(store.getState()).toEqual('hello')
    })

  })
  describe('when blur', () => {
    beforeAll(() => {
      wrapper.find(Input).simulate('change', { target: { value: 'hello' } })
      store.dispatch(changeState('test'))
      wrapper.find(Input).simulate('blur')
    })
    
    it('input value is not changed after change state', () => {
      expect(store.getState()).toEqual('hello')
      expect(wrapper.find(Input).prop('value')).toEqual('hello')
    })
  })
  describe('when focus and unmount', () => {
    beforeAll(() => {
      store.dispatch(changeState('test1'))
      wrapper.find(Input).simulate('focus')
      wrapper.find(Input).simulate('change', { target: { value: 'hello' } })
      store.dispatch(changeState('test2'))
    })
   
    it('state is changed after unmount', async() => {
      expect(store.getState()).toEqual('test2')
      wrapper.unmount()
      expect(store.getState()).toEqual('hello')
    })

  })
})