import {
  ApolloClient,
  ApolloLink,
  CombinedGraphQLErrors,
  HttpLink,
  InMemoryCache,
  NetworkStatus,
  ServerError
} from "@apollo/client"
import { RemoveTypenameFromVariablesLink } from "@apollo/client/link/remove-typename"
import { RetryLink } from "@apollo/client/link/retry"
import { useQuery } from "@apollo/client/react"
import { keycloak } from "keycloak"
import { toast } from "react-toastify"

const GRAPHQL_ENDPOINT = "/graphql"
const LOGGING_ENDPOINT = "/api/logging/log"

const removeTypenameLink = new RemoveTypenameFromVariablesLink()

const authMiddleware = new ApolloLink((operation, forward) => {
  const [authHeaderName, authHeaderValue] = API._getAuthHeader()
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      Accept: "application/json",
      [authHeaderName]: authHeaderValue
    }
  }))

  return forward(operation)
})

const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
  fetchOptions: {
    credentials: "same-origin"
  }
})

const retryLink = new RetryLink({
  attempts: {
    retryIf: error => error?.statusCode === 503
  }
})

const API = {
  _fetch(url, data, accept = "application/json", output = undefined) {
    const [authHeaderName, authHeaderValue] = API._getAuthHeader()
    const params = {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: accept,
        [authHeaderName]: authHeaderValue
      }
    }

    const fullUrl = output ? `${url}?output=${encodeURIComponent(output)}` : url
    return window.fetch(fullUrl, params)
  },

  queryExport(query, variables, output, accept = "application/octet-stream") {
    // Can't use client here as the response is not JSON
    return API._fetch(
      GRAPHQL_ENDPOINT,
      { query: query.loc.source.body, variables },
      accept,
      output
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
    // ignore some sporadic, annoying, unimportant errors from ResizeObserver
    if (
      message !== "ResizeObserver loop limit exceeded" &&
      message !==
        "ResizeObserver loop completed with undelivered notifications."
    ) {
      // Can't use client here as we need to send to a different endpoint
      API._fetch(LOGGING_ENDPOINT, [{ severity, url, lineNr, message }])
    }
  },

  _handleSuccess(response) {
    return response.data
  },

  _handleError(response) {
    const result = {}
    let error
    // When the result returns a list of errors we only show the first one
    if (CombinedGraphQLErrors.is(response)) {
      error = response.errors?.[0]?.message
    } else if (ServerError.is(response)) {
      if (response.response) {
        result.status = response.response.status
      } else {
        result.status = response.statusCode
        result.statusText = response.name
      }
      if (response.bodyText) {
        try {
          const json = JSON.parse(response.bodyText)
          error = json.errors?.[0]?.message
        } catch {
          error = response.message
        }
      } else if (result.status === 500) {
        error =
          "An error occurred! Please contact the administrator and let them know what you were doing to get this error"
      }
      // In case of 503's, show a toast warning
      if (result.status === 503) {
        toast.warning(
          "Some requests could not be completed due to temporary service unavailability.",
          {
            toastId: "503-message",
            autoClose: false
          }
        )
      }
    }
    // Try to pick the most specific message
    result.message =
      error ||
      response?.message ||
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

  useApiQuery(query, variables, others) {
    const results = useQuery(query, { variables, ...others })
    if (
      !results.loading &&
      results.networkStatus === NetworkStatus.error &&
      !results.errorWasHandled
    ) {
      results.errorWasHandled = true
      results.error = API._handleError(results.error)
    }
    return results
  },

  _getAuthHeader: function () {
    if (keycloak.token) {
      return ["Authorization", `Bearer ${keycloak.token}`]
    }
    return []
  },

  client: new ApolloClient({
    link: ApolloLink.from([
      removeTypenameLink,
      authMiddleware,
      retryLink,
      httpLink
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
        fetchPolicy: "no-cache",
        notifyOnNetworkStatusChange: false
      },
      mutate: {
        fetchPolicy: "no-cache"
      }
    }
  })
}

export default API
