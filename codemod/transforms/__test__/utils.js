const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec


function runTransform(modulePath, options = [], inputPath) {
  return new Promise((resolve, reject) => {
    const command = `yarn jscodeshift -t ${modulePath} ${['--dry', '--print', '--run-in-band'].concat(options).join(' ')} ${inputPath}`
    exec(command, function(error, stdout) {
      if (error) {
        reject(error)
        return
      }

      const lines = stdout.split('\n')

      lines.shift()
      lines.shift()
      lines.shift()

      lines.pop()
      lines.pop()
      lines.pop()
      lines.pop()
      lines.pop()
      lines.pop()
      lines.pop()
      lines.pop()

      const output = lines.join('\n')

      resolve(output)

    })
  })
}
exports.runTransform = runTransform

/**
 * Utility function to run a jscodeshift script within a unit test. This makes
 * several assumptions about the environment:
 *
 * - `dirName` contains the name of the directory the test is located in. This
 *   should normally be passed via __dirname.
 * - The test should be located in a subdirectory next to the transform itself.
 *   Commonly tests are located in a directory called __tests__.
 * - `transformName` contains the filename of the transform being tested,
 *   excluding the .js extension.
 * - `testFilePrefix` optionally contains the name of the file with the test
 *   data. If not specified, it defaults to the same value as `transformName`.
 *   This will be suffixed with ".input.js" for the input file and ".output.js"
 *   for the expected output. For example, if set to "foo", we will read the
 *   "foo.input.js" file, pass this to the transform, and expect its output to
 *   be equal to the contents of "foo.output.js".
 * - Test data should be located in a directory called __testfixtures__
 *   alongside the transform and __tests__ directory.
 */
async function runTest(dirName, transformName, options, testFilePrefix) {
  if (!testFilePrefix) {
    testFilePrefix = transformName
  }

  const fixtureDir = path.join(dirName, '..', '__testfixtures__')
  const inputPath = path.join(fixtureDir, testFilePrefix + '.input.js')
  const outputPath = path.join(fixtureDir, testFilePrefix + '.output.js')
  
  // Assumes transform is one level up from __tests__ directory
  const module = path.join(dirName, '..', transformName + '.js')

  const actualOutput = await runTransform(module, options, inputPath)
  const expectedOutput = fs.readFileSync(outputPath, 'utf8')
  
  return {
    actualOutput: actualOutput.trim(),
    expectedOutput: expectedOutput.trim()
  }
}
exports.runTest = runTest

/**
 * Handles some boilerplate around defining a simple jest/Jasmine test for a
 * jscodeshift transform.
 */
function defineTest(dirName, transformName, options, testFilePrefix) {
  const testName = testFilePrefix ?
    `transforms correctly using "${testFilePrefix}" data` :
    'transforms correctly'
  describe(transformName, () => {
    it(testName, async () => {
      const { actualOutput, expectedOutput } = await runTest(dirName, transformName, options, testFilePrefix)
      expect(actualOutput).toEqual(expectedOutput)
    })
  })
}
exports.defineTest = defineTest