import API from "api"
import Fieldset from "components/Fieldset"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import React from "react"
import { connect } from "react-redux"
import AuthorizationGroupTable from "./AuthorizationGroupTable"

class AuthorizationGroups extends Page {
  static propTypes = { ...pagePropTypes }

  constructor(props) {
    super(props)

    this.state = {
      authorizationGroups: []
    }
  }

  fetchData(props) {
    const query = {
      pageSize: 0 // retrieve all
    }
    return API.query(
      /* GraphQL */ `
        authorizationGroupList(query: $query) {
          list {
            uuid
            name
            description
            positions {
              uuid
              name
              type
            }
            status
          }
        }
      `,
      { query },
      "($query: AuthorizationGroupSearchQueryInput)"
    ).then(data => {
      this.setState({ authorizationGroups: data.authorizationGroupList.list })
    })
  }

  render() {
    return (
      <div>
        <Fieldset title="Authorization Groups">
          <AuthorizationGroupTable
            authorizationGroups={this.state.authorizationGroups}
          />
        </Fieldset>
      </div>
    )
  }
}

export default connect(
  null,
  mapDispatchToProps
)(AuthorizationGroups)
