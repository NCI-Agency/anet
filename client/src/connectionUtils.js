import { gql } from "@apollo/client"
import API from "api"
import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import Version from "version"

const GQL_GET_VERSION_INFO = gql`
  query {
    projectVersion
  }
`

const POLL_INTERVAL_IN_MS = 60_000 // milliseconds

export const useConnectionInfo = () => {
  const { error, data, stopPolling } = API.useApiQuery(
    GQL_GET_VERSION_INFO,
    {},
    {
      pollInterval: POLL_INTERVAL_IN_MS,
      context: {
        headers: {
          "x-activity": "ignore"
        }
      }
    }
  )

  const { pathname } = useLocation()
  const prevLocation = useRef(pathname)

  const fetchedVersion = data?.projectVersion

  // if there is no error and the version doesn't match, we have a new version
  const newVersion =
    !error && fetchedVersion !== Version ? fetchedVersion : null

  useEffect(() => {
    // stop it when we unmount, maybe Apollo does it maybe not
    return () => stopPolling()
  }, [stopPolling])

  useEffect(() => {
    // when there is a newVersion and location changed, automatically update ANET version
    if (pathname !== prevLocation.current) {
      prevLocation.current = pathname
      if (newVersion) {
        window.location.reload()
      }
    }
  }, [pathname, newVersion])

  return {
    newVersion,
    error: !!error
  }
}
