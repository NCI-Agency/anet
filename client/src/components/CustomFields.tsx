import { Icon, Intent, Tooltip } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import MultiTypeAdvancedSelectComponent from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import CustomDateInput from "components/CustomDateInput"
import LinkAnetEntity from "components/editor/LinkAnetEntity"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import GeoLocation, { GEO_LOCATION_DISPLAY_TYPE } from "components/GeoLocation"
import LikertScale from "components/graphs/LikertScale"
import Leaflet from "components/Leaflet"
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
import { convertLatLngToMGRS, parseCoordinate } from "geoUtils"
import { JSONPath } from "jsonpath-plus"
import _cloneDeep from "lodash/cloneDeep"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import _set from "lodash/set"
import _upperFirst from "lodash/upperFirst"
import { Location } from "models"
import moment from "moment"
import React, { useEffect, useMemo } from "react"
import { Badge, Button, Col, Form, Row, Table } from "react-bootstrap"
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

interface SpecialFieldProps {
  name: string
  widget:
    | SPECIAL_WIDGET_TYPES.LIKERT_SCALE
    | SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR
  formikProps?: any
}

const SpecialField = ({
  name,
  widget,
  formikProps,
  ...otherFieldProps
}: SpecialFieldProps) => {
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

interface ReadonlySpecialFieldProps {
  name: string
  widget:
    | SPECIAL_WIDGET_TYPES.LIKERT_SCALE
    | SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR
  values?: any
  isCompact?: boolean
}

const ReadonlySpecialField = ({
  name,
  widget,
  values,
  isCompact,
  ...otherFieldProps
}: ReadonlySpecialFieldProps) => {
  if (widget === SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR) {
    const fieldValue = Object.get(values, name) || "" // name might be a path for a nested prop
    return (
      <FastField
        name={name}
        isCompact={isCompact}
        component={FieldHelper.ReadonlyField}
        humanValue={<RichTextEditor readOnly value={fieldValue} />}
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
        )}
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

interface ReadonlyJsonFieldProps {
  name: string
  label: string
  values: any
  extraColElem?: any
  labelColumnWidth?: number
  className?: string
}

const ReadonlyJsonField = ({
  name,
  label,
  values,
  extraColElem,
  labelColumnWidth,
  className
}: ReadonlyJsonFieldProps) => {
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

interface GeoLocationFieldProps {
  name: string
  editable?: boolean
}

const GeoLocationField = ({
  editable = true,
  ...fieldProps
}: GeoLocationFieldProps) => {
  const { name, label, formikProps, ...otherFieldProps } = fieldProps
  const fieldValue = Object.get(formikProps.values, name) || {}
  const coordinates = {
    lat: fieldValue?.lat,
    lng: fieldValue?.lng,
    displayedCoordinate:
      fieldValue?.displayedCoordinate ||
      convertLatLngToMGRS(fieldValue?.lat, fieldValue?.lng)
  }
  const labels = {
    [Location.LOCATION_FORMATS.LAT_LON]: `${label} (Lat/Lon)`,
    [Location.LOCATION_FORMATS.MGRS]: `${label} (MGRS)`
  }
  const marker = {}
  const leafletProps = {}
  if (editable) {
    Object.assign(marker, {
      draggable: true,
      autoPan: true,
      onMove: (event, map) =>
        updateCoordinateFields(map.wrapLatLng(event.target.getLatLng()))
    })
    Object.assign(leafletProps, {
      onMapClick: (event, map) =>
        updateCoordinateFields(map.wrapLatLng(event.latlng))
    })
  }
  if (Location.hasCoordinates(coordinates)) {
    Object.assign(marker, {
      lat: parseFloat(coordinates.lat),
      lng: parseFloat(coordinates.lng)
    })
  }
  return (
    <>
      <GeoLocation
        name={name}
        labels={labels}
        coordinates={coordinates}
        displayType={GEO_LOCATION_DISPLAY_TYPE.FORM_FIELD}
        editable={editable}
        {...formikProps}
        {...otherFieldProps}
      />
      {(editable || Location.hasCoordinates(coordinates)) && (
        <Row style={{ marginTop: "-1rem" }}>
          <Col sm={2} />
          <Col sm={7}>
            <Leaflet markers={[marker]} mapId={name} {...leafletProps} />
          </Col>
        </Row>
      )}
    </>
  )

  function updateCoordinateFields(latLng) {
    const parsedLat = parseCoordinate(latLng.lat)
    const parsedLng = parseCoordinate(latLng.lng)
    formikProps.setFieldValue(`${name}.lat`, parsedLat)
    formikProps.setFieldValue(`${name}.lng`, parsedLng)
    formikProps.setFieldValue(
      `${name}.displayedCoordinate`,
      convertLatLngToMGRS(parsedLat, parsedLng)
    )
  }
}

interface ReadonlyGeoLocationFieldProps {
  name: string
  values: any
}

const ReadonlyGeoLocationField = (
  fieldProps: ReadonlyGeoLocationFieldProps
) => {
  const { name, values, ...otherFieldProps } = fieldProps
  return (
    <GeoLocationField
      name={name}
      editable={false}
      formikProps={{ values }}
      {...otherFieldProps}
    />
  )
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
    vertical,
    children
  } = fieldProps
  const value = useMemo(
    () => getArrayObjectValue(formikProps.values, name),
    [formikProps.values, name]
  )
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

interface ArrayObjectProps {
  fieldName: string
  fieldConfig: any
  formikProps: any
  invisibleFields: any[]
  vertical?: boolean
  arrayHelpers: any
  index: number
}

const ArrayObject = ({
  fieldName,
  fieldConfig,
  formikProps,
  invisibleFields,
  vertical,
  arrayHelpers,
  index
}: ArrayObjectProps) => {
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
        vertical={vertical}
        parentFieldName={`${fieldName}.${index}`}
      />
    </Fieldset>
  )
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
          isCompact ? <>{arrayOfObjects}</> : <div>{arrayOfObjects}</div>}
      />
    </Fieldset>
  )
}

