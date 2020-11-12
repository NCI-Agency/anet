import MultiTypeAdvancedSelectComponent from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import CustomDateInput from "components/CustomDateInput"
import LinkAnetEntity from "components/editor/LinkAnetEntity"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LikertScale from "components/graphs/LikertScale"
import Model, {
  createYupObjectShape,
  CUSTOM_FIELD_TYPE,
  DEFAULT_CUSTOM_FIELDS_PARENT,
  INVISIBLE_CUSTOM_FIELDS_FIELD
} from "components/Model"
import RemoveButton from "components/RemoveButton"
import RichTextEditor from "components/RichTextEditor"
import { FastField, FieldArray } from "formik"
import { JSONPath } from "jsonpath-plus"
import _cloneDeep from "lodash/cloneDeep"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import _isEqualWith from "lodash/isEqualWith"
import _set from "lodash/set"
import _upperFirst from "lodash/upperFirst"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { Button, HelpBlock, Table } from "react-bootstrap"
import Settings from "settings"
import { useDebouncedCallback } from "use-debounce"
import utils from "utils"
import { parseHtmlWithLinkTo } from "utils_links"

export const SPECIAL_WIDGET_TYPES = {
  LIKERT_SCALE: "likertScale",
  RICH_TEXT_EDITOR: "richTextEditor"
}
const SPECIAL_WIDGET_COMPONENTS = {
  [SPECIAL_WIDGET_TYPES.LIKERT_SCALE]: LikertScale,
  [SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR]: RichTextEditor
}
const RENDERERS = {}

const SpecialField = ({ name, widget, formikProps, ...otherFieldProps }) => {
  const WidgetComponent = SPECIAL_WIDGET_COMPONENTS[widget]
  const widgetProps = {}
  if (widget === SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR) {
    widgetProps.onHandleBlur = () => {
      // validation will be done by setFieldValue
      formikProps.setFieldTouched(name, true, false)
    }
  } else if (widget === SPECIAL_WIDGET_TYPES.LIKERT_SCALE) {
    // Can't set it on the widgetProps directly as the onChange is required when
    // editable (and onChange is set only while processing the SpecialField)
    otherFieldProps.editable = true
  }
  return (
    <FastField
      name={name}
      component={FieldHelper.SpecialField}
      widget={<WidgetComponent {...widgetProps} />}
      {...otherFieldProps}
    />
  )
}
SpecialField.propTypes = {
  name: PropTypes.string.isRequired,
  widget: PropTypes.oneOf([
    SPECIAL_WIDGET_TYPES.LIKERT_SCALE,
    SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR
  ]).isRequired,
  formikProps: PropTypes.object
}

const ReadonlySpecialField = ({ name, widget, values, ...otherFieldProps }) => {
  if (widget === SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR) {
    const fieldValue = Object.get(values, name) || "" // name might be a path for a nested prop
    return (
      <FastField
        name={name}
        component={FieldHelper.ReadonlyField}
        humanValue={parseHtmlWithLinkTo(fieldValue)}
        {...Object.without(otherFieldProps, "style")}
      />
    )
  } else {
    const WidgetComponent = SPECIAL_WIDGET_COMPONENTS[widget]
    return (
      <FastField
        name={name}
        component={FieldHelper.SpecialField}
        widget={<WidgetComponent />}
        readonly
        {...otherFieldProps}
      />
    )
  }
}
ReadonlySpecialField.propTypes = {
  name: PropTypes.string.isRequired,
  widget: PropTypes.oneOf([
    SPECIAL_WIDGET_TYPES.LIKERT_SCALE,
    SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR
  ]).isRequired,
  values: PropTypes.object
}

const TextField = fieldProps => {
  const { onChange, onBlur, ...otherFieldProps } = fieldProps
  return (
    <FastField
      onChange={value => onChange(value, false)} // do debounced validation
      component={FieldHelper.InputField}
      {...otherFieldProps}
    />
  )
}

