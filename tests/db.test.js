const db = require('../src/db')
const { setupTestEnvironment } = require('./common')

describe('db tests', () => {
  const env = setupTestEnvironment()
  env.setupDb()

  it('db migrations should have run', async () => {
    const nextVersion = await db.nextVersionAsync()
    expect(nextVersion).toBe(1)
  })
})
