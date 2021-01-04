import API from "api"
import { gql } from "apollo-boost"
import { useEffect } from "react"
import { Version } from "settings"

const GQL_GET_VERSION_INFO = gql`
  query {
    projectVersion
  }
`

const POLL_INTERVAL_IN_MS = 30_000 // milliseconds

export const useConnectionInfo = () => {
  const { error, data, stopPolling } = API.useApiQuery(
    GQL_GET_VERSION_INFO,
    {},
    { pollInterval: POLL_INTERVAL_IN_MS }
  )

  useEffect(() => {
    // stop it when we unmount, maybe Apollo does it maybe not
    return () => stopPolling()
  }, [stopPolling])

  const newVersion = data?.projectVersion
  return {
    // if there is no error and the version doesn't match, we should notify version change
    newVersion: !error && newVersion !== Version ? newVersion : null,
    error: !!error
  }
}
