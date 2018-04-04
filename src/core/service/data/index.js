export const getData = () => new Promise(resolve => {
  setTimeout(() => {
    resolve([{ value: '10' }, { value: '20' }])
  }, 1000)
})