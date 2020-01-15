import { Settings } from "api"
import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LikertScale from "components/graphs/LikertScale"
import Model, {
  CUSTOM_FIELD_TYPE,
  createYupObjectShape
} from "components/Model"
import { Field, FieldArray } from "formik"
import { JSONPath } from "jsonpath-plus"
import _cloneDeep from "lodash/cloneDeep"
import _isEmpty from "lodash/isEmpty"
import _isEqualWith from "lodash/isEqualWith"
import _set from "lodash/set"
import _upperFirst from "lodash/upperFirst"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { Button, HelpBlock } from "react-bootstrap"
import REMOVE_ICON from "resources/delete.png"
import utils from "utils"

const WIDGETS = {
  likertScale: LikertScale
}
const RENDERERS = {}

const DEFAULT_CUSTOM_FIELDS_PREFIX = "formCustomFields"

const SpecialField = fieldProps => {
  const { widget, ...otherFieldProps } = fieldProps
  const SpecialFieldWidget = WIDGETS[widget]
  return (
    <Field
      component={FieldHelper.renderSpecialField}
      widget={<SpecialFieldWidget />}
      {...otherFieldProps}
    />
  )
}

const ReadonlySpecialField = fieldProps =>
  SpecialField({ ...fieldProps, readonly: true })

