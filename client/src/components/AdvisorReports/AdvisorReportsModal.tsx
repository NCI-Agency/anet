import AdvisorReportsTable from "components/AdvisorReports/AdvisorReportsTable"
import SimpleModal from "components/SimpleModal"
import React from "react"

interface AdvisorReportsModalProps {
  columnGroups: number[]
  name: string
  uuid: string
  weeksAgo?: number
}

const AdvisorReportsModal = (props: AdvisorReportsModalProps) => (
  <SimpleModal title={props.name} size="lg">
    <AdvisorReportsTable
      columnGroups={props.columnGroups}
      orgUuid={props.uuid}
      weeksAgo={props.weeksAgo}
    />
  </SimpleModal>
)

export default AdvisorReportsModal
