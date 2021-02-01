export const isNullOrUndefined = value => {
  return value === null || value === undefined
}

Object.forEach = function(source, func) {
  return Object.keys(source).forEach(key => {
    func(key, source[key])
  })
}

Object.map = function(source, func) {
  return Object.keys(source).map(key => {
    const value = source[key]
    return func(key, value)
  })
}

Object.get = function(source, keypath) {
  const keys = keypath.split(".")
  while (keys[0]) {
    const key = keys.shift()
    source = source[key]
    if (isNullOrUndefined(source)) {
      return source
    }
  }
  return source
}

Object.without = function(source, ...keys) {
  const copy = Object.assign({}, source)
  let i = keys.length
  while (i--) {
    const key = keys[i]
    copy[key] = undefined
    delete copy[key]
  }
  return copy
}

// eslint-disable-next-line
Promise.prototype.log = function () {
  return this.then(function(data) {
    console.log(data)
    return data
  })
}
