import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import { Field } from "formik"
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

export const DateTimeField = props => <DateField {...props} withTime />

export const ButtonToggleGroupField = fieldProps => {
  const { choices, ...otherFieldProps } = fieldProps
  return (
    <Field
      buttons={FieldHelper.customEnumButtons(choices)}
      component={FieldHelper.renderButtonToggleGroup}
      {...otherFieldProps}
    />
  )
}

const FIELD_COMPONENTS = {
  text: TextField,
  date: DateField,
  datetime: DateTimeField,
  enum: ButtonToggleGroupField
}

const CustomFields = ({ fieldsConfig, formikProps }) => {
  return Object.keys(fieldsConfig).map(key => {
    const fieldConfig = fieldsConfig[key]
    const { type, helpText, ...fieldProps } = fieldConfig
    const FieldComponent = FIELD_COMPONENTS[type]
    return (
      <FieldComponent
        key={key}
        name={key}
        value={formikProps.values[key]}
        onChange={value => formikProps.setFieldValue(key, value)}
        onBlur={() => formikProps.setFieldTouched(key, true)}
        {...fieldProps}
      >
        {helpText && (
          <HelpBlock>
            <span className="text-success">{helpText}</span>
          </HelpBlock>
        )}
      </FieldComponent>
    )
  })
}
CustomFields.propTypes = {
  fieldsConfig: PropTypes.object,
  formikProps: PropTypes.object
}

export default CustomFields
