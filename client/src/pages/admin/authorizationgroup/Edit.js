import { PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { AuthorizationGroup } from "models"
import React from "react"
import { connect } from "react-redux"
import AuthorizationGroupForm from "./Form"

const GQL_GET_AUTHORIZATION_GROUP = gql`
  query($uuid: String!) {
    authorizationGroup(uuid: $uuid) {
      uuid
      name
      description
      positions {
        uuid
        name
        code
        type
        status
        organization {
          uuid
          shortName
        }
        person {
          uuid
          name
          rank
          role
        }
      }
      status
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

class AuthorizationGroupEdit extends Page {
  static propTypes = {
    ...pagePropTypes
  }

  static modelName = "AuthorizationGroup"

  state = {
    authorizationGroup: new AuthorizationGroup()
  }

  constructor(props) {
    super(props, PAGE_PROPS_NO_NAV)
  }

  fetchData(props) {
    return API.query(GQL_GET_AUTHORIZATION_GROUP, {
      uuid: props.match.params.uuid
    }).then(data => {
      this.setState({
        authorizationGroup: new AuthorizationGroup(data.authorizationGroup)
      })
    })
  }

  render() {
    const { authorizationGroup } = this.state
    return (
      <div>
        <RelatedObjectNotes
          notes={authorizationGroup.notes}
          relatedObject={
            authorizationGroup.uuid && {
              relatedObjectType: "authorizationGroups",
              relatedObjectUuid: authorizationGroup.uuid
            }
          }
        />
        <AuthorizationGroupForm
          edit
          initialValues={authorizationGroup}
          title={`Authorization Group ${authorizationGroup.name}`}
        />
      </div>
    )
  }
}

export default connect(
  null,
  mapDispatchToProps
)(AuthorizationGroupEdit)
