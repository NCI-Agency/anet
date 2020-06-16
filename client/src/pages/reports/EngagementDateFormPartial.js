import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import { FastField } from "formik"
import { Report } from "models"
import PropTypes from "prop-types"
import React from "react"
import { HelpBlock } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

const futureEngagementHint = (
  <HelpBlock>
    <span className="text-success">This will create a planned engagement</span>
  </HelpBlock>
)

const EngagementDateFormPartial = ({
  setFieldValue,
  setFieldTouched,
  validateFieldDebounced,
  initialValues,
  edit,
  values
}) => {
  if (!Settings.engagementsIncludeTimeAndDuration) {
    return (
      <FastField
        name="engagementDate"
        component={FieldHelper.SpecialField}
        onChange={value => {
          setFieldTouched("engagementDate", true, false) // onBlur doesn't work when selecting a date
          setFieldValue("engagementDate", value, true)
        }}
        onBlur={() => setFieldTouched("engagementDate")}
        widget={<CustomDateInput id="engagementDate" />}
      >
        {Report.isFuture(values.engagementDate) && futureEngagementHint}
      </FastField>
    )
  }

  return (
    <>
      <FastField
        name="engagementDate"
        component={FieldHelper.SpecialField}
        onChange={value => {
          setFieldTouched("engagementDate", true, false) // onBlur doesn't work when selecting a date
          setFieldValue("engagementDate", value, true)
        }}
        onBlur={() => setFieldTouched("engagementDate")}
        widget={<CustomDateInput id="engagementDate" withTime />}
      >
        {Report.isFuture(values.engagementDate) && futureEngagementHint}
      </FastField>
      <FastField
        name="duration"
        label="Duration (minutes)"
        component={FieldHelper.InputField}
        inputType="number"
        onWheelCapture={event => event.currentTarget.blur()} // Prevent scroll action on number input
        onChange={event => {
          const safeVal =
            utils.preventNegativeAndLongDigits(event.target.value, 4) || null
          setFieldTouched("duration", true, false)
          setFieldValue("duration", safeVal, false)
          validateFieldDebounced("duration")
        }}
      />
    </>
  )
}

EngagementDateFormPartial.propTypes = {
  setFieldValue: PropTypes.func.isRequired,
  setFieldTouched: PropTypes.func.isRequired,
  validateFieldDebounced: PropTypes.func.isRequired,
  values: PropTypes.object.isRequired,
  initialValues: PropTypes.instanceOf(Report).isRequired,
  edit: PropTypes.bool.isRequired
}

export default EngagementDateFormPartial
