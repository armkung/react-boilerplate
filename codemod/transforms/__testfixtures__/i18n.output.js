import a from 'b'

const a = __('ก')
const b = `${__('ข')} ${c => c}`
const bb = __(`${a} ขข ${c}`, '${a} ขข ${c}')
const bbb = `${a} <div>${__('ขขข')}</div> ${c}`
const c = {
  'd': __('ค'),
  'คค': __('ค')
}
const d = <div>{__('ง')}  { p }</div>
const dd = <div>{ q } { <div>{__('ง')}</div> }  { p }</div>