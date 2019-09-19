import API from "api"
import { gql } from "apollo-boost"

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
  _combine(parts) {
    const query = parts.map(p => p.queryString).join("\n")
    let variables = {}
    let variableDefs = []
    parts.forEach(part => {
      part.variables.forEach(variable => {
        variables[variable.name] = variable.value
        variableDefs.push(`$${variable.name}: ${variable.type}`)
      })
    })
    const variableDef = variableDefs.length
      ? "(" + variableDefs.join(", ") + ")"
      : ""
    return { query, variables, variableDef }
  },

  run(parts) {
    const { query, variables, variableDef } = this._combine(parts)
    const graphql = gql`
      query ${variableDef} {
        ${query}
      }
    `
    return API.query(graphql, variables)
  },

  runExport(parts, output) {
    const { query, variables, variableDef } = this._combine(parts)
    const graphql = `
      query ${variableDef} {
        ${query}
      }
    `
    return API.queryExport(graphql, variables, output)
  },

  Part: GraphQLPart
}

export default GQL
