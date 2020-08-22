import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import PositionTable from "components/PositionTable"
import React, { useContext } from "react"

const MyCounterparts = () => {
  const { currentUser } = useContext(AppContext)
  return (
    <div>
      <Fieldset id="my-counterparts" title="My Counterparts">
        <PositionTable positions={currentUser.position.associatedPositions} />
      </Fieldset>
    </div>
  )
}
export default MyCounterparts
