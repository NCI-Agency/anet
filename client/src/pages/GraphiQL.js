import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import GraphiQL from "graphiql"
import "graphiql/graphiql.css"
import React from "react"
import { connect } from "react-redux"

const GraphiQLContainer = ({ pageDispatchers }) => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

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

GraphiQLContainer.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(GraphiQLContainer)
