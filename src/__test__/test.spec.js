import { mount } from 'enzyme'
import { compose, lifecycle } from 'recompose'
import 'index'
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

    it('should be update once', () => {
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should be update from prev state', () => {
      expect(wrapper.state()).toEqual({
        a: 0,
        b: 2
      })
    })
  })
})
