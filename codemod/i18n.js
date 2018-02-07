import { template, get } from 'lodash/fp'

export default (json, language) => (text, templateString, args) => {
  if (templateString) {
    return template(
      get([templateString, language], json),
    )(args)
  }
  return get([text, language], json)
}
