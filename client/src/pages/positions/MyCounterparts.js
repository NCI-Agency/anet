import { DEFAULT_PAGE_PROPS } from "actions"
import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import PositionTable from "components/PositionTable"
import React, { useContext } from "react"
import { connect } from "react-redux"

const MyCounterparts = ({ pageDispatchers }) => {
  // Make sure we have a navigation menu
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    pageDispatchers
  })
  usePageTitle("My Counterparts")
  const {
    currentUser,
    notifications: { counterpartsWithPendingAssessments }
  } = useContext(AppContext)

  return (
    <div>
      <Fieldset id="my-counterparts" title="My Counterparts">
        <PositionTable
          positions={currentUser.position.associatedPositions}
          showLocation
        />
      </Fieldset>
      <Fieldset
        id="my-counterparts-with-pending-assessments"
        title="My Counterparts that have pending assessments"
      >
        <PositionTable
          positions={counterpartsWithPendingAssessments}
          showLocation
        />
      </Fieldset>
    </div>
  )
}

MyCounterparts.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(MyCounterparts)
