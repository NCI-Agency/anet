import { DEFAULT_PAGE_PROPS } from "actions"
import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import PositionTable from "components/PositionTable"
import { getPendingCounterparts } from "notificationsUtils"
import React, { useContext } from "react"
import { connect } from "react-redux"

const MyCounterparts = ({ pageDispatchers }) => {
  // Make sure we have a navigation menu
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    pageDispatchers
  })
  const { currentUser } = useContext(AppContext)
  const myPendingCParts = getPendingCounterparts(currentUser)
  return (
    <div>
      <Fieldset id="my-counterparts" title="My Counterparts">
        <PositionTable positions={currentUser.position.associatedPositions} />
      </Fieldset>
      <Fieldset
        id="my-pending-counterparts"
        title="My Counterparts that have pending assessments"
      >
        <PositionTable positions={myPendingCParts} />
      </Fieldset>
    </div>
  )
}

MyCounterparts.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(MyCounterparts)