interface ReadonlyArrayObjectProps {
  fieldName: string
  fieldConfig: any
  values: any
  vertical?: boolean
  index: number
  isCompact?: boolean
  extraColElem?: any
  labelColumnWidth?: number
}

const ReadonlyArrayObject = ({
  fieldName,
  fieldConfig,
  values,
  vertical,
  index,
  isCompact,
  extraColElem,
  labelColumnWidth
}: ReadonlyArrayObjectProps) => {
  const objLabel = _upperFirst(fieldConfig.objectLabel || "item")
  return (
    <Fieldset title={`${objLabel} ${index + 1}`} isCompact={isCompact}>
      <ReadonlyCustomFields
        fieldsConfig={fieldConfig.objectFields}
        parentFieldName={`${fieldName}.${index}`}
        values={values}
        isCompact={isCompact}
        vertical={vertical}
        extraColElem={extraColElem}
        labelColumnWidth={labelColumnWidth}
      />
    </Fieldset>
  )
}

interface AnetObjectFieldProps {
  name: string
  types?: string[]
  formikProps?: any
  children?: React.ReactNode
}

const AnetObjectField = ({
  name,
  types,
  formikProps,
  children,
  ...otherFieldProps
}: AnetObjectFieldProps) => {
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
            })}
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
                <LinkAnetEntity type={fieldValue.type} uuid={fieldValue.uuid} />
              </td>
              <td className="col-1">
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

interface ReadonlyAnetObjectFieldProps {
  name: string
  label: string
  values: any
  isCompact?: boolean
  extraColElem?: any
  labelColumnWidth?: number
  className?: string
}

