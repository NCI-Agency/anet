import { Settings } from "api"
import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import { Field, FieldArray } from "formik"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { HelpBlock } from "react-bootstrap"

export const TextField = fieldProps => {
  const { onChange, onBlur, ...otherFieldProps } = fieldProps
  return (
    <Field
      type="text"
      component={FieldHelper.renderInputField}
      {...otherFieldProps}
    />
  )
}

export const ReadonlyTextField = fieldProps => {
  const { name, label } = fieldProps
  return (
    <Field
      name={name}
      label={label}
      component={FieldHelper.renderReadonlyField}
    />
  )
}

export const DateField = fieldProps => {
  const { withTime, ...otherFieldProps } = fieldProps
  return (
    <Field
      component={FieldHelper.renderSpecialField}
      widget={<CustomDateInput withTime={withTime} />}
      {...otherFieldProps}
    />
  )
}

export const ReadonlyDateField = fieldProps => {
  const { name, label, withTime } = fieldProps
  return (
    <Field
      name={name}
      label={label}
      component={FieldHelper.renderReadonlyField}
      humanValue={fieldVal =>
        fieldVal &&
        moment(fieldVal).format(
          withTime
            ? Settings.dateFormats.forms.displayShort.withTime
            : Settings.dateFormats.forms.displayShort.date
        )}
    />
  )
}

export const DateTimeField = props => <DateField {...props} withTime />

export const ReadonlyDateTimeField = props => (
  <ReadonlyDateField {...props} withTime />
)

export const EnumField = fieldProps => {
  const { choices, ...otherFieldProps } = fieldProps
  return (
    <Field
      buttons={FieldHelper.customEnumButtons(choices)}
      component={FieldHelper.renderButtonToggleGroup}
      {...otherFieldProps}
    />
  )
}

const humanNameOfChoice = (choices, fieldVal) =>
  fieldVal && choices[fieldVal].label

export const ReadonlyEnumField = fieldProps => {
  const { name, label, choices } = fieldProps
  return (
    <Field
      name={name}
      label={label}
      component={FieldHelper.renderReadonlyField}
      humanValue={fieldVal => humanNameOfChoice(choices, fieldVal)}
    />
  )
}

const FIELD_COMPONENTS = {
  text: TextField,
  date: DateField,
  datetime: DateTimeField,
  enum: EnumField
}

export const CustomFields = ({ fieldsConfig, formikProps }) => (
  // We use a FieldArray in order to group the customFields fields
  <FieldArray
    name="customFields"
    render={arrayHelpers =>
      Object.keys(fieldsConfig).map(key => {
        const fieldConfig = fieldsConfig[key]
        const { type, helpText, ...fieldProps } = fieldConfig
        const FieldComponent = FIELD_COMPONENTS[type]
        const fieldName = `customFields.0.${key}`
        return (
          <FieldComponent
            key={key}
            name={fieldName}
            onChange={value => formikProps.setFieldValue(fieldName, value)}
            onBlur={() => formikProps.setFieldTouched(fieldName, true)}
            {...fieldProps}
          >
            {helpText && (
              <HelpBlock>
                <span className="text-success">{helpText}</span>
              </HelpBlock>
            )}
          </FieldComponent>
        )
      })}
  />
)
CustomFields.propTypes = {
  fieldsConfig: PropTypes.object,
  formikProps: PropTypes.object
}

const READONLY_FIELD_COMPONENTS = {
  text: ReadonlyTextField,
  date: ReadonlyDateField,
  datetime: ReadonlyDateTimeField,
  enum: ReadonlyEnumField
}

export const ReadonlyCustomFields = ({ fieldsConfig }) => {
  return (
    <>
      {Object.keys(fieldsConfig).map(key => {
        const fieldConfig = fieldsConfig[key]
        const { type, helpText, ...fieldProps } = fieldConfig
        const FieldComponent = READONLY_FIELD_COMPONENTS[type]
        const fieldName = `customFields.${key}`
        return <FieldComponent key={key} name={fieldName} {...fieldProps} />
      })}
    </>
  )
}
ReadonlyCustomFields.propTypes = {
  fieldsConfig: PropTypes.object
}
