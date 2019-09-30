import AdvisorReportsTable from "components/AdvisorReports/AdvisorReportsTable"
import SimpleModal from "components/SimpleModal"
import PropTypes from "prop-types"
import React from "react"

const AdvisorReportsModal = props => {
  return (
    <SimpleModal title={props.name} size="large">
      <AdvisorReportsTable
        columnGroups={props.columnGroups}
        orgUuid={props.uuid}
      />
    </SimpleModal>
  )
}

AdvisorReportsModal.propTypes = {
  columnGroups: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  uuid: PropTypes.string.isRequired
}

export default AdvisorReportsModal
