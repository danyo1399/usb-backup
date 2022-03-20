
exports.FileTreeWalkerPathError = class extends Error {
  constructor (path) {
    super(`Failed to process path ${path}`)
    this.path = path
  }
}