const TextField = fieldProps => {
  const { onChange, onBlur, ...otherFieldProps } = fieldProps
  return <Field component={FieldHelper.renderInputField} {...otherFieldProps} />
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
  const { name, withTime, ...otherFieldProps } = fieldProps
  return (
    <Field
      name={name}
      component={FieldHelper.renderSpecialField}
      widget={<CustomDateInput id={name} withTime={withTime} />}
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
    (v, key) => (v && v[key] ? v[key] : []),
    formikProps.values
  )
  const fieldsetTitle = fieldConfig.label || ""
  const addButtonLabel = fieldConfig.addButtonLabel || "Add a new item"
  const objSchema = createYupObjectShape(fieldConfig.objectFields)
  const objDefault = {}
  Model.fillObject(objDefault, objSchema)

  return (
    <Fieldset title={fieldsetTitle}>
      <FieldArray
        name={name}
        render={arrayHelpers => (
          <div>
            <Button
              className="pull-right"
              onClick={() => addObject(objDefault, arrayHelpers)}
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

const addObject = (objDefault, arrayHelpers) => {
  arrayHelpers.push(objDefault)
}

const ReadonlyArrayOfObjectsField = fieldProps => {
  const { name, fieldConfig, formikProps } = fieldProps
  const nameKeys = name.split(".")
  const value = nameKeys.reduce(
    (v, key) => (v && v[key] ? v[key] : []),
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
  [CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS]: ArrayOfObjectsField,
  [CUSTOM_FIELD_TYPE.SPECIAL_FIELD]: SpecialField
}

function getInvisibleFields(
  invisibleFields,
  fieldsConfig,
  fieldNamePrefix,
  formikValues
) {
  const prevInvisibleFields = _cloneDeep(invisibleFields)
  const turnedInvisible = []
  const turnedVisible = []
  let curInvisibleFields = []
  Object.keys(fieldsConfig).forEach(key => {
    const fieldConfig = fieldsConfig[key]
    const fieldName = `${fieldNamePrefix}.${key}`
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
  const { fieldNamePrefix, formikProps } = props
  const [invisibleFields, setInvisibleFields] = useState([])
  const { setFieldValue } = formikProps
  const invisibleFieldsFieldName = `${fieldNamePrefix}.invisibleCustomFields`
  useEffect(() => {
    setFieldValue(invisibleFieldsFieldName, invisibleFields)
  }, [invisibleFieldsFieldName, invisibleFields, setFieldValue])

  return (
    <>
      <Field
        type="text"
        value=""
        name={invisibleFieldsFieldName}
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
  fieldNamePrefix: PropTypes.string.isRequired
}
CustomFieldsContainer.defaultProps = {
  fieldNamePrefix: DEFAULT_CUSTOM_FIELDS_PREFIX
}

const CustomField = ({
  fieldConfig,
  fieldName,
  formikProps,
  invisibleFields,
  updateInvisibleFields
}) => {
  const {
    type,
    helpText,
    validations,
    visibleWhen,
    ...fieldProps
  } = fieldConfig
  const { setFieldValue } = formikProps
  const handleChange = useMemo(() => value => setFieldValue(fieldName, value), [
    setFieldValue,
    fieldName
  ])
  const FieldComponent = FIELD_COMPONENTS[type]
  const isVisible = !invisibleFields.includes(fieldName)
  let extraProps = {}
  if (type === CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS) {
    extraProps = {
      fieldConfig,
      formikProps,
      invisibleFields,
      updateInvisibleFields
    }
  }
  return (
    isVisible && (
      <FieldComponent
        name={fieldName}
        onChange={handleChange}
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
}

const CustomFields = ({
  fieldsConfig,
  formikProps,
  fieldNamePrefix,
  invisibleFields,
  updateInvisibleFields
}) => {
  const formikValues = formikProps.values

  const latestInvisibleFieldsProp = useRef(invisibleFields)
  const invisibleFieldsPropUnchanged = _isEqualWith(
    latestInvisibleFieldsProp.current,
    invisibleFields,
    utils.treatFunctionsAsEqual
  )

  const curInvisibleFields = useMemo(
    () =>
      getInvisibleFields(
        invisibleFields,
        fieldsConfig,
        fieldNamePrefix,
        formikValues
      ),
    [invisibleFields, fieldsConfig, fieldNamePrefix, formikValues]
  )
  const invisibleFieldsUnchanged = _isEqualWith(
    latestInvisibleFieldsProp.current,
    curInvisibleFields,
    utils.treatFunctionsAsEqual
  )

  useEffect(() => {
    if (!invisibleFieldsPropUnchanged) {
      latestInvisibleFieldsProp.current = invisibleFields
    }
  }, [invisibleFieldsPropUnchanged, invisibleFields])

  useEffect(() => {
    if (!invisibleFieldsUnchanged) {
      updateInvisibleFields(curInvisibleFields)
    }
  }, [invisibleFieldsUnchanged, curInvisibleFields, updateInvisibleFields])

  return (
    <>
      {Object.keys(fieldsConfig).map(key => {
        const fieldConfig = fieldsConfig[key]
        return (
          <CustomField
            key={key}
            fieldConfig={fieldConfig}
            fieldName={`${fieldNamePrefix}.${key}`}
            formikProps={formikProps}
            invisibleFields={invisibleFields}
            updateInvisibleFields={updateInvisibleFields}
          />
        )
      })}
    </>
  )
}
CustomFields.propTypes = {
  fieldsConfig: PropTypes.object,
  formikProps: PropTypes.object,
  fieldNamePrefix: PropTypes.string.isRequired,
  invisibleFields: PropTypes.array,
  updateInvisibleFields: PropTypes.func
}
CustomFields.defaultProps = {
  fieldNamePrefix: DEFAULT_CUSTOM_FIELDS_PREFIX
}

const READONLY_FIELD_COMPONENTS = {
  [CUSTOM_FIELD_TYPE.TEXT]: ReadonlyTextField,
  [CUSTOM_FIELD_TYPE.NUMBER]: ReadonlyTextField,
  [CUSTOM_FIELD_TYPE.DATE]: ReadonlyDateField,
  [CUSTOM_FIELD_TYPE.DATETIME]: ReadonlyDateTimeField,
  [CUSTOM_FIELD_TYPE.ENUM]: ReadonlyEnumField,
  [CUSTOM_FIELD_TYPE.ENUMSET]: ReadonlyEnumSetField,
  [CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS]: ReadonlyArrayOfObjectsField,
  [CUSTOM_FIELD_TYPE.SPECIAL_FIELD]: ReadonlySpecialField
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
        return (
          <FieldComponent
            key={key}
            name={`${fieldNamePrefix}.${key}`}
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
  fieldNamePrefix: PropTypes.string.isRequired
}
ReadonlyCustomFields.defaultProps = {
  fieldNamePrefix: DEFAULT_CUSTOM_FIELDS_PREFIX
}

// customFields should contain the JSON of all the visible custom fields
export const customFieldsJSONString = values => {
  const clonedValues = _cloneDeep(values)
  if (values.formCustomFields.invisibleCustomFields) {
    clonedValues.formCustomFields.invisibleCustomFields.forEach(f => {
      _set(clonedValues, f.split("."), undefined)
    })
  }
  return JSON.stringify(clonedValues.formCustomFields)
}
