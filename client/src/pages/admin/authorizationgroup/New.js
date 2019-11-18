import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import {
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import { AuthorizationGroup } from "models"
import React from "react"
import { connect } from "react-redux"
import AuthorizationGroupForm from "./Form"

const AuthorizationGroupNew = props => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    ...props
  })

  const authorizationGroup = new AuthorizationGroup()

  return (
    <div>
      <AuthorizationGroupForm
        initialValues={authorizationGroup}
        title="Create a new Authorization Group"
      />
    </div>
  )
}

AuthorizationGroupNew.propTypes = {
  ...pagePropTypes
}

export default connect(null, mapDispatchToProps)(AuthorizationGroupNew)
