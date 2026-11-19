import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API, { GRAPHQL_ENDPOINT } from "api"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { GraphiQL } from "graphiql"
import "graphiql/setup-workers/webpack"
import { createTransport } from "@graphiql/toolkit"
import { legacy_connect as connect } from "react-redux"

interface GraphiQLContainerProps {
  pageDispatchers?: PageDispatchersPropType
}

const GraphiQLContainer = ({ pageDispatchers }: GraphiQLContainerProps) => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("GraphQL")
  const [authHeaderName, authHeaderValue] = API._getAuthHeader()
  const transport = createTransport({
    url: GRAPHQL_ENDPOINT,
    supportedMethods: ["POST"],
    headers: {
      [authHeaderName]: authHeaderValue
    }
  })
  return (
    <div className="h-100">
      <GraphiQL transport={transport} />
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(GraphiQLContainer)
