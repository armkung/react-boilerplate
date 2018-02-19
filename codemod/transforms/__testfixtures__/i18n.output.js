import a from 'b'

const a = __('กa')
const b = `${__('ข')} ${c => c}`
const bb = __(`${a} ขข ${c}`, '${a} ขข ${c}', {
  a,
  c
})
const bbb = `${a} <div class="a">${__('ขขข')}</div> ${c}`
const bbbb = __(
  `Email${isMonthly ? ' (ถ้ามี)' : ''}`,
  'Email${isMonthly ? ` (ถ้ามี)` : ``}',
  {
    isMonthly
  }
)
const c = {
  'd': __('ค'),
  'คค': __('ค')
}
const d = <div>{__(`ง  ${p}`, 'ง  ${p}', {
    p
  })}</div>
const dd = <div>{ q } { <div>{__('ง')}</div> }  { p }</div>
const ddd = <div>{__(`ด ${a ? 'ง':'ก'} ท ${p} `, 'ด ${a ? `ง`:`ก`} ท ${p} ', {
    a,
    p
  })}</div>
const dddd = <div>{() => <div>{__('ง')}</div> } {__('ท')}</div>