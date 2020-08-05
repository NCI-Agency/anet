import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType
} from "components/Page"
import PositionTable from "components/PositionTable"
import React, { useContext } from "react"
import { connect } from "react-redux"

const MyCounterparts = ({ pageDispatchers }) => {
  const { currentUser } = useContext(AppContext)
  return (
    <div>
      <Fieldset id="my_counterparts" title="My Counterparts">
        <PositionTable positions={currentUser.position.associatedPositions} />
      </Fieldset>
    </div>
  )
}

MyCounterparts.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(MyCounterparts)
