import { execute } from '../graphql.js'

export async function getFilesByDeviceId (deviceId) {
  const { data: { filesByDeviceId } } = await execute({
    query: `
            query ($input: FilesByDeviceIdRequest) {
              filesByDeviceId(input: $input) {
                id, hash, size, relativePath, mtimeMs
                }
            }
        `,
    variables: {
      input: {
        deviceId: deviceId
      }
    }
  })
  return filesByDeviceId
}
