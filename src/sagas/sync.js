import { takeEvery } from 'redux-saga/effects'
import { query } from 'core/service/app'

const onSync = function*() {
  query
  .list()
  .then(data => console.log(data))
  // .catch(error => console.error(error))
}

export default function*() {
  // yield takeEvery('PATCH_FORM', onSync)
}