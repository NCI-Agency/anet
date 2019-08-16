import querystring from "querystring"
import ApolloClient, { gql } from "apollo-boost"
import { InMemoryCache } from "apollo-cache-inmemory"
import _isEmpty from "lodash/isEmpty"

const useApollo = true
const client = new ApolloClient({
  uri: "/graphql",
  cache: new InMemoryCache({
    addTypename: false,
    dataIdFromObject: object => object.uuid || null
  }),
  fetchOptions: {
    credentials: "same-origin"
  },
  request: operation => {
    let headers = {
      accept: "application/json"
    }
    const authHeader = BaseAPI._getAuthHeader()
    if (authHeader) {
      headers[authHeader[0]] = authHeader[1]
    }
    operation.setContext({ headers })
  }
})
// Have to initialise this after creating the client
// (see https://github.com/apollographql/apollo-client/issues/3900)
client.defaultOptions = {
  query: {
    fetchPolicy: "no-cache"
  },
  watchQuery: {
    fetchPolicy: "no-cache"
  },
  mutate: {
    fetchPolicy: "no-cache"
  }
}

const BaseAPI = {
  _fetch(pathName, params, accept) {
    params = params || {}
    params.credentials = "same-origin"

    params.headers = params.headers || {}
    params.headers.Accept = accept || "application/json"
    const authHeader = BaseAPI._getAuthHeader()
    if (authHeader) {
      params.headers[authHeader[0]] = authHeader[1]
    }

    return window.fetch(pathName, params).then(response => {
      let isOk = response.ok
      if (response.headers.get("content-type") === "application/json") {
        let respBody = response.json()
        if (!isOk) {
          return respBody.then(r => {
            // When the result returns a list of errors we only show the first one
            if (r.errors) {
              r.error = r.errors[0].message
            }
            r.status = response.status
            r.statusText = response.statusText
            if (!r.message) {
              r.message =
                r.error || "You do not have permissions to perform this action"
            }
            return Promise.reject(r)
          })
        }
        return respBody
      }

      if (!isOk) {
        if (response.status === 500) {
          response.message =
            "An Error occured! Please contact the administrator and let them know what you were doing to get this error"
        }
        response = Promise.reject(response)
      }

      return response
    })
  },

  _send(url, data, params) {
    params = params || {}
    params.method = params.method || "POST"
    params.body = JSON.stringify(data)

    params.headers = params.headers || {}
    params.headers["Content-Type"] = "application/json"

    return BaseAPI._fetch(url, params)
  },

  _queryCommon(query, variables, variableDef, output, isMutation, params) {
    return BaseAPI._send(
      "/graphql",
      BaseAPI._buildGraphQl(query, variables, variableDef, output, isMutation),
      params
    )
  },

  _buildGraphQl(query, variables, variableDef, output, isMutation) {
    variables = variables || {}
    variableDef = variableDef || ""
    const queryType = isMutation ? "mutation" : "query"
    query = queryType + " " + variableDef + " { " + query + " }"
    output = output || ""
    return { query, variables, output }
  },

  mutation(query, variables, variableDef, params) {
    const f = useApollo ? BaseAPI.mutationApollo : BaseAPI.mutationOld
    return f(query, variables, variableDef, params)
  },

  mutationOld(query, variables, variableDef, params) {
    return BaseAPI._queryCommon(
      query,
      variables,
      variableDef,
      undefined,
      true,
      params
    ).then(json => json.data)
  },

  query(query, variables, variableDef, params) {
    const f = useApollo ? BaseAPI.queryApollo : BaseAPI.queryOld
    return f(query, variables, variableDef, params)
  },

  queryOld(query, variables, variableDef, params) {
    return BaseAPI._queryCommon(
      query,
      variables,
      variableDef,
      undefined,
      undefined,
      params
    ).then(json => json.data)
  },

  queryExport(query, variables, variableDef, output) {
    return BaseAPI._queryCommon(query, variables, variableDef, output).then(
      response => response.blob()
    )
  },

  /**
   * Creates a log entry on the server based on the following inputs
   * - severity: one of 'DEBUG','ERROR','FATAL','INFO','WARN'
   * - url: the context url
   * - lineNr: line number of the error
   * - message: The error/log message
   */
  logOnServer(severity, url, lineNr, message) {
    BaseAPI._send("/api/logging/log", [
      { severity: severity, url: url, lineNr: lineNr, message: message }
    ])
  },

  _handleSuccess(response) {
    return response.data
  },

  _handleError(response) {
    // When the result returns a list of errors we only show the first one
    if (!_isEmpty(response.graphQLErrors)) {
      response.error = response.graphQLErrors[0].message
    } else if (response.networkError) {
      if (response.networkError.response) {
        response.status = response.networkError.response.status
        response.statusText = response.networkError.response.statusText
      } else {
        response.status = response.networkError.statusCode
        response.statusText = response.networkError.name
      }
      if (
        response.networkError.result &&
        !_isEmpty(response.networkError.result.errors)
      ) {
        response.message = response.networkError.result.errors[0].message
      } else if (response.status === 500) {
        response.message =
          "An Error occured! Please contact the administrator and let them know what you were doing to get this error"
      }
    }
    if (_isEmpty(response.message)) {
      response.message =
        response.error || "You do not have permissions to perform this action"
    }
    return Promise.reject(response)
  },

  mutationApollo(query, variables, variableDef) {
    const graphQl = BaseAPI._buildGraphQl(
      query,
      variables,
      variableDef,
      undefined,
      true
    )
    return client
      .mutate({
        mutation: gql`
          ${graphQl.query}
        `,
        variables: graphQl.variables
      })
      .then(BaseAPI._handleSuccess)
      .catch(BaseAPI._handleError)
  },

  queryApollo(query, variables, variableDef) {
    const graphQl = BaseAPI._buildGraphQl(query, variables, variableDef)
    return client
      .query({
        query: gql`
          ${graphQl.query}
        `,
        variables: graphQl.variables
      })
      .then(BaseAPI._handleSuccess)
      .catch(BaseAPI._handleError)
  },

  queryExportApollo(query, variables, variableDef, output) {
    const graphQl = BaseAPI._buildGraphQl(query, variables, variableDef, output)
    return client
      .query({
        query: gql`
          ${graphQl.query}
        `,
        variables: graphQl.variables
      })
      .then(BaseAPI._handleSuccess)
      .catch(BaseAPI._handleError)
  },

  _getAuthParams: function() {
    const query = querystring.parse(window.location.search.slice(1))
    if (query.user && query.pass) {
      window.ANET_DATA.creds = {
        user: query.user,
        pass: query.pass
      }
    }
    return window.ANET_DATA.creds
  },

  addAuthParams: function(url) {
    const creds = BaseAPI._getAuthParams()
    if (creds) {
      url += "?" + querystring.stringify(creds)
    }
    return url
  },

  _getAuthHeader: function() {
    const creds = BaseAPI._getAuthParams()
    if (creds) {
      return [
        "Authorization",
        "Basic " + Buffer.from(`${creds.user}:${creds.pass}`).toString("base64")
      ]
    }
    return null
  }
}

export default BaseAPI