const ReadonlyTextField = fieldProps => {
  const { name, label, vertical } = fieldProps
  return (
    <FastField
      name={name}
      label={label}
      vertical={vertical}
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
  const { name, label, vertical, withTime } = fieldProps
  return (
    <FastField
      name={name}
      label={label}
      vertical={vertical}
      component={FieldHelper.ReadonlyField}
      humanValue={fieldVal =>
        fieldVal &&
        moment(fieldVal).format(
          withTime
            ? Settings.dateFormats.forms.displayShort.withTime
            : Settings.dateFormats.forms.displayShort.date
        )
      }
    />
  )
}

const DateTimeField = props => <DateField {...props} withTime />

const ReadonlyDateTimeField = props => <ReadonlyDateField {...props} withTime />

const JsonField = fieldProps => {
  const { name, onChange, fieldConfig, formikProps, ...otherProps } = fieldProps
  const { placeholder } = fieldConfig
  const { values } = formikProps
  const fieldValue = Object.get(values, name) || ""
  const value =
    typeof fieldValue === "object"
      ? JSON.stringify(fieldValue) || ""
      : fieldValue
  return (
    <FastField
      name={name}
      value={value}
      component={FieldHelper.InputField}
      placeholder={placeholder}
      onChange={value => {
        let newValue
        try {
          newValue = utils.parseJsonSafe(value.target.value, true)
        } catch (error) {
          // Invalid JSON, use the string value; yup schema validation will show an error
          newValue = value.target.value
        }
        onChange(newValue)
      }}
      {...otherProps}
    />
  )
}

const ReadonlyJsonField = ({ name, label, values }) => {
  const value = Object.get(values, name) || {}
  return (
    <FastField
      name={name}
      label={label}
      component={FieldHelper.ReadonlyField}
      humanValue={JSON.stringify(value)}
    />
  )
}
ReadonlyJsonField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  values: PropTypes.object.isRequired
}

const EnumField = fieldProps => {
  const { choices, renderer, ...otherFieldProps } = fieldProps
  return (
    <FastField
      buttons={FieldHelper.customEnumButtons(choices)}
      component={RENDERERS[renderer] || FieldHelper.RadioButtonToggleGroupField}
      {...otherFieldProps}
    />
  )
}

const enumHumanValue = (choices, fieldVal) => {
  if (Array.isArray(fieldVal)) {
    return fieldVal && fieldVal.map(k => choices[k]?.label).join(", ")
  } else {
    return fieldVal && choices[fieldVal]?.label
  }
}

const ReadonlyEnumField = fieldProps => {
  const { name, label, vertical, values, choices } = fieldProps
  return (
    <FastField
      name={name}
      label={label}
      vertical={vertical}
      values={values}
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
      component={
        RENDERERS[renderer] || FieldHelper.CheckboxButtonToggleGroupField
      }
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
    updateInvisibleFields,
    vertical,
    children
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
      {children}
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
                vertical={vertical}
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
  vertical,
  arrayHelpers,
  index
}) => {
  const objLabel = _upperFirst(fieldConfig.objectLabel || "item")
  return (
    <Fieldset title={`${objLabel} ${index + 1}`}>
      <RemoveButton
        title={`Remove this ${objLabel}`}
        altText={`Remove this ${objLabel}`}
        onClick={() => arrayHelpers.remove(index)}
      />
      <CustomFields
        fieldsConfig={fieldConfig.objectFields}
        formikProps={formikProps}
        invisibleFields={invisibleFields}
        updateInvisibleFields={updateInvisibleFields}
        vertical={vertical}
        parentFieldName={`${fieldName}.${index}`}
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
  vertical: PropTypes.bool,
  arrayHelpers: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired
}

const addObject = (objDefault, arrayHelpers) => {
  arrayHelpers.push(objDefault)
}

const ReadonlyArrayOfObjectsField = fieldProps => {
  const { name, fieldConfig, values, vertical } = fieldProps
  const value = useMemo(() => getArrayObjectValue(values, name), [values, name])
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
                values={values}
                index={index}
                vertical={vertical}
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
  values,
  vertical,
  index
}) => {
  const objLabel = _upperFirst(fieldConfig.objectLabel || "item")
  return (
    <Fieldset title={`${objLabel} ${index + 1}`}>
      <ReadonlyCustomFields
        fieldsConfig={fieldConfig.objectFields}
        parentFieldName={`${fieldName}.${index}`}
        values={values}
        vertical={vertical}
      />
    </Fieldset>
  )
}
ReadonlyArrayObject.propTypes = {
  fieldName: PropTypes.string.isRequired,
  fieldConfig: PropTypes.object.isRequired,
  values: PropTypes.object.isRequired,
  vertical: PropTypes.bool,
  index: PropTypes.number.isRequired
}

