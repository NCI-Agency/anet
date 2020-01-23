import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import * as GraphiQLreq from "graphiql"
import "graphiql/graphiql.css"
import React from "react"
import { connect } from "react-redux"

const GraphiQL = ({ pageDispatchers }) => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  // TODO: fix the below hack with inlined height after layout refactoring in NCI-Agency/anet#551
  return (
    <div style={{ height: "600px" }}>
      <GraphiQLreq fetcher={fetch} />
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

GraphiQL.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(GraphiQL)
