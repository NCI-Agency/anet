import { Checkbox } from "@blueprintjs/core"
import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import { FastField, Field } from "formik"
import { Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Col, ControlLabel, FormGroup, HelpBlock } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

const futureEngagementHint = (
  <HelpBlock>
    <span className="text-success">This will create a planned engagement</span>
  </HelpBlock>
)

function isStartOfDay(date) {
  return date && moment(date).isSame(moment(date).startOf("day"))
}

const EngagementDatePartialFormWithDuration = ({
  setFieldValue,
  setFieldTouched,
  validateFieldDebounced,
  initialValues,
  edit,
  values
}) => {
  const [isAllDay, setIsAllDay] = useState(() =>
    getInitalAllDayState(edit, initialValues)
  )

  return (
    <FormGroup>
      <Col sm={2} componentClass={ControlLabel}>
        Engagement planning
      </Col>
      <Col sm={4} style={{ marginLeft: "15px" }}>
        <Field
          name="engagementDate"
          component={FieldHelper.SpecialField}
          onChange={value => {
            const sval = value ? moment(value).startOf("minute").toDate() : null
            setFieldTouched("engagementDate", true, false) // onBlur doesn't work when selecting a date
            setFieldValue("engagementDate", sval, true)
            if (!sval) {
              setIsAllDay(true)
            } else if (!isStartOfDay(sval)) {
              setIsAllDay(false)
            }
          }}
          onBlur={() => setFieldTouched("engagementDate")}
          widget={
            <CustomDateInput
              id="engagementDate"
              withTime
              fullWidth
              allDay={isAllDay}
            />
          }
          vertical
        >
          {Report.isFuture(values.engagementDate) && futureEngagementHint}
        </Field>
      </Col>
      <Col sm={3} style={{ marginLeft: "15px" }}>
        <Field
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
            setIsAllDay(false)
          }}
          vertical
          disabled={isAllDay}
        />
      </Col>
      <Col sm={2} style={{ marginTop: "2.2em", maxWidth: "max-content" }}>
        <Checkbox
          checked={isAllDay}
          label="All Day"
          onChange={e => {
            setIsAllDay(e.target.checked)
            if (e.target.checked) {
              setFieldValue("duration", null, true)
              validateFieldDebounced("duration")
              if (values.engagementDate) {
                setFieldValue(
                  "engagementDate",
                  moment(values.engagementDate).startOf("day").toDate(),
                  false
                )
              }
            }
          }}
        />
      </Col>
    </FormGroup>
  )
}

function getInitalAllDayState(edit, initialValues) {
  if (!edit || !initialValues.engagementDate) {
    return true
  } else if (!isStartOfDay(initialValues.engagementDate)) {
    return false
  } else {
    return initialValues.duration === null
  }
}

EngagementDatePartialFormWithDuration.propTypes = {
  setFieldValue: PropTypes.func.isRequired,
  setFieldTouched: PropTypes.func.isRequired,
  validateFieldDebounced: PropTypes.func.isRequired,
  values: PropTypes.object.isRequired,
  initialValues: PropTypes.instanceOf(Report).isRequired,
  edit: PropTypes.bool.isRequired
}

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
          const val = value ? moment(value).startOf("day").toDate() : null
          setFieldValue("engagementDate", val, true)
        }}
        widget={<CustomDateInput id="engagementDate" />}
      >
        {Report.isFuture(values.engagementDate) && futureEngagementHint}
      </FastField>
    )
  }

  return (
    <EngagementDatePartialFormWithDuration
      setFieldValue={setFieldValue}
      setFieldTouched={setFieldTouched}
      validateFieldDebounced={validateFieldDebounced}
      values={values}
      initialValues={initialValues}
      edit={edit}
    />
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
