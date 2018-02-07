export const hasClosest = (types, path) => {
  if (!Array.isArray(types)) {
    return closest([types], path)
  }

  let parent = path.parent
  const match = node => types.some(t => t.check(node))
  while (parent) {
    if (match(parent.node)) {
      return true
    }
    parent = parent.parent
  }
  return false
}
