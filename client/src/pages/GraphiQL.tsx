import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import GraphiQL from "graphiql"
import "graphiql/graphiql.css"
import React from "react"
import { connect } from "react-redux"

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
  // TODO: fix the below hack with inlined height after layout refactoring in NCI-Agency/anet#551
  return (
    <div style={{ height: "600px" }}>
      <GraphiQL fetcher={fetch} />
    </div>
  )

  function fetch(params) {
    const { operationName, variables } = params
    const query = gql`
      ${params.query}
    `
    return API.client.query({ operationName, query, variables })
  }
}

export default connect(null, mapPageDispatchersToProps)(GraphiQLContainer)