const ReadonlyAnetObjectField = ({
  name,
  label,
  values,
  isCompact,
  extraColElem,
  labelColumnWidth,
  className
}: ReadonlyAnetObjectFieldProps) => {
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
                  <LinkAnetEntity type={type} uuid={uuid} />
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

interface ArrayOfAnetObjectsFieldProps {
  name: string
  types?: string[]
  formikProps?: any
  children?: React.ReactNode
}

const ArrayOfAnetObjectsField = ({
  name,
  types,
  formikProps,
  children,
  ...otherFieldProps
}: ArrayOfAnetObjectsFieldProps) => {
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
                  <LinkAnetEntity type={entity.type} uuid={entity.uuid} />
                </td>
                <td className="col-1">
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

interface ReadonlyArrayOfAnetObjectsFieldProps {
  name: string
  label: string
  values: any
  isCompact?: boolean
  extraColElem?: any
  labelColumnWidth?: number
  className?: string
}

const ReadonlyArrayOfAnetObjectsField = ({
  name,
  label,
  values,
  isCompact,
  extraColElem,
  labelColumnWidth,
  className
}: ReadonlyArrayOfAnetObjectsFieldProps) => {
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
                    <LinkAnetEntity type={entity.type} uuid={entity.uuid} />
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

const FIELD_COMPONENTS = {
  [CUSTOM_FIELD_TYPE.TEXT]: TextField,
  [CUSTOM_FIELD_TYPE.NUMBER]: NumberField,
  [CUSTOM_FIELD_TYPE.DATE]: DateField,
  [CUSTOM_FIELD_TYPE.DATETIME]: DateTimeField,
  [CUSTOM_FIELD_TYPE.JSON]: JsonField,
  [CUSTOM_FIELD_TYPE.GEO_LOCATION]: GeoLocationField,
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
  if (
    anetObj[parentFieldName] &&
    !anetObj[parentFieldName][INVISIBLE_CUSTOM_FIELDS_FIELD]
  ) {
    // set initial invisible custom fields
    anetObj[parentFieldName][INVISIBLE_CUSTOM_FIELDS_FIELD] =
      getInvisibleFields(config, parentFieldName, anetObj)
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

const filterDeprecatedFields = (fieldsConfig, values, parentFieldName) => {
  const deprecatedFields = Object.entries(fieldsConfig).reduce(
    (accum, [fieldName, fieldConfig]) => {
      if (fieldConfig.deprecated) {
        const hasNoValue = isFieldValueNotSet(
          values[parentFieldName][fieldName]
        )
        hasNoValue && accum.push(fieldName)
      }
      return accum
    },
    []
  )
  const deprecatedFieldsFiltered = Object.without(
    fieldsConfig,
    ...deprecatedFields
  )
  return deprecatedFieldsFiltered
}

const isFieldValueNotSet = value => {
  return (
    value === undefined ||
    value === null ||
    Number.isNaN(value) ||
    (typeof value === "object" &&
      !(value instanceof Date) &&
      Object.keys(value).length === 0) ||
    (typeof value === "string" && value.trim().length === 0)
  )
}

interface CustomFieldsContainerProps {
  fieldsConfig?: any
  formikProps?: any
  parentFieldName?: string
  setShowCustomFields?: (...args: unknown[]) => unknown
  vertical?: boolean
}

export const CustomFieldsContainer = ({
  parentFieldName = DEFAULT_CUSTOM_FIELDS_PARENT,
  vertical = false,
  ...props
}: CustomFieldsContainerProps) => {
  const {
    formikProps: { values, setFieldValue },
    fieldsConfig,
    setShowCustomFields
  } = props
  const deprecatedFieldsFiltered = useMemo(
    () => filterDeprecatedFields(fieldsConfig, values, parentFieldName),
    [fieldsConfig, parentFieldName, values]
  )
  const invisibleFields = useMemo(
    () => getInvisibleFields(fieldsConfig, parentFieldName, values),
    [fieldsConfig, parentFieldName, values]
  )

  const invisibleFieldsFieldName = `${parentFieldName}.${INVISIBLE_CUSTOM_FIELDS_FIELD}`
  useEffect(() => {
    if (!_isEqual(_get(values, invisibleFieldsFieldName), invisibleFields)) {
      setFieldValue(invisibleFieldsFieldName, invisibleFields, false)
    }
  }, [invisibleFields, values, invisibleFieldsFieldName, setFieldValue])

  useEffect(() => {
    if (setShowCustomFields) {
      setShowCustomFields(!_isEmpty(deprecatedFieldsFiltered))
    }
  }, [setShowCustomFields, deprecatedFieldsFiltered])

  return (
    <>
      <CustomFields
        invisibleFields={invisibleFields}
        parentFieldName={parentFieldName}
        vertical={vertical}
        {...props}
        fieldsConfig={deprecatedFieldsFiltered}
      />
    </>
  )
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
    deprecated,
    ...fieldProps
  } = fieldConfig
  return fieldProps
}

interface CustomFieldProps {
  fieldConfig?: any
  fieldName: string
  formikProps?: any
  invisibleFields?: any[]
  vertical?: boolean
}

const CustomField = ({
  fieldConfig,
  fieldName,
  formikProps,
  invisibleFields,
  vertical
}: CustomFieldProps) => {
  const { type, helpText, authorizationGroupUuids, deprecated } = fieldConfig
  let extraColElem
  if (authorizationGroupUuids || deprecated) {
    extraColElem = (
      <div>
        <Tooltip content={fieldConfig.tooltipText} intent={Intent.WARNING}>
          <Icon icon={IconNames.INFO_SIGN} intent={Intent.PRIMARY} />
        </Tooltip>
      </div>
    )
  }
  const fieldProps = getFieldPropsFromFieldConfig(fieldConfig)
  const { setFieldValue, setFieldTouched, validateForm } = formikProps
  const validateFormDebounced = useDebouncedCallback(validateForm, 400) // with validateField it somehow doesn't work
  const handleChange = useMemo(
    () =>
      (value, shouldValidate = true) => {
        let val =
          value?.target?.value !== undefined ? value.target.value : value
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
      case CUSTOM_FIELD_TYPE.GEO_LOCATION:
        return {
          formikProps
        }
      case CUSTOM_FIELD_TYPE.JSON:
      case CUSTOM_FIELD_TYPE.SPECIAL_FIELD:
        return {
          fieldConfig,
          formikProps
        }
      case CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS:
        return {
          fieldConfig,
          formikProps,
          invisibleFields
        }
      case CUSTOM_FIELD_TYPE.ANET_OBJECT:
      case CUSTOM_FIELD_TYPE.ARRAY_OF_ANET_OBJECTS:
        return {
          formikProps
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
  }, [fieldConfig, fieldName, formikProps, invisibleFields, type])
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

interface CustomFieldsProps {
  fieldsConfig?: any
  formikProps?: any
  parentFieldName?: string
  invisibleFields?: any[]
  vertical?: boolean
}

const CustomFields = ({
  fieldsConfig,
  formikProps,
  parentFieldName = DEFAULT_CUSTOM_FIELDS_PARENT,
  invisibleFields,
  vertical = false
}: CustomFieldsProps) => {
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
            vertical={vertical}
          />
        )
      })}
    </>
  )
}

const READONLY_FIELD_COMPONENTS = {
  [CUSTOM_FIELD_TYPE.TEXT]: ReadonlyTextField,
  [CUSTOM_FIELD_TYPE.NUMBER]: ReadonlyTextField,
  [CUSTOM_FIELD_TYPE.DATE]: ReadonlyDateField,
  [CUSTOM_FIELD_TYPE.DATETIME]: ReadonlyDateTimeField,
  [CUSTOM_FIELD_TYPE.JSON]: ReadonlyJsonField,
  [CUSTOM_FIELD_TYPE.GEO_LOCATION]: ReadonlyGeoLocationField,
  [CUSTOM_FIELD_TYPE.ENUM]: ReadonlyEnumField,
  [CUSTOM_FIELD_TYPE.ENUMSET]: ReadonlyEnumField,
  [CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS]: ReadonlyArrayOfObjectsField,
  [CUSTOM_FIELD_TYPE.SPECIAL_FIELD]: ReadonlySpecialField,
  [CUSTOM_FIELD_TYPE.ANET_OBJECT]: ReadonlyAnetObjectField,
  [CUSTOM_FIELD_TYPE.ARRAY_OF_ANET_OBJECTS]: ReadonlyArrayOfAnetObjectsField
}

interface ReadonlyCustomFieldsProps {
  fieldsConfig?: any
  parentFieldName?: string
  values: any
  vertical?: boolean
  isCompact?: boolean
  extraColElem?: any
  labelColumnWidth?: number
  setShowCustomFields?: (...args: unknown[]) => unknown
}

export const ReadonlyCustomFields = ({
  fieldsConfig,
  parentFieldName = DEFAULT_CUSTOM_FIELDS_PARENT, // key path in the values object to get to the level of fields given by the fieldsConfig
  values,
  vertical = false,
  isCompact,
  extraColElem,
  labelColumnWidth,
  setShowCustomFields
}: ReadonlyCustomFieldsProps) => {
  const deprecatedFieldsFiltered = filterDeprecatedFields(
    fieldsConfig,
    values,
    parentFieldName
  )

  useEffect(() => {
    if (setShowCustomFields) {
      setShowCustomFields(!_isEmpty(deprecatedFieldsFiltered))
    }
  }, [setShowCustomFields, deprecatedFieldsFiltered])

  return (
    <>
      {Object.entries(deprecatedFieldsFiltered).map(([key, fieldConfig]) => {
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
          <Tooltip content={fieldConfig.tooltipText} intent={Intent.WARNING}>
            <Icon
              icon={IconNames.INFO_SIGN}
              intent={Intent.PRIMARY}
              className="sensitive-information-icon"
            />
          </Tooltip>
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
