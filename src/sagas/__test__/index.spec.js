import { noop } from 'libs/fp'
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware, { delay } from 'redux-saga'
import { getContext, fork, call, take, cancel, put, cancelled } from 'redux-saga/effects'
import { expectSaga } from 'redux-saga-test-plan'

describe('saga', () => {
  describe('getContext', () => {
    const context = {
      service: {}
    }
    const sagaMiddleware = createSagaMiddleware({
      context
    })

    beforeAll(() => {
      createStore(
        noop,
        applyMiddleware(sagaMiddleware)
      )
    })

    it('return service', async() => {
      const result = await sagaMiddleware.run(function*() {
        const service = yield getContext('service')
        return service
      }).done

      expect(result).toEqual(context.service)
    })
  })
  describe('fork', () => {
    const saga = function* (service) {
      const worker = function*() {
        while (true) {
          if (yield cancelled()) break

          yield delay(0)
          
          yield call(service)

          yield put({ type: 'UPDATE' })
        }
      }
      
      const task = yield fork(worker)

      yield take('CANCEL')

      yield cancel(task)
    }
    it('dispatch update', () => {
      const service = jest.fn()
      return expectSaga(saga, service)
        .put({ type: 'UPDATE' })
        .silentRun()
    })
    it('cancel task', async() => {
      const service = jest.fn()
      return expectSaga(saga, service)
        .put({ type: 'UPDATE' })
        .delay(0)
        .dispatch({ type: 'CANCEL' })
        .run()
    })
  })
})