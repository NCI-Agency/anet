import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { AuthorizationGroup } from "models"
import React from "react"
import { connect } from "react-redux"
import AuthorizationGroupForm from "./Form"

interface AuthorizationGroupNewProps {
  pageDispatchers?: PageDispatchersPropType
}

const AuthorizationGroupNew = ({
  pageDispatchers
}: AuthorizationGroupNewProps) => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("New Authorization Group")

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

export default connect(null, mapPageDispatchersToProps)(AuthorizationGroupNew)
