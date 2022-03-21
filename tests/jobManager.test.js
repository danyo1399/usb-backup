const jobManager = require('../src/jobs/jobManager')
const testUtils = require('./common')

const { newIdNumber } = require('../src/utils')

function testJob (name, id = newIdNumber()) {
  async function executeAsync (log) {
    log.info(`i did something ${id}`)
  }

  async function abort () {

  }

  return { id, executeAsync, context: { context: 'myContext' }, abort, name }
}

function iterate (jobsIterator, cb) {
  return jobsIterator.next().then(j => {
    cb(j)
    return iterate(jobsIterator, cb)
  })
}

function normaliseLogs (logs) {
  logs.forEach(x => {
    x.value.forEach(y => {
      expect(y.timestamp).toBeGreaterThan(0)
      y.timestamp = 0
    })
  })
  return logs
}

describe('ScanDeviceJob', function () {
  const env = testUtils.setupTestEnvironment()
  env.setupDb()

  beforeEach(async function () {
    jobManager.reset()
  })

  describe('getJobLogIterator', function () {
    it('should be able to retrieve logs for job after it has finished running', async function () {
      const logs = []
      const job = testJob('j1')
      job.id = 1
      await jobManager.runJobAsync(job)

      const logsIterator = jobManager.getJobLogIterator(job.id)

      iterate(logsIterator, j => logs.push(j))

      await testUtils.sleep(100)

      expect(normaliseLogs(logs)).toMatchInlineSnapshot(`
        Array [
          Object {
            "done": false,
            "value": Array [
              Object {
                "context": Array [],
                "message": "starting job j1: 1",
                "timestamp": 0,
                "type": "info",
              },
              Object {
                "context": Array [],
                "message": "i did something 1",
                "timestamp": 0,
                "type": "info",
              },
              Object {
                "context": Array [],
                "message": "job completed j1: 1",
                "timestamp": 0,
                "type": "info",
              },
            ],
          },
        ]
      `)
    })
    it('should only return logs for a particular job', async function () {
      const logs = []
      const job1 = testJob('j1', 1)
      const job2 = testJob('j2', 2)
      jobManager.runJobAsync(job1)
      jobManager.runJobAsync(job2)

      const logsIterator = jobManager.getJobLogIterator(job1.id)
      iterate(logsIterator, j => logs.push(j))

      await testUtils.sleep(200)

      expect(normaliseLogs(logs)).toMatchInlineSnapshot(`
Array [
  Object {
    "done": false,
    "value": Array [
      Object {
        "context": Array [],
        "message": "starting job j1: 1",
        "timestamp": 0,
        "type": "info",
      },
    ],
  },
  Object {
    "done": false,
    "value": Array [
      Object {
        "context": Array [],
        "message": "i did something 1",
        "timestamp": 0,
        "type": "info",
      },
      Object {
        "context": Array [],
        "message": "job completed j1: 1",
        "timestamp": 0,
        "type": "info",
      },
    ],
  },
]
`)
    })

    it('should retrieve logs and updates as job is running', async function () {
      const logs = []
      const job = testJob('j1', 1)

      jobManager.runJobAsync(job)

      const logsIterator = jobManager.getJobLogIterator(job.id)
      iterate(logsIterator, j => logs.push(j))

      await testUtils.sleep(200)

      expect(normaliseLogs(logs)).toMatchInlineSnapshot(`
Array [
  Object {
    "done": false,
    "value": Array [
      Object {
        "context": Array [],
        "message": "starting job j1: 1",
        "timestamp": 0,
        "type": "info",
      },
    ],
  },
  Object {
    "done": false,
    "value": Array [
      Object {
        "context": Array [],
        "message": "i did something 1",
        "timestamp": 0,
        "type": "info",
      },
      Object {
        "context": Array [],
        "message": "job completed j1: 1",
        "timestamp": 0,
        "type": "info",
      },
    ],
  },
]
`)
    })
  })

  describe('getJobsIterator', function () {
    it('should not emit when no jobs run', async function () {
      const jobs = []
      const jobsIterator = jobManager.getJobChangeIterator()

      iterate(jobsIterator, j => jobs.push(j))

      await testUtils.sleep(100)

      expect(jobs).toHaveLength(0)
    })

    it('should emit job when one job run before we initialise iterator', async function () {
      const jobs = []
      await jobManager.runJobAsync(testJob('j1'))
      await testUtils.sleep(100)

      const jobsIterator = jobManager.getJobChangeIterator()

      iterate(jobsIterator, j => jobs.push(j))

      await testUtils.sleep(100)
      expect(jobs).toHaveLength(1)
      jobs.forEach(j => { delete j.value.id })
      expect(jobs).toMatchInlineSnapshot(`
Array [
  Object {
    "done": false,
    "value": Array [
      Object {
        "active": false,
        "context": Object {
          "context": "myContext",
        },
        "id": 1,
        "name": "j1",
        "status": "success",
      },
    ],
  },
]
`)
    })

    it('should emit one job when one job run after iterator initialised', async function () {
      const jobs = []
      const jobsIterator = jobManager.getJobChangeIterator()

      iterate(jobsIterator, j => jobs.push(j))

      await jobManager.runJobAsync(testJob('j1'))
      await testUtils.sleep(100)

      jobs.forEach(j => { j.value.forEach(y => delete y.id) })
      expect(jobs).toMatchInlineSnapshot(`
Array [
  Object {
    "done": false,
    "value": Array [
      Object {
        "active": true,
        "context": Object {
          "context": "myContext",
        },
        "name": "j1",
        "status": "pending",
      },
    ],
  },
  Object {
    "done": false,
    "value": Array [
      Object {
        "active": true,
        "context": Object {
          "context": "myContext",
        },
        "name": "j1",
        "status": "running",
      },
    ],
  },
  Object {
    "done": false,
    "value": Array [
      Object {
        "active": false,
        "context": Object {
          "context": "myContext",
        },
        "name": "j1",
        "status": "success",
      },
    ],
  },
]
`)
    })

    it('should wait till one job finishes before running second job', async function () {
      const jobs = []
      const jobsIterator = jobManager.getJobChangeIterator()
      jobManager.runJobAsync(testJob('j1'))
      jobManager.runJobAsync(testJob('j2'))
      iterate(jobsIterator, j => jobs.push(j))

      await testUtils.sleep(500)

      jobs.forEach(j => { j.value.forEach(x => delete x.id) })
      expect(jobs).toMatchInlineSnapshot(`
Array [
  Object {
    "done": false,
    "value": Array [
      Object {
        "active": true,
        "context": Object {
          "context": "myContext",
        },
        "name": "j1",
        "status": "pending",
      },
      Object {
        "active": true,
        "context": Object {
          "context": "myContext",
        },
        "name": "j2",
        "status": "pending",
      },
    ],
  },
  Object {
    "done": false,
    "value": Array [
      Object {
        "active": true,
        "context": Object {
          "context": "myContext",
        },
        "name": "j1",
        "status": "running",
      },
    ],
  },
  Object {
    "done": false,
    "value": Array [
      Object {
        "active": false,
        "context": Object {
          "context": "myContext",
        },
        "name": "j1",
        "status": "success",
      },
    ],
  },
  Object {
    "done": false,
    "value": Array [
      Object {
        "active": true,
        "context": Object {
          "context": "myContext",
        },
        "name": "j2",
        "status": "running",
      },
    ],
  },
  Object {
    "done": false,
    "value": Array [
      Object {
        "active": false,
        "context": Object {
          "context": "myContext",
        },
        "name": "j2",
        "status": "success",
      },
    ],
  },
]
`)
    })

    it('should emit both jobs when jobs added before and after iterator initialisation', async function () {
      const jobs = []
      const jobsIterator = jobManager.getJobChangeIterator()
      await jobManager.runJobAsync(testJob('j1'))

      iterate(jobsIterator, j => jobs.push(j))

      await jobManager.runJobAsync(testJob('j2'))
      await testUtils.sleep(100)

      jobs.forEach(j => { j.value.forEach(x => delete x.id) })
      expect(jobs).toMatchInlineSnapshot(`
Array [
  Object {
    "done": false,
    "value": Array [
      Object {
        "active": true,
        "context": Object {
          "context": "myContext",
        },
        "name": "j1",
        "status": "pending",
      },
      Object {
        "active": true,
        "context": Object {
          "context": "myContext",
        },
        "name": "j1",
        "status": "running",
      },
      Object {
        "active": false,
        "context": Object {
          "context": "myContext",
        },
        "name": "j1",
        "status": "success",
      },
    ],
  },
  Object {
    "done": false,
    "value": Array [
      Object {
        "active": true,
        "context": Object {
          "context": "myContext",
        },
        "name": "j2",
        "status": "pending",
      },
    ],
  },
  Object {
    "done": false,
    "value": Array [
      Object {
        "active": true,
        "context": Object {
          "context": "myContext",
        },
        "name": "j2",
        "status": "running",
      },
    ],
  },
  Object {
    "done": false,
    "value": Array [
      Object {
        "active": false,
        "context": Object {
          "context": "myContext",
        },
        "name": "j2",
        "status": "success",
      },
    ],
  },
]
`)
    })
  })
})
