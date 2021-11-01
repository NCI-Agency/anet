import { Icon, Intent } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { Tooltip2 } from "@blueprintjs/popover2"
import MultiTypeAdvancedSelectComponent from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import CustomDateInput from "components/CustomDateInput"
import { parseHtmlWithLinkTo } from "components/editor/LinkAnet"
import LinkAnetEntity from "components/editor/LinkAnetEntity"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LikertScale from "components/graphs/LikertScale"
import Model, {
  createYupObjectShape,
  CUSTOM_FIELD_TYPE,
  DEFAULT_CUSTOM_FIELDS_PARENT,
  ENTITY_ASSESSMENT_PARENT_FIELD,
  ENTITY_ON_DEMAND_ASSESSMENT_DATE,
  INVISIBLE_CUSTOM_FIELDS_FIELD,
  SENSITIVE_CUSTOM_FIELDS_PARENT
} from "components/Model"
import RemoveButton from "components/RemoveButton"
import RichTextEditor from "components/RichTextEditor"
import { FastField, FieldArray } from "formik"
import { JSONPath } from "jsonpath-plus"
import _cloneDeep from "lodash/cloneDeep"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import _set from "lodash/set"
import _upperFirst from "lodash/upperFirst"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useEffect, useMemo } from "react"
import { Badge, Button, Form, Table } from "react-bootstrap"
import Settings from "settings"
import { useDebouncedCallback } from "use-debounce"
import utils from "utils"

export const SPECIAL_WIDGET_TYPES = {
  LIKERT_SCALE: "likertScale",
  RICH_TEXT_EDITOR: "richTextEditor"
}
const SPECIAL_WIDGET_COMPONENTS = {
  [SPECIAL_WIDGET_TYPES.LIKERT_SCALE]: LikertScale,
  [SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR]: RichTextEditor
}

