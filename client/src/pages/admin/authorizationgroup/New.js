import { PAGE_PROPS_NO_NAV } from "actions"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import { AuthorizationGroup } from "models"
import React from "react"
import { connect } from "react-redux"
import AuthorizationGroupForm from "./Form"

class AuthorizationGroupNew extends Page {
  static propTypes = {
    ...pagePropTypes
  }

  state = {
    authorizationGroup: new AuthorizationGroup()
  }

  constructor(props) {
    super(props, PAGE_PROPS_NO_NAV)
  }

  render() {
    const { authorizationGroup } = this.state
    return (
      <div>
        <AuthorizationGroupForm
          initialValues={authorizationGroup}
          title="Create a new Authorization Group"
        />
      </div>
    )
  }
}

export default connect(
  null,
  mapDispatchToProps
)(AuthorizationGroupNew)
