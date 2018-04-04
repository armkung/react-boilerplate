export const getData = () => new Promise(resolve => {
  setTimeout(() => {
    resolve([{ value: '10' }])
  }, 1000)
})