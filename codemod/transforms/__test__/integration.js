const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec

describe('Integration test', () => {
  const root = path.join(__dirname, '..', '..')
  const fixtureDir = path.join(root, 'transforms', '__testfixtures__')
  const inputPath = path.join(fixtureDir, 'integration.input.js')
  const outputPath = path.join(fixtureDir, 'integration.output.js')

  it('transform correctly', async () => {
    jest.setTimeout(10000)
    
    const oldInput = fs.readFileSync(inputPath, 'utf8')
    await new Promise((resolve, reject) => {
      const options = {
        cwd: root
      }
      exec(`make fix path=${inputPath}`, options, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })

    const actualOutput = fs.readFileSync(inputPath, 'utf8')
    const expectedOutput = fs.readFileSync(outputPath, 'utf8')

    fs.writeFileSync(inputPath, oldInput, 'utf8')

    expect(actualOutput.trim()).toEqual(expectedOutput.trim())
  })

})