const AnetObjectField = ({
  name,
  types,
  formikProps,
  children,
  ...otherFieldProps
}) => {
  const { values, setFieldValue } = formikProps
  const fieldValue = Object.get(values, name) || {}
  return (
    <FastField
      name={name}
      component={FieldHelper.SpecialField}
      value={fieldValue}
      widget={
        <MultiTypeAdvancedSelectComponent
          fieldName={name}
          entityTypes={types}
          onConfirm={(value, entityType) =>
            setFieldValue(name, {
              type: entityType,
              uuid: value.uuid
            })
          }
        />
      }
      {...otherFieldProps}
    >
      {children}
      {fieldValue.type && fieldValue.uuid && (
        <Table id={`${name}-value`} striped condensed hover responsive>
          <tbody>
            <tr>
              <td>
                <LinkAnetEntity type={fieldValue.type} uuid={fieldValue.uuid} />
              </td>
              <td className="col-xs-1">
                <RemoveButton
                  title={`Unlink this ${fieldValue.type}`}
                  altText={`Unlink this ${fieldValue.type}`}
                  onClick={() => setFieldValue(name, null)}
                />
              </td>
            </tr>
          </tbody>
        </Table>
      )}
    </FastField>
  )
}
AnetObjectField.propTypes = {
  name: PropTypes.string.isRequired,
  types: PropTypes.arrayOf(PropTypes.string),
  formikProps: PropTypes.object,
  children: PropTypes.node
}

const ReadonlyAnetObjectField = ({ name, label, values }) => {
  const { type, uuid } = Object.get(values, name) || {}
  return (
    <FastField
      name={name}
      label={label}
      component={FieldHelper.ReadonlyField}
      humanValue={
        type &&
        uuid && (
          <Table id={`${name}-value`} striped condensed hover responsive>
            <tbody>
              <tr>
                <td>
                  <LinkAnetEntity type={type} uuid={uuid} />
                </td>
              </tr>
            </tbody>
          </Table>
        )
      }
    />
  )
}
ReadonlyAnetObjectField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  values: PropTypes.object.isRequired
}

