module.exports = () => ({
  plugins: [
    require('./patch-lodash-fp.js')
  ]
})