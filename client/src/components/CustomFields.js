import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import { Field, FieldArray } from "formik"
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

const CustomFields = ({ fieldsConfig, formikProps }) => (
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

export default CustomFields
