import querystring from "querystring"
import ApolloClient from "apollo-boost"
import { InMemoryCache } from "apollo-cache-inmemory"
import _isEmpty from "lodash/isEmpty"

const GRAPHQL_ENDPOINT = "/graphql"
const LOGGING_ENDPOINT = "/api/logging/log"
const client = new ApolloClient({
  uri: GRAPHQL_ENDPOINT,
  cache: new InMemoryCache({
    addTypename: false,
    dataIdFromObject: object => object.uuid || null
  }),
  fetchOptions: {
    credentials: "same-origin"
  },
  request: operation => {
    let headers = {
      Accept: "application/json"
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

    const authHeader = BaseAPI._getAuthHeader()
    if (authHeader) {
      params.headers[authHeader[0]] = authHeader[1]
    }

    return window.fetch(url, params)
  },

  queryExport(query, variables, output) {
    // Can't use client here as the response is not JSON
    return BaseAPI._fetch(
      GRAPHQL_ENDPOINT,
      { query, variables, output },
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
    BaseAPI._fetch(LOGGING_ENDPOINT, [
      { severity: severity, url: url, lineNr: lineNr, message: message }
    ])
  },

  _handleSuccess(response) {
    return response.data
  },

  _handleError(response) {
    let result = {}
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
    return Promise.reject(result)
  },

  mutation(mutation, variables) {
    return client
      .mutate({ mutation, variables })
      .then(BaseAPI._handleSuccess)
      .catch(BaseAPI._handleError)
  },

  query(query, variables) {
    return client
      .query({ query, variables })
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
