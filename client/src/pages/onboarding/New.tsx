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
import { useLocation, useNavigate } from "react-router"

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

  return (
    <div className="onboarding-new">
      <h1>Welcome to ANET</h1>
      <p>
        ANET is a training system for reporting TAA engagements, and learning
        about past engagements and people.
      </p>
      <p>
        Before you can start using ANET you need to fill in your basic profile
        and enroll in ANET.
      </p>
      <div className="create-account-button-wrapper">
        <Button variant="primary" onClick={onCreateAccountClick}>
          Fill in your profile and enroll in ANET
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
