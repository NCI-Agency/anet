import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import { Field } from "formik"
import PropTypes from "prop-types"
import React from "react"
import { HelpBlock } from "react-bootstrap"

const customFieldPropTypes = {
  name: PropTypes.string,
  fieldConfig: PropTypes.object,
  formikProps: PropTypes.object
}

export const TextField = ({ name, fieldConfig, formikProps }) => (
  <Field
    name={name}
    value={formikProps.values[name]}
    type="text"
    component={FieldHelper.renderInputField}
    {...fieldConfig}
  />
)
TextField.propTypes = customFieldPropTypes

export const DateField = ({ name, fieldConfig, formikProps, withTime }) => (
  <Field
    name={name}
    value={formikProps.values[name]}
    component={FieldHelper.renderSpecialField}
    onChange={value => formikProps.setFieldValue(name, value)}
    onBlur={() => formikProps.setFieldTouched(name, true)}
    widget={<CustomDateInput withTime={withTime} />}
    {...fieldConfig}
  />
)
DateField.propTypes = {
  ...customFieldPropTypes,
  withTime: PropTypes.bool
}

export const DateTimeField = props => <DateField {...props} withTime />

export const ButtonToggleGroupField = ({ name, fieldConfig, formikProps }) => {
  const { choices, ...restFieldConfig } = fieldConfig
  return (
    <Field
      name={name}
      buttons={FieldHelper.customEnumButtons(choices)}
      component={FieldHelper.renderButtonToggleGroup}
      onChange={value => formikProps.setFieldValue(name, value)}
      {...restFieldConfig}
    />
  )
}
ButtonToggleGroupField.propTypes = customFieldPropTypes

const FIELD_COMPONENTS = {
  text: TextField,
  date: DateField,
  datetime: DateTimeField,
  enum: ButtonToggleGroupField
}

const CustomFields = ({ fieldsConfig, formikProps }) => {
  return Object.keys(fieldsConfig).map(key => {
    const config = fieldsConfig[key]
    const { type, helpText, ...fieldConfig } = config
    const FieldComponent = FIELD_COMPONENTS[type]
    return (
      <FieldComponent
        key={key}
        name={key}
        fieldConfig={fieldConfig}
        formikProps={formikProps}
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
