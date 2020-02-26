import { Settings } from "api"
import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LikertScale from "components/graphs/LikertScale"
import Model, {
  CUSTOM_FIELD_TYPE,
  createYupObjectShape
} from "components/Model"
import { FastField, FieldArray } from "formik"
import { JSONPath } from "jsonpath-plus"
import _cloneDeep from "lodash/cloneDeep"
import _debounce from "lodash/debounce"
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
    <FastField
      component={FieldHelper.SpecialField}
      widget={<SpecialFieldWidget />}
      {...otherFieldProps}
    />
  )
}

const ReadonlySpecialField = fieldProps =>
  SpecialField({ ...fieldProps, readonly: true })

const TextField = fieldProps => {
  const { onChange, onBlur, ...otherFieldProps } = fieldProps
  return (
    <FastField
      onChange={value => onChange(value, false)}
      component={FieldHelper.InputField}
      {...otherFieldProps}
    />
  )
}

const ReadonlyTextField = fieldProps => {
  const { name, label } = fieldProps
  return (
    <FastField
      name={name}
      label={label}
      component={FieldHelper.ReadonlyField}
    />
  )
}

const DateField = fieldProps => {
  const { name, withTime, ...otherFieldProps } = fieldProps
  return (
    <FastField
      name={name}
      component={FieldHelper.SpecialField}
      widget={<CustomDateInput id={name} withTime={withTime} />}
      {...otherFieldProps}
    />
  )
}

const ReadonlyDateField = fieldProps => {
  const { name, label, withTime } = fieldProps
  return (
    <FastField
      name={name}
      label={label}
      component={FieldHelper.ReadonlyField}
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
    <FastField
      buttons={FieldHelper.customEnumButtons(choices)}
      component={RENDERERS[renderer] || FieldHelper.RadioButtonToggleGroup}
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
    <FastField
      name={name}
      label={label}
      component={FieldHelper.ReadonlyField}
      humanValue={fieldVal => enumHumanValue(choices, fieldVal)}
    />
  )
}

const EnumSetField = fieldProps => {
  const { choices, renderer, ...otherFieldProps } = fieldProps
  return (
    <FastField
      buttons={FieldHelper.customEnumButtons(choices)}
      component={RENDERERS[renderer] || FieldHelper.CheckboxButtonToggleGroup}
      {...otherFieldProps}
    />
  )
}

const getArrayObjectValue = (values, fieldName) => {
  const nameKeys = fieldName.split(".")
  return nameKeys.reduce((v, key) => (v && v[key] ? v[key] : []), values)
}

const ArrayOfObjectsField = fieldProps => {
  const {
    name,
    fieldConfig,
    formikProps,
    invisibleFields,
    updateInvisibleFields
  } = fieldProps
  const value = useMemo(() => getArrayObjectValue(formikProps.values, name), [
    formikProps.values,
    name
  ])
  const objDefault = useMemo(() => {
    const objDefault = {}
    const objSchema = createYupObjectShape(fieldConfig.objectFields)
    return Model.fillObject(objDefault, objSchema)
  }, [fieldConfig.objectFields])
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
              onClick={() => addObject(objDefault, arrayHelpers)}
              bsStyle="primary"
              id="addObjectButton"
            >
              {addButtonLabel}
            </Button>
            {value.map((obj, index) => (
              <ArrayObject
                key={index}
                fieldName={name}
                fieldConfig={fieldConfig}
                formikProps={formikProps}
                invisibleFields={invisibleFields}
                updateInvisibleFields={updateInvisibleFields}
                arrayHelpers={arrayHelpers}
                index={index}
              />
            ))}
          </div>
        )}
      />
    </Fieldset>
  )
}

