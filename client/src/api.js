import {
  ApolloClient,
  ApolloLink,
  from,
  HttpLink,
  InMemoryCache,
  useQuery
} from "@apollo/client"
import _isEmpty from "lodash/isEmpty"
import { keycloak } from "keycloak"

const GRAPHQL_ENDPOINT = "/graphql"
const LOGGING_ENDPOINT = "/api/logging/log"

const authMiddleware = new ApolloLink((operation, forward) => {
  operation.setContext(({ headers = {} }) => {
    headers = {
      ...headers,
      Accept: "application/json"
    }
    const [authHeaderName, authHeaderValue] = API._getAuthHeader()
    if (authHeaderName && authHeaderValue) {
      headers[authHeaderName] = authHeaderValue
    }
    return { headers }
  })

  return forward(operation)
})

const API = {
  _fetch(url, data, accept) {
    const params = {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: accept || "application/json"
      }
    }
    const [authHeaderName, authHeaderValue] = API._getAuthHeader()
    if (authHeaderName && authHeaderValue) {
      params.headers[authHeaderName] = authHeaderValue
    }

    return window.fetch(url, params)
  },

  queryExport(query, variables, output) {
    // Can't use client here as the response is not JSON
    return API._fetch(
      GRAPHQL_ENDPOINT,
      { query: query.loc.source.body, variables, output },
      "*/*"
    ).then(response => response.blob())
  },

  /**
   * Creates a log entry on the server based on the following inputs
   * - severity: one of 'DEBUG','ERROR','FATAL','INFO','WARN'
   * - url: the context url
   * - lineNr: line number of the error
   * - message: The error/log message
   */
  logOnServer(severity, url, lineNr, message) {
    // Can't use client here as we need to send to a different endpoint
    API._fetch(LOGGING_ENDPOINT, [
      { severity: severity, url: url, lineNr: lineNr, message: message }
    ])
  },

  _handleSuccess(response) {
    return response.data
  },

  _handleError(response) {
    const result = {}
    let error
    // When the result returns a list of errors we only show the first one
    if (!_isEmpty(response.graphQLErrors)) {
      error = response.graphQLErrors[0].message
      if (error.endsWith(" not found")) {
        // Unfortunately, with GraphQL errors Apollo Client doesn't provide the HTTP statusCode
        result.status = 404
      }
    } else if (response.networkError) {
      if (response.networkError.response) {
        result.status = response.networkError.response.status
        result.statusText = response.networkError.response.statusText
      } else {
        result.status = response.networkError.statusCode
        result.statusText = response.networkError.name
      }
      if (
        response.networkError.result &&
        !_isEmpty(response.networkError.result.errors)
      ) {
        error = response.networkError.result.errors[0].message
      } else if (result.status === 500) {
        error =
          "An Error occured! Please contact the administrator and let them know what you were doing to get this error"
      }
    }
    // Try to pick the most specific message
    result.message =
      error ||
      response.message ||
      "You do not have permissions to perform this action"
    return result
  },

  mutation(mutation, variables) {
    return API.client
      .mutate({ mutation, variables })
      .then(API._handleSuccess)
      .catch(response => Promise.reject(API._handleError(response)))
  },

  query(query, variables) {
    return API.client
      .query({ query, variables })
      .then(API._handleSuccess)
      .catch(response => Promise.reject(API._handleError(response)))
  },

  useApiQuery(query, variables) {
    const results = useQuery(query, { variables })
    results.error = results.error && API._handleError(results.error)
    return results
  },

  _getAuthHeader: function() {
    if (keycloak.token) {
      return ["Authorization", `Bearer ${keycloak.token}`]
    }
    return []
  },

  client: new ApolloClient({
    link: from([
      authMiddleware,
      new HttpLink({
        uri: GRAPHQL_ENDPOINT
      })
    ]),
    cache: new InMemoryCache({
      addTypename: false,
      dataIdFromObject: object => object.uuid || null
    }),
    defaultOptions: {
      query: {
        fetchPolicy: "no-cache"
      },
      watchQuery: {
        fetchPolicy: "no-cache"
      },
      mutate: {
        fetchPolicy: "no-cache"
      }
    },
    fetchOptions: {
      credentials: "same-origin"
    }
  })
}

export default API
