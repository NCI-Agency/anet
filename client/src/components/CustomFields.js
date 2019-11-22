import { Settings } from "api"
import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import { CUSTOM_FIELD_TYPE } from "components/Model"
import { Field } from "formik"
import { JSONPath } from "jsonpath-plus"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { HelpBlock } from "react-bootstrap"

const TextField = fieldProps => {
  const { onChange, onBlur, ...otherFieldProps } = fieldProps
  return (
    <Field
      type="text"
      component={FieldHelper.renderInputField}
      {...otherFieldProps}
    />
  )
}

const ReadonlyTextField = fieldProps => {
  const { name, label } = fieldProps
  return (
    <Field
      name={name}
      label={label}
      component={FieldHelper.renderReadonlyField}
    />
  )
}

const DateField = fieldProps => {
  const { withTime, ...otherFieldProps } = fieldProps
  return (
    <Field
      component={FieldHelper.renderSpecialField}
      widget={<CustomDateInput withTime={withTime} />}
      {...otherFieldProps}
    />
  )
}

const ReadonlyDateField = fieldProps => {
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

const DateTimeField = props => <DateField {...props} withTime />

const ReadonlyDateTimeField = props => <ReadonlyDateField {...props} withTime />

const EnumField = fieldProps => {
  const { choices, ...otherFieldProps } = fieldProps
  return (
    <Field
      buttons={FieldHelper.customEnumButtons(choices)}
      component={FieldHelper.renderRadioButtonToggleGroup}
      {...otherFieldProps}
    />
  )
}

const enumHumanValue = (choices, fieldVal) => {
  if (Array.isArray(fieldVal)) {
    return fieldVal && fieldVal.map(k => choices[k].label).join(", ")
  } else {
    return fieldVal && choices[fieldVal].label
  }
}

const ReadonlyEnumField = fieldProps => {
  const { name, label, choices } = fieldProps
  return (
    <Field
      name={name}
      label={label}
      component={FieldHelper.renderReadonlyField}
      humanValue={fieldVal => enumHumanValue(choices, fieldVal)}
    />
  )
}

const EnumSetField = fieldProps => {
  const { choices, ...otherFieldProps } = fieldProps
  return (
    <Field
      buttons={FieldHelper.customEnumButtons(choices)}
      component={FieldHelper.renderCheckboxButtonToggleGroup}
      {...otherFieldProps}
    />
  )
}

const ReadonlyEnumSetField = fieldProps => {
  const { name, label, choices } = fieldProps
  return (
    <Field
      name={name}
      label={label}
      component={FieldHelper.renderReadonlyField}
      humanValue={fieldVal => enumHumanValue(choices, fieldVal)}
    />
  )
}

const FIELD_COMPONENTS = {
  [CUSTOM_FIELD_TYPE.TEXT]: TextField,
  [CUSTOM_FIELD_TYPE.NUMBER]: TextField,
  [CUSTOM_FIELD_TYPE.DATE]: DateField,
  [CUSTOM_FIELD_TYPE.DATETIME]: DateTimeField,
  [CUSTOM_FIELD_TYPE.ENUM]: EnumField,
  [CUSTOM_FIELD_TYPE.ENUMSET]: EnumSetField
}

export const CustomFields = ({
  fieldsConfig,
  formikProps,
  prevInvisibleFields,
  setInvisibleFields
}) => {
  const invisibleFields = []
  const customFields = (
    <>
      {Object.keys(fieldsConfig).map(key => {
        const fieldConfig = fieldsConfig[key]
        const {
          type,
          helpText,
          validations,
          validationType,
          visibleWhen,
          ...fieldProps
        } = fieldConfig
        const FieldComponent = FIELD_COMPONENTS[type]
        const fieldName = `customFields.${key}`
        const isVisible =
          !fieldConfig.visibleWhen ||
          (fieldConfig.visibleWhen &&
            !_isEmpty(JSONPath(fieldConfig.visibleWhen, formikProps.values)))
        if (!isVisible) {
          invisibleFields.push(key)
        }
        return (
          isVisible && (
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
        )
      })}
    </>
  )
  if (prevInvisibleFields.join() !== invisibleFields.join()) {
    setInvisibleFields(invisibleFields)
  }
  return customFields
}
CustomFields.propTypes = {
  fieldsConfig: PropTypes.object,
  formikProps: PropTypes.object,
  prevInvisibleFields: PropTypes.array,
  setInvisibleFields: PropTypes.func
}

const READONLY_FIELD_COMPONENTS = {
  [CUSTOM_FIELD_TYPE.TEXT]: ReadonlyTextField,
  [CUSTOM_FIELD_TYPE.NUMBER]: ReadonlyTextField,
  [CUSTOM_FIELD_TYPE.DATE]: ReadonlyDateField,
  [CUSTOM_FIELD_TYPE.DATETIME]: ReadonlyDateTimeField,
  [CUSTOM_FIELD_TYPE.ENUM]: ReadonlyEnumField,
  [CUSTOM_FIELD_TYPE.ENUMSET]: ReadonlyEnumSetField
}

export const ReadonlyCustomFields = ({ fieldsConfig }) => {
  return (
    <>
      {Object.keys(fieldsConfig).map(key => {
        const fieldConfig = fieldsConfig[key]
        const {
          type,
          helpText,
          validations,
          validationType,
          ...fieldProps
        } = fieldConfig
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
