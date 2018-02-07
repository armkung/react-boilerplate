const defineTest = require('./utils').defineTest
defineTest(__dirname, 'i18n')



const createI18n = require('../../i18n').default

const json = require('./i18n.json')
const language = 'en'
const __ = createI18n(json, language)

describe('i18n from json', () => {
  it('translate ก to a', () => {
    const result = __('ก')
    expect(result).toEqual('a')
  })
  it('translate `ข ${b}` to hello b', () => {
    const b = 'hello'
    const result = __(`ข ${b === '' ? 'bb':b}`, 'ข ${b === `` ? `bb`:b}', { b })
    expect(result).toEqual('hello b')
  })
})