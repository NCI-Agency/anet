import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_MIN_HEAD } from "actions"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import React from "react"
import { Button } from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useNavigate } from "react-router-dom"
import Settings from "settings"

interface OnboardingNewProps {
  pageDispatchers?: PageDispatchersPropType
}

const OnboardingNew = ({ pageDispatchers }: OnboardingNewProps) => {
  const routerLocation = useLocation()
  useBoilerplate({
    pageProps: PAGE_PROPS_MIN_HEAD,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Welcome to ANET")
  const navigate = useNavigate()
  const approvalMsg = Settings.automaticallyAllowAllNewUsers
    ? "Let's create a new account for you. We'll grab your basic information and help your superuser get you set up."
    : "Your access to ANET has been requested. While your approval is pending, please take a moment to fill in your profile."

  return (
    <div className="onboarding-new">
      <h1>Welcome to ANET</h1>
      <p>
        ANET is a training system for reporting TAA engagements, and learning
        about past engagements and people.
      </p>
      <p>{approvalMsg}</p>
      <div className="create-account-button-wrapper">
        <Button variant="primary" onClick={onCreateAccountClick}>
          Fill in your profile
        </Button>
      </div>
    </div>
  )

  function onCreateAccountClick() {
    navigate("/onboarding/edit", {
      state: routerLocation.state
    })
  }
}

export default connect(null, mapPageDispatchersToProps)(OnboardingNew)
