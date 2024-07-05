import { initInvisibleFields } from "components/CustomFields"
import { mapPageDispatchersToProps } from "components/Page"
import { Location } from "models"
import LocationForm from "pages/locations/Form"
import React from "react"
import { connect } from "react-redux"
import { toast } from "react-toastify"
import Settings from "settings"

interface CreateNewLocationProps {
  name?: string
  setFieldTouched: (...args: unknown[]) => unknown
  setFieldValue: (...args: unknown[]) => unknown
  setDoReset: (...args: unknown[]) => unknown
}

const CreateNewLocation = ({
  name,
  setFieldTouched,
  setFieldValue,
  setDoReset
}: CreateNewLocationProps) => {
  const location = new Location({ name })
  // mutates the object
  initInvisibleFields(location, Settings.fields.location.customFields)
  return (
    <LocationForm
      initialValues={location}
      title="Create a new Location"
      afterSaveActions={value => {
        // validation will be done by setFieldValue
        setFieldTouched("location", true, false) // onBlur doesn't work when selecting an option
        setFieldValue("location", value, true)
        setDoReset(true)
        toast.success("The location has been saved")
      }}
      afterCancelActions={() => {
        setDoReset(true)
      }}
    />
  )
}

export default connect(null, mapPageDispatchersToProps)(CreateNewLocation)
