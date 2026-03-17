require("@testing-library/jest-dom")

// work-around for "ReferenceError: TextEncoder is not defined"
const { TextEncoder } = require("node:util")
globalThis.TextEncoder = TextEncoder