const SpecialField = ({
  name,
  widget,
  formikProps,
  linkToComp,
  ...otherFieldProps
}) => {
  const WidgetComponent = SPECIAL_WIDGET_COMPONENTS[widget]
  const widgetProps = {}
  if (widget === SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR) {
    widgetProps.onHandleBlur = () => {
      // validation will be done by setFieldValue
      formikProps.setFieldTouched(name, true, false)
    }
    widgetProps.linkToComp = linkToComp
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
  linkToComp: PropTypes.func.isRequired,
  widget: PropTypes.oneOf([
    SPECIAL_WIDGET_TYPES.LIKERT_SCALE,
    SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR
  ]).isRequired,
  formikProps: PropTypes.object
}

const ReadonlySpecialField = ({
  name,
  widget,
  values,
  isCompact,
  linkToComp,
  ...otherFieldProps
}) => {
  if (widget === SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR) {
    const fieldValue = Object.get(values, name) || "" // name might be a path for a nested prop
    return (
      <FastField
        name={name}
        isCompact={isCompact}
        component={FieldHelper.ReadonlyField}
        humanValue={parseHtmlWithLinkTo(fieldValue, linkToComp)}
        {...Object.without(otherFieldProps, "style")}
      />
    )
  } else {
    const WidgetComponent = SPECIAL_WIDGET_COMPONENTS[widget]
    return (
      <FastField
        name={name}
        isCompact={isCompact}
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
  linkToComp: PropTypes.func.isRequired,
  widget: PropTypes.oneOf([
    SPECIAL_WIDGET_TYPES.LIKERT_SCALE,
    SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR
  ]).isRequired,
  values: PropTypes.object,
  isCompact: PropTypes.bool
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

const NumberField = fieldProps => {
  const { onChange, onBlur, ...otherFieldProps } = fieldProps
  return (
    <FastField
      onChange={value => onChange(value, false)} // do debounced validation
      onWheelCapture={event => event.currentTarget.blur()} // Prevent scroll action on number input
      component={FieldHelper.InputField}
      inputType="number"
      {...otherFieldProps}
    />
  )
}

const ReadonlyTextField = fieldProps => {
  const {
    name,
    label,
    vertical,
    isCompact,
    extraColElem,
    labelColumnWidth,
    className
  } = fieldProps
  return (
    <FastField
      name={name}
      label={label}
      vertical={vertical}
      isCompact={isCompact}
      extraColElem={extraColElem}
      labelColumnWidth={labelColumnWidth}
      component={FieldHelper.ReadonlyField}
      className={className}
    />
  )
}

const DateField = fieldProps => {
  const { name, withTime, maxDate, ...otherFieldProps } = fieldProps
  return (
    <FastField
      name={name}
      component={FieldHelper.SpecialField}
      widget={
        <CustomDateInput id={name} withTime={withTime} maxDate={maxDate} />
      }
      {...otherFieldProps}
    />
  )
}

const ReadonlyDateField = fieldProps => {
  const {
    name,
    label,
    vertical,
    isCompact,
    withTime,
    extraColElem,
    labelColumnWidth,
    className
  } = fieldProps
  return (
    <FastField
      name={name}
      label={label}
      vertical={vertical}
      isCompact={isCompact}
      extraColElem={extraColElem}
      labelColumnWidth={labelColumnWidth}
      component={FieldHelper.ReadonlyField}
      humanValue={fieldVal =>
        fieldVal &&
        moment(fieldVal).format(
          withTime
            ? Settings.dateFormats.forms.displayShort.withTime
            : Settings.dateFormats.forms.displayShort.date
        )
      }
      className={className}
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

const ReadonlyJsonField = ({
  name,
  label,
  values,
  extraColElem,
  labelColumnWidth,
  className
}) => {
  const value = Object.get(values, name) || {}
  return (
    <FastField
      name={name}
      label={label}
      component={FieldHelper.ReadonlyField}
      humanValue={JSON.stringify(value)}
      extraColElem={extraColElem}
      labelColumnWidth={labelColumnWidth}
      className={className}
    />
  )
}
ReadonlyJsonField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  values: PropTypes.object.isRequired,
  extraColElem: PropTypes.object,
  labelColumnWidth: PropTypes.number,
  className: PropTypes.string
}

const EnumField = fieldProps => {
  const { choices, ...otherFieldProps } = fieldProps
  return (
    <FastField
      buttons={FieldHelper.customEnumButtons(choices)}
      enableClear
      component={FieldHelper.RadioButtonToggleGroupField}
      {...otherFieldProps}
    />
  )
}

const enumHumanValue = (choices, fieldVal) => {
  if (Array.isArray(fieldVal)) {
    return (
      <div>
        {fieldVal.map((k, index) => (
          <span key={k}>
            <Badge
              bg={null} // we want to override the colors
              style={{
                fontSize: "inherit",
                fontWeight: "inherit",
                lineHeight: "inherit",
                color: "black",
                backgroundColor: choices[k]?.color || "white"
              }}
            >
              {choices[k]?.label}
            </Badge>
            {index < fieldVal.length - 1 && ", "}
          </span>
        ))}
      </div>
    )
  } else {
    return (
      fieldVal && (
        <Badge
          bg={null} // we want to override the colors
          style={{
            fontSize: "inherit",
            fontWeight: "inherit",
            lineHeight: "inherit",
            color: "black",
            backgroundColor: choices[fieldVal]?.color || "white"
          }}
        >
          {choices[fieldVal]?.label}
        </Badge>
      )
    )
  }
}

const ReadonlyEnumField = fieldProps => {
  const {
    name,
    label,
    vertical,
    values,
    isCompact,
    choices,
    extraColElem,
    labelColumnWidth,
    className
  } = fieldProps
  return (
    <FastField
      name={name}
      label={label}
      vertical={vertical}
      values={values}
      isCompact={isCompact}
      component={FieldHelper.ReadonlyField}
      humanValue={fieldVal => enumHumanValue(choices, fieldVal)}
      extraColElem={extraColElem}
      labelColumnWidth={labelColumnWidth}
      className={className}
    />
  )
}

const EnumSetField = fieldProps => {
  const { choices, ...otherFieldProps } = fieldProps
  return (
    <FastField
      buttons={FieldHelper.customEnumButtons(choices)}
      component={FieldHelper.CheckboxButtonToggleGroupField}
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
    linkToComp,
    vertical,
    children
  } = fieldProps
  const value = useMemo(() => getArrayObjectValue(formikProps.values, name), [
    formikProps.values,
    name
  ])
  const objDefault = useMemo(() => {
    const objDefault = {}
    const objSchema = createYupObjectShape(
      fieldConfig.objectFields,
      DEFAULT_CUSTOM_FIELDS_PARENT,
      false
    )
    return Model.fillObject(objDefault, objSchema)
  }, [fieldConfig.objectFields])

  const fieldsetTitle = fieldConfig.label || ""
  const addButtonLabel = fieldConfig.addButtonLabel || "Add a new item"
  return (
    <Fieldset title={fieldsetTitle} id={name}>
      {children}
      <FieldArray
        name={name}
        render={arrayHelpers => (
          <div>
            <Button
              className="float-end"
              onClick={() => addObject(objDefault, arrayHelpers)}
              variant="secondary"
              id={`add-${name}`}
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
                linkToComp={linkToComp}
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
  vertical,
  arrayHelpers,
  linkToComp,
  index
}) => {
  const objLabel = _upperFirst(fieldConfig.objectLabel || "item")
  return (
    <Fieldset title={`${objLabel} ${index + 1}`}>
      <RemoveButton
        title={`Remove this ${objLabel}`}
        onClick={() => arrayHelpers.remove(index)}
      />
      <CustomFields
        fieldsConfig={fieldConfig.objectFields}
        formikProps={formikProps}
        invisibleFields={invisibleFields}
        linkToComp={linkToComp}
        vertical={vertical}
        parentFieldName={`${fieldName}.${index}`}
      />
    </Fieldset>
  )
}
ArrayObject.propTypes = {
  fieldName: PropTypes.string.isRequired,
  fieldConfig: PropTypes.object.isRequired,
  linkToComp: PropTypes.func.isRequired,
  formikProps: PropTypes.object.isRequired,
  invisibleFields: PropTypes.array.isRequired,
  vertical: PropTypes.bool,
  arrayHelpers: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired
}

const addObject = (objDefault, arrayHelpers) => {
  arrayHelpers.push(objDefault)
}

const ReadonlyArrayOfObjectsField = fieldProps => {
  const {
    name,
    fieldConfig,
    values,
    isCompact,
    vertical,
    linkToComp,
    extraColElem,
    labelColumnWidth
  } = fieldProps
  const value = useMemo(() => getArrayObjectValue(values, name), [values, name])
  const fieldsetTitle = fieldConfig.label || ""

  const arrayOfObjects = value.map((obj, index) => (
    <ReadonlyArrayObject
      key={index}
      fieldName={name}
      fieldConfig={fieldConfig}
      values={values}
      isCompact={isCompact}
      linkToComp={linkToComp}
      index={index}
      vertical={vertical}
      extraColElem={extraColElem}
      labelColumnWidth={labelColumnWidth}
    />
  ))

  return (
    <Fieldset title={fieldsetTitle} isCompact={isCompact}>
      <FieldArray
        name={name}
        /* div cannot be parent or child in print table, tbody, tr */
        render={arrayHelpers =>
          isCompact ? <>{arrayOfObjects}</> : <div>{arrayOfObjects}</div>
        }
      />
    </Fieldset>
  )
}

const ReadonlyArrayObject = ({
  fieldName,
  fieldConfig,
  values,
  linkToComp,
  vertical,
  index,
  isCompact,
  extraColElem,
  labelColumnWidth
}) => {
  const objLabel = _upperFirst(fieldConfig.objectLabel || "item")
  return (
    <Fieldset title={`${objLabel} ${index + 1}`} isCompact={isCompact}>
      <ReadonlyCustomFields
        fieldsConfig={fieldConfig.objectFields}
        parentFieldName={`${fieldName}.${index}`}
        values={values}
        isCompact={isCompact}
        linkToComp={linkToComp}
        vertical={vertical}
        extraColElem={extraColElem}
        labelColumnWidth={labelColumnWidth}
      />
    </Fieldset>
  )
}
ReadonlyArrayObject.propTypes = {
  fieldName: PropTypes.string.isRequired,
  fieldConfig: PropTypes.object.isRequired,
  values: PropTypes.object.isRequired,
  linkToComp: PropTypes.func.isRequired,
  vertical: PropTypes.bool,
  index: PropTypes.number.isRequired,
  isCompact: PropTypes.bool,
  extraColElem: PropTypes.object,
  labelColumnWidth: PropTypes.number
}

const AnetObjectField = ({
  name,
  types,
  formikProps,
  children,
  linkToComp,
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
              uuid: value?.uuid
            })
          }
        />
      }
      {...otherFieldProps}
    >
      {children}
      {fieldValue.type && fieldValue.uuid && (
        <Table id={`${name}-value`} striped hover responsive>
          <tbody>
            <tr>
              <td>
                <LinkAnetEntity
                  type={fieldValue.type}
                  uuid={fieldValue.uuid}
                  linkToComp={linkToComp}
                />
              </td>
              <td className="col-xs-1">
                <RemoveButton
                  title={`Unlink this ${fieldValue.type}`}
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
  linkToComp: PropTypes.func.isRequired,
  types: PropTypes.arrayOf(PropTypes.string),
  formikProps: PropTypes.object,
  children: PropTypes.node
}

const ReadonlyAnetObjectField = ({
  name,
  label,
  values,
  isCompact,
  linkToComp,
  extraColElem,
  labelColumnWidth,
  className
}) => {
  const { type, uuid } = Object.get(values, name) || {}
  return (
    <FastField
      name={name}
      label={label}
      component={FieldHelper.ReadonlyField}
      isCompact={isCompact}
      humanValue={
        type &&
        uuid && (
          <Table id={`${name}-value`} striped hover responsive>
            <tbody>
              <tr>
                <td>
                  <LinkAnetEntity
                    type={type}
                    uuid={uuid}
                    linkToComp={linkToComp}
                  />
                </td>
              </tr>
            </tbody>
          </Table>
        )
      }
      extraColElem={extraColElem}
      labelColumnWidth={labelColumnWidth}
      className={className}
    />
  )
}
ReadonlyAnetObjectField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  values: PropTypes.object.isRequired,
  linkToComp: PropTypes.func.isRequired,
  isCompact: PropTypes.bool,
  extraColElem: PropTypes.object,
  labelColumnWidth: PropTypes.number,
  className: PropTypes.string
}

const ArrayOfAnetObjectsField = ({
  name,
  types,
  formikProps,
  children,
  linkToComp,
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
        <Table id={`${name}-value`} striped hover responsive>
          <tbody>
            {fieldValue.map(entity => (
              <tr key={entity.uuid}>
                <td>
                  <LinkAnetEntity
                    type={entity.type}
                    uuid={entity.uuid}
                    linkToComp={linkToComp}
                  />
                </td>
                <td className="col-xs-1">
                  <RemoveButton
                    title={`Unlink this ${entity.type}`}
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
  linkToComp: PropTypes.func.isRequired,
  types: PropTypes.arrayOf(PropTypes.string),
  formikProps: PropTypes.object,
  children: PropTypes.node
}

const ReadonlyArrayOfAnetObjectsField = ({
  name,
  label,
  values,
  isCompact,
  linkToComp,
  extraColElem,
  labelColumnWidth,
  className
}) => {
  const fieldValue = Object.get(values, name) || []
  return (
    <FastField
      name={name}
      label={label}
      component={FieldHelper.ReadonlyField}
      isCompact={isCompact}
      humanValue={
        !_isEmpty(fieldValue) && (
          <Table id={`${name}-value`} striped hover responsive>
            <tbody>
              {fieldValue.map(entity => (
                <tr key={entity.uuid}>
                  <td>
                    <LinkAnetEntity
                      type={entity.type}
                      uuid={entity.uuid}
                      linkToComp={linkToComp}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )
      }
      extraColElem={extraColElem}
      labelColumnWidth={labelColumnWidth}
      className={className}
    />
  )
}
ReadonlyArrayOfAnetObjectsField.propTypes = {
  name: PropTypes.string.isRequired,
  linkToComp: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  values: PropTypes.object.isRequired,
  isCompact: PropTypes.bool,
  extraColElem: PropTypes.object,
  labelColumnWidth: PropTypes.number,
  className: PropTypes.string
}

const FIELD_COMPONENTS = {
  [CUSTOM_FIELD_TYPE.TEXT]: TextField,
  [CUSTOM_FIELD_TYPE.NUMBER]: NumberField,
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

// mutates the object
export function initInvisibleFields(
  anetObj,
  config,
  parentFieldName = DEFAULT_CUSTOM_FIELDS_PARENT
) {
  if (anetObj[parentFieldName]) {
    // set initial invisible custom fields
    anetObj[parentFieldName][
      INVISIBLE_CUSTOM_FIELDS_FIELD
    ] = getInvisibleFields(config, parentFieldName, anetObj)
  }
}

export function getInvisibleFields(
  fieldsConfig = {},
  parentFieldName,
  formikValues,
  isArrayOfObjects = false
) {
  const curInvisibleFields = []
  // loop through fields of the config to check for visibility of a field
  Object.entries(fieldsConfig).forEach(([key, fieldConfig]) => {
    const visibleWhenPath = fieldConfig.visibleWhen
    const isVisible =
      !visibleWhenPath ||
      !_isEmpty(JSONPath({ path: visibleWhenPath, json: formikValues }))

    const fieldName = `${parentFieldName}.${key}`

    // recursively append invisible fields in case of array of objects
    // we can have customFields.array_of_objects.objectFields.array_of_objects.objectFields...
    if (fieldConfig.type === CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS) {
      curInvisibleFields.push(
        ...getInvisibleFields(
          fieldConfig.objectFields,
          fieldName,
          formikValues,
          true
        )
      )
    }
    if (!isVisible) {
      if (isArrayOfObjects) {
        // insert index to fieldName
        // so that we can acces array items with _set, _get methods
        _get(formikValues, parentFieldName).forEach((obj, index) => {
          curInvisibleFields.push(`${parentFieldName}.${index}.${key}`)
        })
      } else {
        curInvisibleFields.push(fieldName)
      }
    }
  })
  return curInvisibleFields
}

export const CustomFieldsContainer = props => {
  const {
    parentFieldName,
    formikProps: { values, setFieldValue },
    fieldsConfig
  } = props

  const invisibleFields = useMemo(
    () => getInvisibleFields(fieldsConfig, parentFieldName, values),
    [fieldsConfig, parentFieldName, values]
  )

  const invisibleFieldsFieldName = `${parentFieldName}.${INVISIBLE_CUSTOM_FIELDS_FIELD}`
  useEffect(() => {
    if (!_isEqual(_get(values, invisibleFieldsFieldName), invisibleFields)) {
      setFieldValue(invisibleFieldsFieldName, invisibleFields, true)
    }
  }, [invisibleFields, values, invisibleFieldsFieldName, setFieldValue])

  return (
    <>
      <CustomFields invisibleFields={invisibleFields} {...props} />
    </>
  )
}
CustomFieldsContainer.propTypes = {
  fieldsConfig: PropTypes.object,
  formikProps: PropTypes.object,
  parentFieldName: PropTypes.string.isRequired,
  linkToComp: PropTypes.func.isRequired,
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
    authorizationGroupUuids,
    tooltipText,
    validations,
    visibleWhen,
    test,
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
  linkToComp,
  vertical
}) => {
  const { type, helpText, authorizationGroupUuids } = fieldConfig
  let extraColElem
  if (authorizationGroupUuids) {
    if (fieldConfig.authorizationGroupUuids) {
      extraColElem = (
        <div>
          <Tooltip2 content={fieldConfig.tooltipText} intent={Intent.WARNING}>
            <Icon icon={IconNames.INFO_SIGN} intent={Intent.PRIMARY} />
          </Tooltip2>
        </div>
      )
    }
  }
  const fieldProps = getFieldPropsFromFieldConfig(fieldConfig)
  const { setFieldValue, setFieldTouched, validateForm } = formikProps
  const validateFormDebounced = useDebouncedCallback(validateForm, 400) // with validateField it somehow doesn't work
  const handleChange = useMemo(
    () => (value, shouldValidate = true) => {
      let val = value?.target?.value !== undefined ? value.target.value : value
      if (type === "number" && val === "") {
        val = null
      }
      const sv = shouldValidate === undefined ? true : shouldValidate
      setFieldTouched(fieldName, true, false)
      setFieldValue(fieldName, val, sv)
      if (!sv) {
        validateFormDebounced()
      }
    },
    [fieldName, setFieldTouched, setFieldValue, validateFormDebounced, type]
  )
  const FieldComponent = FIELD_COMPONENTS[type]
  const extraProps = useMemo(() => {
    switch (type) {
      case CUSTOM_FIELD_TYPE.SPECIAL_FIELD:
        return {
          fieldConfig,
          formikProps,
          linkToComp
        }
      case CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS:
        return {
          fieldConfig,
          formikProps,
          invisibleFields,
          linkToComp
        }
      case CUSTOM_FIELD_TYPE.JSON:
        return {
          fieldConfig,
          formikProps
        }
      case CUSTOM_FIELD_TYPE.ANET_OBJECT:
      case CUSTOM_FIELD_TYPE.ARRAY_OF_ANET_OBJECTS:
        return {
          formikProps,
          linkToComp
        }
      case CUSTOM_FIELD_TYPE.DATE:
        return {
          maxDate:
            fieldName ===
            `${ENTITY_ASSESSMENT_PARENT_FIELD}.${ENTITY_ON_DEMAND_ASSESSMENT_DATE}`
              ? moment().toDate()
              : undefined
        }
      default:
        return {}
    }
  }, [fieldConfig, fieldName, formikProps, invisibleFields, type, linkToComp])
  return FieldComponent ? (
    <FieldComponent
      name={fieldName}
      onChange={handleChange}
      vertical={vertical}
      extraColElem={extraColElem}
      {...fieldProps}
      {...extraProps}
    >
      {helpText && <Form.Text as="div">{helpText}</Form.Text>}
    </FieldComponent>
  ) : (
    <FastField
      name={fieldName}
      component={FieldHelper.ReadonlyField}
      humanValue={<i>Missing FieldComponent for {type}</i>}
      {...fieldProps}
    />
  )
}
CustomField.propTypes = {
  fieldConfig: PropTypes.object,
  fieldName: PropTypes.string.isRequired,
  linkToComp: PropTypes.func.isRequired,
  formikProps: PropTypes.object,
  invisibleFields: PropTypes.array,
  vertical: PropTypes.bool
}

const CustomFields = ({
  fieldsConfig,
  formikProps,
  parentFieldName,
  invisibleFields,
  linkToComp,
  vertical
}) => {
  return (
    <>
      {Object.entries(fieldsConfig).map(([key, fieldConfig]) => {
        const fieldName = `${parentFieldName}.${key}`
        return invisibleFields.includes(fieldName) ? null : (
          <CustomField
            key={key}
            fieldConfig={fieldConfig}
            fieldName={fieldName}
            formikProps={formikProps}
            invisibleFields={invisibleFields}
            linkToComp={linkToComp}
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
  linkToComp: PropTypes.func.isRequired,
  invisibleFields: PropTypes.array,
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
  vertical,
  linkToComp,
  isCompact,
  extraColElem,
  labelColumnWidth
}) => {
  return (
    <>
      {Object.entries(fieldsConfig).map(([key, fieldConfig]) => {
        const fieldName = `${parentFieldName}.${key}`
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
            linkToComp={linkToComp}
            vertical={vertical}
            isCompact={isCompact}
            extraColElem={extraColElem}
            labelColumnWidth={labelColumnWidth}
            {...fieldProps}
            {...extraProps}
          />
        ) : (
          <FastField
            key={key}
            name={fieldName}
            isCompact={isCompact}
            component={FieldHelper.ReadonlyField}
            humanValue={<i>Missing ReadonlyFieldComponent for {type}</i>}
            extraColElem={extraColElem}
            labelColumnWidth={labelColumnWidth}
            {...fieldProps}
          />
        )
      })}
    </>
  )
}
ReadonlyCustomFields.propTypes = {
  fieldsConfig: PropTypes.object,
  parentFieldName: PropTypes.string.isRequired,
  linkToComp: PropTypes.func.isRequired,
  values: PropTypes.object.isRequired,
  vertical: PropTypes.bool,
  isCompact: PropTypes.bool,
  extraColElem: PropTypes.object,
  labelColumnWidth: PropTypes.number
}
ReadonlyCustomFields.defaultProps = {
  parentFieldName: DEFAULT_CUSTOM_FIELDS_PARENT,
  vertical: false
}

// To access ordered custom fields when showing in a page
export const mapReadonlyCustomFieldsToComps = ({
  fieldsConfig,
  parentFieldName = DEFAULT_CUSTOM_FIELDS_PARENT, // key path in the values object to get to the level of fields given by the fieldsConfig
  values,
  vertical,
  labelColumnWidth,
  isCompact
}) => {
  return Object.entries(fieldsConfig).reduce((accum, [key, fieldConfig]) => {
    let extraColElem = null
    if (fieldConfig.authorizationGroupUuids) {
      extraColElem = (
        <div>
          <Tooltip2 content={fieldConfig.tooltipText} intent={Intent.WARNING}>
            <Icon
              icon={IconNames.INFO_SIGN}
              intent={Intent.PRIMARY}
              className="sensitive-information-icon"
            />
          </Tooltip2>
        </div>
      )
    }
    const fieldName = `${parentFieldName}.${key}`
    const fieldProps = getFieldPropsFromFieldConfig(fieldConfig)
    if (fieldConfig.authorizationGroupUuids) {
      fieldProps.className = "sensitive-information"
    }
    const { type } = fieldConfig
    let extraProps = {}
    if (type === CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS) {
      extraProps = {
        fieldConfig
      }
    }
    const ReadonlyFieldComponent = READONLY_FIELD_COMPONENTS[type]
    accum[key] = ReadonlyFieldComponent ? (
      <ReadonlyFieldComponent
        key={key}
        name={fieldName}
        values={values}
        vertical={vertical}
        extraColElem={extraColElem}
        labelColumnWidth={labelColumnWidth}
        isCompact={isCompact}
        {...fieldProps}
        {...extraProps}
      />
    ) : (
      <FastField
        key={key}
        name={fieldName}
        component={FieldHelper.ReadonlyField}
        humanValue={<i>Missing ReadonlyFieldComponent for {type}</i>}
        extraColElem={extraColElem}
        labelColumnWidth={labelColumnWidth}
        isCompact={isCompact}
        {...fieldProps}
      />
    )

    return accum
  }, {})
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

// customSensitiveInformation should be changed according to formSensitiveField values
// When field is not initialized new field object should be pushed to customSensitiveInformation
export const updateCustomSensitiveInformation = (
  values,
  parentFieldName = SENSITIVE_CUSTOM_FIELDS_PARENT
) => {
  const customSensitiveInformation = []
  const sensitiveFieldValues = Object.get(values, parentFieldName) || []
  Object.keys(sensitiveFieldValues).forEach(sensitiveFieldName => {
    const existingField = values.customSensitiveInformation?.find(
      sf => sf.customFieldName === sensitiveFieldName
    )
    customSensitiveInformation.push({
      customFieldName: sensitiveFieldName,
      customFieldValue: JSON.stringify({
        [sensitiveFieldName]: sensitiveFieldValues[sensitiveFieldName]
      }),
      uuid: existingField?.uuid
    })
  })
  return customSensitiveInformation
}
