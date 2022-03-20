const fileTreeWalkerAsync = require('../src/fileTreeWalker')
const path = require('path')
const testUtils = require('./common')

describe('file tree walker tests', function () {
  // const env = testUtils.setupTestEnvironment()

  it('walks all files in directory', async function () {
    const rootDir = path.resolve(testUtils.testDataPath, 'backup-source')
    const files = []
    await fileTreeWalkerAsync(rootDir, (err, { filename, path, stat, abort }) => {
      if (!err) {
        // normalise delimiter so it works on linux
        files.push(filename.replaceAll('/', '\\'))
      }
    })

    expect(files).toHaveLength(5)
    expect(files[0].endsWith('ico.png'))
    expect(files[1].endsWith('ico2.png'))
    expect(files[2].endsWith('ico2 copy.png'))
    expect(files[3].endsWith('ico4.jfif'))
    expect(files[4].endsWith('ico3.png'))
  })

  it('can abort walking', async function () {
    const rootDir = path.resolve(testUtils.testDataPath, 'backup-source')
    const files = []
    await fileTreeWalkerAsync(rootDir, (err, { filename, path, stat, abort }) => {
      if (!err) {
        // normalise delimiter so it works on linux
        files.push(filename.replaceAll('/', '\\'))
        abort()
      }
    })

    expect(files[0].endsWith('testdata\\backup-source\\ico.png'))
      .toBe(true)
  })
})
