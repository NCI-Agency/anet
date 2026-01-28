import { usePageTitle } from "components/Page"
import React from "react"
import EventTypeTable from "./EventTypeTable"

const ConfigureEventTypesShow = () => {
  usePageTitle("Configure Event Types")

  return <EventTypeTable />
}

export default ConfigureEventTypesShow