const ArrayObject = ({
  fieldName,
  fieldConfig,
  formikProps,
  invisibleFields,
  updateInvisibleFields,
  arrayHelpers,
  index
}) => {
  const objLabel = _upperFirst(fieldConfig.objectLabel || "item")
  return (
    <Fieldset title={`${objLabel} ${index + 1}`}>
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
ArrayObject.propTypes = {
  fieldName: PropTypes.string.isRequired,
  fieldConfig: PropTypes.object.isRequired,
  formikProps: PropTypes.object.isRequired,
  invisibleFields: PropTypes.array.isRequired,
  updateInvisibleFields: PropTypes.func.isRequired,
  arrayHelpers: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired
}

const addObject = (objDefault, arrayHelpers) => {
  arrayHelpers.push(objDefault)
}

const ReadonlyArrayOfObjectsField = fieldProps => {
  const { name, fieldConfig, formikProps } = fieldProps
  const value = useMemo(() => getArrayObjectValue(formikProps.values, name), [
    formikProps.values,
    name
  ])
  const fieldsetTitle = fieldConfig.label || ""
  return (
    <Fieldset title={fieldsetTitle}>
      <FieldArray
        name={name}
        render={arrayHelpers => (
          <div>
            {value.map((obj, index) => (
              <ReadonlyArrayObject
                key={index}
                fieldName={name}
                fieldConfig={fieldConfig}
                formikProps={formikProps}
                index={index}
              />
            ))}
          </div>
        )}
      />
    </Fieldset>
  )
}

const ReadonlyArrayObject = ({
  fieldName,
  fieldConfig,
  formikProps,
  index
}) => {
  const objLabel = _upperFirst(fieldConfig.objectLabel || "item")
  return (
    <Fieldset title={`${objLabel} ${index + 1}`}>
      <ReadonlyCustomFields
        fieldsConfig={fieldConfig.objectFields}
        formikProps={formikProps}
        fieldNamePrefix={`${fieldName}.${index}`}
      />
    </Fieldset>
  )
}
ReadonlyArrayObject.propTypes = {
  fieldName: PropTypes.string.isRequired,
  fieldConfig: PropTypes.object.isRequired,
  formikProps: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired
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
    setFieldValue(invisibleFieldsFieldName, invisibleFields, true)
  }, [invisibleFieldsFieldName, invisibleFields, setFieldValue])

  return (
    <>
      <FastField
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
    typeError,
    helpText,
    validations,
    visibleWhen,
    ...fieldProps
  } = fieldConfig
  const { setFieldValue, setFieldTouched, validateForm } = formikProps
  const validateFormDebounced = _debounce(validateForm, 400) // with validateField it somehow doesn't work
  const handleChange = useMemo(
    () => (value, shouldValidate: true) => {
      const val =
        typeof value === "object" && value.target ? value.target.value : value
      const sv = shouldValidate === undefined ? true : shouldValidate
      setFieldTouched(fieldName, true, false)
      setFieldValue(fieldName, val, false)
      if (!sv) {
        validateFormDebounced()
      }
    },
    [fieldName, setFieldTouched, setFieldValue, validateFormDebounced]
  )
  const FieldComponent = FIELD_COMPONENTS[type]
  const extraProps = useMemo(
    () =>
      type !== CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS
        ? {}
        : {
          fieldConfig,
          formikProps,
          invisibleFields,
          updateInvisibleFields
        },
    [fieldConfig, formikProps, invisibleFields, type, updateInvisibleFields]
  )
  return (
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
}
CustomField.propTypes = {
  fieldConfig: PropTypes.object,
  fieldName: PropTypes.string.isRequired,
  formikProps: PropTypes.object,
  invisibleFields: PropTypes.array,
  updateInvisibleFields: PropTypes.func
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
        const fieldName = `${fieldNamePrefix}.${key}`
        return invisibleFields.includes(fieldName) ? null : (
          <CustomField
            key={key}
            fieldConfig={fieldConfig}
            fieldName={fieldName}
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
  [CUSTOM_FIELD_TYPE.ENUMSET]: ReadonlyEnumField,
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
          typeError,
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
            fieldConfig,
            formikProps
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
  if (values.formCustomFields) {
    const clonedValues = _cloneDeep(values)
    if (values.formCustomFields.invisibleCustomFields) {
      clonedValues.formCustomFields.invisibleCustomFields.forEach(f =>
        _set(clonedValues, f.split("."), undefined)
      )
    }
    return JSON.stringify(clonedValues.formCustomFields)
  }
}
