import { initInvisibleFields } from "components/CustomFields"
import { mapPageDispatchersToProps } from "components/Page"
import { Location } from "models"
import LocationForm from "pages/locations/Form"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import { toast } from "react-toastify"
import Settings from "settings"

const CreateNewLocation = ({
  name,
  setFieldTouched,
  setFieldValue,
  setDoReset
}) => {
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

CreateNewLocation.propTypes = {
  name: PropTypes.string,
  setFieldTouched: PropTypes.func.isRequired,
  setFieldValue: PropTypes.func.isRequired,
  setDoReset: PropTypes.func.isRequired
}
export default connect(null, mapPageDispatchersToProps)(CreateNewLocation)
