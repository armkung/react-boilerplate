const bbb = fn(a, b, c)
const ccc = fn(
  a,
  flow(
    d,
    e,
    f
  ),
  c
)
const aaa = flow(
  a(bb(), n),
  b(lll(['bbbbb'], 'pppp')),
  c
)
export const havePayer = createSelector(
  getCurrentApp,
  flow(getQuickQuoteHavePayer, isEqual(true))
)