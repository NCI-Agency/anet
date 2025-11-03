import { gqlAdminSettingsFields } from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import { useEffect, useMemo, useRef } from "react"
import { useLocation } from "react-router-dom"
import Version from "version"

const GQL_POLLING_REQUEST = gql`
  query {
    projectVersion
    ${gqlAdminSettingsFields}
  }
`

const POLL_INTERVAL_IN_MS = 60_000 // milliseconds

export const usePollingRequest = () => {
  const { error, data, stopPolling } = API.useApiQuery(
    GQL_POLLING_REQUEST,
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

  const adminSettings = useMemo(() => {
    const list = data?.adminSettings || []
    if (!list.length) {
      return undefined
    }
    const output = {}
    for (const setting of list) {
      output[setting.key] = setting.value
    }
    return output
  }, [data?.adminSettings])

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
    adminSettings,
    newVersion,
    error: !!error
  }
}
