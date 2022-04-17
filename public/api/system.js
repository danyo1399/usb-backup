import { execute } from './graphql.js'

export async function getVersionAsync () {
  const { data: { version } } = await execute({
    query: `
            query {
              version
            }
        `
  })
  return version
}
