var a = {
  c: 10
}
a['c']
a('c')
a(['c'])
a = a.c
const a = ({ c }) => (
  <div>{ c }</div>
)