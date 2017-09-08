import { combineReducers } from 'redux'

export const isLoading = (state = false, { type }) => {
  switch (type) {
    case 'SHOW_LOADING':
      return true
    case 'HIDE_LOADING':
      return false
    default:
      return state
  }
}

export default {
  ui: combineReducers({
    isLoading
  })
}