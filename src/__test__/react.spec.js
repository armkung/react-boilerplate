import { mount } from 'enzyme'
import { compose, lifecycle } from 'recompose'

describe('React Test', () => {
  describe('Rendering with mutiple setState', () => {
    const spy = jest.fn()
    const Component = compose(
      lifecycle({
        componentDidMount() {
          this.setState({ a: 1 })
          this.setState(({ a }) => ({ b: a + 1 }))
          this.setState(() => ({ a: 0 }))
        },
        componentDidUpdate() {
          spy()
        }
      })
    )(() => <div>Test</div>)

    const wrapper = mount(<Component />)

    it('update once', () => {
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('update with merge all state', () => {
      expect(wrapper.state()).toEqual({
        a: 0,
        b: 2
      })
    })
  })
})