const ArrayOfAnetObjectsField = ({
  name,
  types,
  formikProps,
  children,
  ...otherFieldProps
}) => {
  const { values, setFieldValue } = formikProps
  const fieldValue = Object.get(values, name) || []
  return (
    <FastField
      name={name}
      component={FieldHelper.SpecialField}
      value={fieldValue}
      widget={
        <MultiTypeAdvancedSelectComponent
          fieldName={name}
          entityTypes={types}
          isMultiSelect
          onConfirm={(value, entityType) => {
            if (value.length > fieldValue.length) {
              // entity was added at the end, set correct value
              const addedEntity = value.pop()
              value.push({
                type: entityType,
                uuid: addedEntity.uuid
              })
            }
            setFieldValue(name, value)
          }}
        />
      }
      {...otherFieldProps}
    >
      {children}
      {!_isEmpty(fieldValue) && (
        <Table id={`${name}-value`} striped condensed hover responsive>
          <tbody>
            {fieldValue.map(entity => (
              <tr key={entity.uuid}>
                <td>
                  <LinkAnetEntity type={entity.type} uuid={entity.uuid} />
                </td>
                <td className="col-xs-1">
                  <RemoveButton
                    title={`Unlink this ${entity.type}`}
                    altText={`Unlink this ${entity.type}`}
                    onClick={() => {
                      let found = false
                      const newValue = fieldValue.filter(e => {
                        if (_isEqual(e, entity)) {
                          found = true
                          return false
                        }
                        return true
                      })
                      if (found) {
                        setFieldValue(name, newValue)
                      }
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </FastField>
  )
}
ArrayOfAnetObjectsField.propTypes = {
  name: PropTypes.string.isRequired,
  types: PropTypes.arrayOf(PropTypes.string),
  formikProps: PropTypes.object,
  children: PropTypes.node
}

const ReadonlyArrayOfAnetObjectsField = ({ name, label, values }) => {
  const fieldValue = Object.get(values, name) || []
  return (
    <FastField
      name={name}
      label={label}
      component={FieldHelper.ReadonlyField}
      humanValue={
        !_isEmpty(fieldValue) && (
          <Table id={`${name}-value`} striped condensed hover responsive>
            <tbody>
              {fieldValue.map(entity => (
                <tr key={entity.uuid}>
                  <td>
                    <LinkAnetEntity type={entity.type} uuid={entity.uuid} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )
      }
    />
  )
}
ReadonlyArrayOfAnetObjectsField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  values: PropTypes.object.isRequired
}

const FIELD_COMPONENTS = {
  [CUSTOM_FIELD_TYPE.TEXT]: TextField,
  [CUSTOM_FIELD_TYPE.NUMBER]: TextField,
  [CUSTOM_FIELD_TYPE.DATE]: DateField,
  [CUSTOM_FIELD_TYPE.DATETIME]: DateTimeField,
  [CUSTOM_FIELD_TYPE.JSON]: JsonField,
  [CUSTOM_FIELD_TYPE.ENUM]: EnumField,
  [CUSTOM_FIELD_TYPE.ENUMSET]: EnumSetField,
  [CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS]: ArrayOfObjectsField,
  [CUSTOM_FIELD_TYPE.SPECIAL_FIELD]: SpecialField,
  [CUSTOM_FIELD_TYPE.ANET_OBJECT]: AnetObjectField,
  [CUSTOM_FIELD_TYPE.ARRAY_OF_ANET_OBJECTS]: ArrayOfAnetObjectsField
}

function getInvisibleFields(
  invisibleFields,
  fieldsConfig,
  parentFieldName,
  formikValues
) {
  const prevInvisibleFields = _cloneDeep(invisibleFields)
  const turnedInvisible = []
  const turnedVisible = []
  let curInvisibleFields = []
  Object.keys(fieldsConfig).forEach(key => {
    const fieldConfig = fieldsConfig[key]
    const fieldName = `${parentFieldName}.${key}`
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
  const { parentFieldName, formikProps } = props
  const [invisibleFields, setInvisibleFields] = useState([])
  const { setFieldValue } = formikProps
  const invisibleFieldsFieldName = `${parentFieldName}.${INVISIBLE_CUSTOM_FIELDS_FIELD}`
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
  parentFieldName: PropTypes.string.isRequired,
  vertical: PropTypes.bool
}
CustomFieldsContainer.defaultProps = {
  parentFieldName: DEFAULT_CUSTOM_FIELDS_PARENT,
  vertical: false
}

export const getFieldPropsFromFieldConfig = fieldConfig => {
  const {
    aggregations,
    type,
    typeError,
    placeholder,
    helpText,
    validations,
    visibleWhen,
    objectFields,
    ...fieldProps
  } = fieldConfig
  return fieldProps
}

const CustomField = ({
  fieldConfig,
  fieldName,
  formikProps,
  invisibleFields,
  updateInvisibleFields,
  vertical
}) => {
  const { type, helpText } = fieldConfig
  const fieldProps = getFieldPropsFromFieldConfig(fieldConfig)
  const { setFieldValue, setFieldTouched, validateForm } = formikProps
  const { callback: validateFormDebounced } = useDebouncedCallback(
    validateForm,
    400
  ) // with validateField it somehow doesn't work
  const handleChange = useMemo(
    () => (value, shouldValidate = true) => {
      const val =
        value?.target?.value !== undefined ? value.target.value : value
      const sv = shouldValidate === undefined ? true : shouldValidate
      setFieldTouched(fieldName, true, false)
      setFieldValue(fieldName, val, sv)
      if (!sv) {
        validateFormDebounced()
      }
    },
    [fieldName, setFieldTouched, setFieldValue, validateFormDebounced]
  )
  const FieldComponent = FIELD_COMPONENTS[type]
  const extraProps = useMemo(() => {
    switch (type) {
      case CUSTOM_FIELD_TYPE.SPECIAL_FIELD:
        return {
          fieldConfig,
          formikProps
        }
      case CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS:
        return {
          fieldConfig,
          formikProps,
          invisibleFields,
          updateInvisibleFields
        }
      case CUSTOM_FIELD_TYPE.JSON:
        return {
          fieldConfig,
          formikProps
        }
      case CUSTOM_FIELD_TYPE.ANET_OBJECT:
      case CUSTOM_FIELD_TYPE.ARRAY_OF_ANET_OBJECTS:
        return {
          formikProps
        }
      default:
        return {}
    }
  }, [fieldConfig, formikProps, invisibleFields, type, updateInvisibleFields])
  return FieldComponent ? (
    <FieldComponent
      name={fieldName}
      onChange={handleChange}
      vertical={vertical}
      {...fieldProps}
      {...extraProps}
    >
      {helpText && <HelpBlock>{helpText}</HelpBlock>}
    </FieldComponent>
  ) : (
    <FastField
      name={fieldName}
      label={fieldProps.label}
      vertical={fieldProps.vertical}
      component={FieldHelper.ReadonlyField}
      humanValue={<i>Missing FieldComponent for {type}</i>}
    />
  )
}
CustomField.propTypes = {
  fieldConfig: PropTypes.object,
  fieldName: PropTypes.string.isRequired,
  formikProps: PropTypes.object,
  invisibleFields: PropTypes.array,
  updateInvisibleFields: PropTypes.func,
  vertical: PropTypes.bool
}

const CustomFields = ({
  fieldsConfig,
  formikProps,
  parentFieldName,
  invisibleFields,
  updateInvisibleFields,
  vertical
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
        parentFieldName,
        formikValues
      ),
    [invisibleFields, fieldsConfig, parentFieldName, formikValues]
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
        const fieldName = `${parentFieldName}.${key}`
        return invisibleFields.includes(fieldName) ? null : (
          <CustomField
            key={key}
            fieldConfig={fieldConfig}
            fieldName={fieldName}
            formikProps={formikProps}
            invisibleFields={invisibleFields}
            updateInvisibleFields={updateInvisibleFields}
            vertical={vertical}
          />
        )
      })}
    </>
  )
}
CustomFields.propTypes = {
  fieldsConfig: PropTypes.object,
  formikProps: PropTypes.object,
  parentFieldName: PropTypes.string.isRequired,
  invisibleFields: PropTypes.array,
  updateInvisibleFields: PropTypes.func,
  vertical: PropTypes.bool
}
CustomFields.defaultProps = {
  parentFieldName: DEFAULT_CUSTOM_FIELDS_PARENT,
  vertical: false
}

const READONLY_FIELD_COMPONENTS = {
  [CUSTOM_FIELD_TYPE.TEXT]: ReadonlyTextField,
  [CUSTOM_FIELD_TYPE.NUMBER]: ReadonlyTextField,
  [CUSTOM_FIELD_TYPE.DATE]: ReadonlyDateField,
  [CUSTOM_FIELD_TYPE.DATETIME]: ReadonlyDateTimeField,
  [CUSTOM_FIELD_TYPE.JSON]: ReadonlyJsonField,
  [CUSTOM_FIELD_TYPE.ENUM]: ReadonlyEnumField,
  [CUSTOM_FIELD_TYPE.ENUMSET]: ReadonlyEnumField,
  [CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS]: ReadonlyArrayOfObjectsField,
  [CUSTOM_FIELD_TYPE.SPECIAL_FIELD]: ReadonlySpecialField,
  [CUSTOM_FIELD_TYPE.ANET_OBJECT]: ReadonlyAnetObjectField,
  [CUSTOM_FIELD_TYPE.ARRAY_OF_ANET_OBJECTS]: ReadonlyArrayOfAnetObjectsField
}

export const ReadonlyCustomFields = ({
  fieldsConfig,
  parentFieldName, // key path in the values object to get to the level of fields given by the fieldsConfig
  values,
  vertical
}) => {
  return (
    <>
      {Object.keys(fieldsConfig).map(key => {
        const fieldName = `${parentFieldName}.${key}`
        const fieldConfig = fieldsConfig[key]
        const fieldProps = getFieldPropsFromFieldConfig(fieldConfig)
        const { type } = fieldConfig
        let extraProps = {}
        if (type === CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS) {
          extraProps = {
            fieldConfig
          }
        }
        const ReadonlyFieldComponent = READONLY_FIELD_COMPONENTS[type]
        return ReadonlyFieldComponent ? (
          <ReadonlyFieldComponent
            key={key}
            name={fieldName}
            values={values}
            vertical={vertical}
            {...fieldProps}
            {...extraProps}
          />
        ) : (
          <FastField
            key={key}
            name={fieldName}
            label={fieldProps.label}
            vertical={fieldProps.vertical}
            component={FieldHelper.ReadonlyField}
            humanValue={<i>Missing ReadonlyFieldComponent for {type}</i>}
          />
        )
      })}
    </>
  )
}
ReadonlyCustomFields.propTypes = {
  fieldsConfig: PropTypes.object,
  parentFieldName: PropTypes.string.isRequired,
  values: PropTypes.object.isRequired,
  vertical: PropTypes.bool
}
ReadonlyCustomFields.defaultProps = {
  parentFieldName: DEFAULT_CUSTOM_FIELDS_PARENT,
  vertical: false
}

// customFields should contain the JSON of all the visible custom fields.
// When used for notes text, it should not contain the INVISIBLE_CUSTOM_FIELDS_FIELD.
export const customFieldsJSONString = (
  values,
  forNoteText = false,
  parentFieldName = DEFAULT_CUSTOM_FIELDS_PARENT
) => {
  const customFieldsValues = Object.get(values, parentFieldName)
  if (customFieldsValues && typeof customFieldsValues === "object") {
    const clonedValues = _cloneDeep(values)
    const filteredCustomFieldsValues = Object.get(clonedValues, parentFieldName)
    if (filteredCustomFieldsValues[INVISIBLE_CUSTOM_FIELDS_FIELD]) {
      filteredCustomFieldsValues[INVISIBLE_CUSTOM_FIELDS_FIELD].forEach(f =>
        _set(clonedValues, f.split("."), undefined)
      )
      if (forNoteText) {
        delete filteredCustomFieldsValues[INVISIBLE_CUSTOM_FIELDS_FIELD]
      }
    }
    return JSON.stringify(filteredCustomFieldsValues)
  }
}
