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
  combine(parts) {
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

  getGqlQuery(parts) {
    const { query, variables, variableDef } = this.combine(parts)
    return {
      query: gql`
        query ${variableDef} {
        ${query}
      }`,
      variables
    }
  },

  Part: GraphQLPart
}

export default GQL
