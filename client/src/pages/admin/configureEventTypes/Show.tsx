import { usePageTitle } from "components/Page"
import React, { useState } from "react"
import { Button } from "react-bootstrap"
import { toast } from "react-toastify"
import EventTypeTable from "./EventTypeTable"

const ConfigureEventTypesShow = () => {
  usePageTitle("Configure Event Types")

  return (
    <>
      <EventTypeTable />
    </>
  )
}

export default ConfigureEventTypesShow
