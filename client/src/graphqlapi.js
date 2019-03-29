import API from "api"

class GraphQLPart {
  constructor(queryString) {
    this.queryString = queryString
    this.variables = []
  }

  addVariable(varName, varType, varValue) {
    this.variables.push({
      name: varName,
      type: varType,
      value: varValue
    })

    return this
  }
}

const GQL = {
  // Pass a variable number of GraphQLQuery to run
  _runCommon(parts, apiCall, output) {
    let query = parts.map(p => p.queryString).join(",\n")
    let variables = {}
    let variableDefs = []
    parts.forEach(part => {
      part.variables.forEach(variable => {
        variables[variable.name] = variable.value
        variableDefs.push(`$${variable.name}: ${variable.type}`)
      })
    })

    let variableDef = "(" + variableDefs.join(", ") + ")"

    return apiCall(query, variables, variableDef, output)
  },

  run(parts) {
    return this._runCommon(parts, API.query)
  },

  runExport(parts, output) {
    return this._runCommon(parts, API.queryExport, output)
  },

  Part: GraphQLPart
}

export default GQL
