import * as globals from './globals.js'
const { createClient } = globals.graphqlWs

/*
Common Graphql
==================================================================================
*/
const client = createClient({
  url: `ws://localhost:${Number(window.location.port) + 1}/graphql`
})

export function execute (payload) {
  return new Promise((resolve, reject) => {
    const rejectWithLog = (err) => {
      console.error('Api error occured', err)
      reject(err[0])
    }
    let result
    client.subscribe(payload, {
      next: (data) => (result = data),
      error: rejectWithLog,
      complete: () => result.errors && result.errors.length > 0 ? rejectWithLog(result.errors) : resolve(result)
    })
  })
}

export function subscribe (payload) {
  const pending = []
  let throwMe = null
  let done = false
  let deferred = null

  const dispose = client.subscribe(payload, {
    next: (data) => {
      pending.push(data)
      deferred?.resolve(false)
    },
    error: (err) => {
      throwMe = err
      deferred?.reject(throwMe)
    },
    complete: () => {
      done = true
      deferred?.resolve(true)
    }
  })

  return {
    [Symbol.asyncIterator] () {
      return this
    },
    async next () {
      if (done) return { done: true, value: undefined }
      if (throwMe) throw throwMe
      if (pending.length) return { value: pending.shift() }

      return (await new Promise((resolve, reject) => (deferred = { resolve, reject })))
        ? { done: true, value: undefined }
        : { value: pending.shift() }
    },
    async throw (err) {
      throw err
    },
    async return () {
      dispose()
      return { done: true, value: undefined }
    }
  }
}

;(async () => {
  // const result = await execute({ query: 'query { sourceDevices {name, description} }' })
  // console.log(result)
  // const result = await execute({
  //   query: `mutation ( $test: SomeName) {
  //     testMutate(input: {zname: $test})
  // }`,
  //   variables: { test: 'boo' },
  // })
  // console.log('lol mutate response', result)
  // const subscription = subscribe({
  //   query: `subscription {
  //     jobs {
  //       id, name, context, status
  //     }
  //   }
  //     `

  // })
  // subscription.return() to dispose
  // for await (const result of subscription) {
  //   console.log('lol job event', result)
  // }
  // complete
})()
