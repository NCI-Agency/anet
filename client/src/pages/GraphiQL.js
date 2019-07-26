import { PAGE_PROPS_NO_NAV } from "actions"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import React from "react"
import { connect } from "react-redux"

var GraphiQLreq = null /* required later */

class GraphiQL extends Page {
  static propTypes = { ...pagePropTypes }

  constructor(props) {
    super(props, PAGE_PROPS_NO_NAV)
  }

  componentDidMount() {
    super.componentDidMount()
    if (GraphiQLreq) {
      return
    }

    import("graphiql").then(importedModule => {
      GraphiQLreq = importedModule.default
      require("graphiql/graphiql.css")
      this.forceUpdate()
    })
  }

  fetch(params) {
    return fetch("/graphql", {
      credentials: "same-origin",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(params)
    }).then(response => response.json())
  }

  render() {
    // TODO: fix the below hack with inlined height after layout refactoring in NCI-Agency/anet#551
    return (
      <div style={{ height: "600px" }}>
        {GraphiQLreq ? <GraphiQLreq fetcher={this.fetch} /> : "Loading..."}
      </div>
    )
  }
}

export default connect(
  null,
  mapDispatchToProps
)(GraphiQL)
