exports.assertNewMetafileCorrect = (device, metafile) => {
  expect(metafile).toMatchInlineSnapshot(`
  Object {
    "deviceType": "${device.deviceType}",
    "files": Array [],
    "id": "${device.id}",
    "name": "${device.name}",
    "path": "${device.path.replaceAll('\\', '\\\\')}",
  }
  `)
}
