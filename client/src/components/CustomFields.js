import { Settings } from "api"
import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import { CUSTOM_FIELD_TYPE } from "components/Model"
import { Field, FieldArray } from "formik"
import { JSONPath } from "jsonpath-plus"
import _cloneDeep from "lodash/cloneDeep"
import _isEmpty from "lodash/isEmpty"
import _upperFirst from "lodash/upperFirst"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import { Button, HelpBlock } from "react-bootstrap"
import REMOVE_ICON from "resources/delete.png"

const RENDERERS = {
  likertScale: FieldHelper.RenderLikertScale2
}

const TextField = fieldProps => {
  const { onChange, onBlur, renderer, ...otherFieldProps } = fieldProps
  return (
    <Field
      type="text"
      component={RENDERERS[renderer] || FieldHelper.renderInputField}
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
  const { choices, renderer, ...otherFieldProps } = fieldProps
  return (
    <Field
      buttons={FieldHelper.customEnumButtons(choices)}
      component={
        RENDERERS[renderer] || FieldHelper.renderRadioButtonToggleGroup
      }
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
  const { choices, renderer, ...otherFieldProps } = fieldProps
  return (
    <Field
      buttons={FieldHelper.customEnumButtons(choices)}
      component={
        RENDERERS[renderer] || FieldHelper.renderCheckboxButtonToggleGroup
      }
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

const ArrayOfObjectsField = fieldProps => {
  const {
    name,
    fieldConfig,
    formikProps,
    invisibleFields,
    updateInvisibleFields
  } = fieldProps
  const nameKeys = name.split(".")
  const value = nameKeys.reduce(
    (v, key) => (v && v[key] ? v[key] : null),
    formikProps.values
  )
  const fieldsetTitle = fieldConfig.label || ""
  const addButtonLabel = fieldConfig.addButtonLabel || "Add a new item"
  return (
    <Fieldset title={fieldsetTitle}>
      <FieldArray
        name={name}
        render={arrayHelpers => (
          <div>
            <Button
              className="pull-right"
              onClick={() => addObject(arrayHelpers, value)}
              bsStyle="primary"
              id="addObjectButton"
            >
              {addButtonLabel}
            </Button>
            {value.map((obj, index) =>
              renderArrayObject(
                name,
                fieldConfig,
                formikProps,
                invisibleFields,
                updateInvisibleFields,
                arrayHelpers,
                obj,
                index
              )
            )}
          </div>
        )}
      />
    </Fieldset>
  )
}

const renderArrayObject = (
  fieldName,
  fieldConfig,
  formikProps,
  invisibleFields,
  updateInvisibleFields,
  arrayHelpers,
  obj,
  index
) => {
  const objLabel = _upperFirst(fieldConfig.objectLabel || "item")
  return (
    <Fieldset title={`${objLabel} ${index + 1}`} key={index}>
      <Button
        className="pull-right"
        title={`Remove this ${objLabel}`}
        onClick={() => arrayHelpers.remove(index)}
      >
        <img src={REMOVE_ICON} height={14} alt={`Remove this ${objLabel}`} />
      </Button>
      <CustomFields
        fieldsConfig={fieldConfig.objectFields}
        formikProps={formikProps}
        invisibleFields={invisibleFields}
        updateInvisibleFields={updateInvisibleFields}
        fieldNamePrefix={`${fieldName}.${index}`}
      />
    </Fieldset>
  )
}

const addObject = arrayHelpers => {
  arrayHelpers.push({})
}

const ReadonlyArrayOfObjectsField = fieldProps => {
  const { name, fieldConfig, formikProps } = fieldProps
  const nameKeys = name.split(".")
  const value = nameKeys.reduce(
    (v, key) => (v && v[key] ? v[key] : null),
    formikProps.values
  )
  const fieldsetTitle = fieldConfig.label || ""
  return (
    <Fieldset title={fieldsetTitle}>
      <FieldArray
        name={name}
        render={arrayHelpers => (
          <div>
            {value.map((obj, index) =>
              renderReadonlyArrayObject(name, fieldConfig, formikProps, index)
            )}
          </div>
        )}
      />
    </Fieldset>
  )
}

const renderReadonlyArrayObject = (
  fieldName,
  fieldConfig,
  formikProps,
  index
) => {
  const objLabel = _upperFirst(fieldConfig.objectLabel || "item")
  return (
    <Fieldset title={`${objLabel} ${index + 1}`} key={index}>
      <ReadonlyCustomFields
        fieldsConfig={fieldConfig.objectFields}
        formikProps={formikProps}
        fieldNamePrefix={`${fieldName}.${index}`}
      />
    </Fieldset>
  )
}

const FIELD_COMPONENTS = {
  [CUSTOM_FIELD_TYPE.TEXT]: TextField,
  [CUSTOM_FIELD_TYPE.NUMBER]: TextField,
  [CUSTOM_FIELD_TYPE.DATE]: DateField,
  [CUSTOM_FIELD_TYPE.DATETIME]: DateTimeField,
  [CUSTOM_FIELD_TYPE.ENUM]: EnumField,
  [CUSTOM_FIELD_TYPE.ENUMSET]: EnumSetField,
  [CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS]: ArrayOfObjectsField
}

function getInvisibleFields(
  invisibleFields,
  fieldsConfig,
  fieldNamePrefix,
  formikValues
) {
  let prevInvisibleFields = _cloneDeep(invisibleFields)
  let turnedInvisible = []
  let turnedVisible = []
  let curInvisibleFields = []
  Object.keys(fieldsConfig).forEach(key => {
    const fieldConfig = fieldsConfig[key]
    const fieldName = (fieldNamePrefix || "formCustomFields") + `.${key}`
    const isVisible =
      !fieldConfig.visibleWhen ||
      (fieldConfig.visibleWhen &&
        !_isEmpty(JSONPath(fieldConfig.visibleWhen, formikValues)))
    if (!isVisible && !prevInvisibleFields.includes(fieldName)) {
      turnedInvisible.push(fieldName)
    } else if (isVisible && prevInvisibleFields.includes(fieldName)) {
      turnedVisible.push(fieldName)
    }
  })
  if (turnedVisible.length || turnedInvisible.length) {
    curInvisibleFields = prevInvisibleFields.filter(
      x => !turnedVisible.includes(x)
    )
    turnedInvisible.forEach(x => curInvisibleFields.push(x))
    return curInvisibleFields
  }
  return invisibleFields
}

export const CustomFieldsContainer = props => {
  const [invisibleFields, setInvisibleFields] = useState([])
  const { setFieldValue } = props.formikProps
  useEffect(() => {
    setFieldValue("formCustomFields.invisibleCustomFields", invisibleFields)
  }, [invisibleFields, setFieldValue])
  return (
    <>
      <Field
        type="text"
        name="formCustomFields.invisibleCustomFields"
        className="hidden"
      />
      <CustomFields
        invisibleFields={invisibleFields}
        updateInvisibleFields={setInvisibleFields}
        {...props}
      />
    </>
  )
}
CustomFieldsContainer.propTypes = {
  fieldsConfig: PropTypes.object,
  formikProps: PropTypes.object,
  fieldNamePrefix: PropTypes.string
}

const CustomFields = ({
  fieldsConfig,
  formikProps,
  fieldNamePrefix,
  invisibleFields,
  updateInvisibleFields
}) => {
  const curInvisibleFields = getInvisibleFields(
    invisibleFields,
    fieldsConfig,
    fieldNamePrefix,
    formikProps.values
  )
  useEffect(() => {
    updateInvisibleFields(curInvisibleFields)
  }, [curInvisibleFields, updateInvisibleFields])
  return (
    <>
      {Object.keys(fieldsConfig).map(key => {
        const fieldConfig = fieldsConfig[key]
        const {
          type,
          helpText,
          validations,
          visibleWhen,
          ...fieldProps
        } = fieldConfig
        const FieldComponent = FIELD_COMPONENTS[type]
        const fieldName = (fieldNamePrefix || "formCustomFields") + `.${key}`
        const isVisible = !invisibleFields.includes(fieldName)
        let extraProps = {}
        if (type === CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS) {
          extraProps = {
            fieldConfig: fieldConfig,
            formikProps: formikProps,
            invisibleFields: invisibleFields,
            updateInvisibleFields: updateInvisibleFields
          }
        }
        return (
          isVisible && (
            <FieldComponent
              key={key}
              name={fieldName}
              onChange={value => formikProps.setFieldValue(fieldName, value)}
              onBlur={() => formikProps.setFieldTouched(fieldName, true)}
              {...fieldProps}
              {...extraProps}
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
}
CustomFields.propTypes = {
  fieldsConfig: PropTypes.object,
  formikProps: PropTypes.object,
  fieldNamePrefix: PropTypes.string,
  invisibleFields: PropTypes.array,
  updateInvisibleFields: PropTypes.func
}

const READONLY_FIELD_COMPONENTS = {
  [CUSTOM_FIELD_TYPE.TEXT]: ReadonlyTextField,
  [CUSTOM_FIELD_TYPE.NUMBER]: ReadonlyTextField,
  [CUSTOM_FIELD_TYPE.DATE]: ReadonlyDateField,
  [CUSTOM_FIELD_TYPE.DATETIME]: ReadonlyDateTimeField,
  [CUSTOM_FIELD_TYPE.ENUM]: ReadonlyEnumField,
  [CUSTOM_FIELD_TYPE.ENUMSET]: ReadonlyEnumSetField,
  [CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS]: ReadonlyArrayOfObjectsField
}

export const ReadonlyCustomFields = ({
  fieldsConfig,
  formikProps,
  fieldNamePrefix
}) => {
  return (
    <>
      {Object.keys(fieldsConfig).map(key => {
        const fieldConfig = fieldsConfig[key]
        const {
          type,
          placeholder,
          helpText,
          validations,
          visibleWhen,
          objectFields,
          ...fieldProps
        } = fieldConfig
        let extraProps = {}
        if (type === CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS) {
          extraProps = {
            fieldConfig: fieldConfig,
            formikProps: formikProps
          }
        }
        const FieldComponent = READONLY_FIELD_COMPONENTS[type]
        const fieldName = (fieldNamePrefix || "formCustomFields") + `.${key}`
        return (
          <FieldComponent
            key={key}
            name={fieldName}
            {...fieldProps}
            {...extraProps}
          />
        )
      })}
    </>
  )
}
ReadonlyCustomFields.propTypes = {
  fieldsConfig: PropTypes.object,
  formikProps: PropTypes.object,
  fieldNamePrefix: PropTypes.string
}
