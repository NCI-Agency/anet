import { parseHtmlWithLinkTo } from "components/editor/LinkAnet"
import LinkAnetEntity from "components/editor/LinkAnetEntity"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import {
  CUSTOM_FIELD_TYPE,
  DEFAULT_CUSTOM_FIELDS_PARENT
} from "components/Model"
import {
  getArrayObjectValue,
  getFieldPropsFromFieldConfig,
  SPECIAL_WIDGET_COMPONENTS,
  SPECIAL_WIDGET_TYPES
} from "customFieldsUtils"
import { FastField, FieldArray } from "formik"
import _isEmpty from "lodash/isEmpty"
import _upperFirst from "lodash/upperFirst"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useMemo } from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"

const ReadonlySpecialField = ({
  name,
  widget,
  values,
  linkToComp,
  ...otherFieldProps
}) => {
  if (widget === SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR) {
    const fieldValue = Object.get(values, name) || "" // name might be a path for a nested prop
    return (
      <FastField
        name={name}
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
  values: PropTypes.object,
  linkToComp: PropTypes.func.isRequired
}

const ReadonlyTextField = fieldProps => {
  const { name, label, vertical, extraColElem, labelColumnWidth } = fieldProps
  return (
    <FastField
      name={name}
      label={label}
      vertical={vertical}
      extraColElem={extraColElem}
      labelColumnWidth={labelColumnWidth}
      component={FieldHelper.ReadonlyField}
    />
  )
}

const ReadonlyDateField = fieldProps => {
  const {
    name,
    label,
    vertical,
    withTime,
    extraColElem,
    labelColumnWidth
  } = fieldProps
  return (
    <FastField
      name={name}
      label={label}
      vertical={vertical}
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
    />
  )
}

const ReadonlyDateTimeField = props => <ReadonlyDateField {...props} withTime />

const enumHumanValue = (choices, fieldVal) => {
  if (Array.isArray(fieldVal)) {
    return fieldVal && fieldVal.map(k => choices[k]?.label).join(", ")
  } else {
    return fieldVal && choices[fieldVal]?.label
  }
}

const ReadonlyJsonField = ({
  name,
  label,
  values,
  extraColElem,
  labelColumnWidth
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
    />
  )
}
ReadonlyJsonField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  values: PropTypes.object.isRequired,
  extraColElem: PropTypes.object,
  labelColumnWidth: PropTypes.number
}

const ReadonlyEnumField = fieldProps => {
  const {
    name,
    label,
    vertical,
    values,
    choices,
    extraColElem,
    labelColumnWidth
  } = fieldProps
  return (
    <FastField
      name={name}
      label={label}
      vertical={vertical}
      values={values}
      component={FieldHelper.ReadonlyField}
      humanValue={fieldVal => enumHumanValue(choices, fieldVal)}
      extraColElem={extraColElem}
      labelColumnWidth={labelColumnWidth}
    />
  )
}

const ReadonlyArrayOfObjectsField = fieldProps => {
  const {
    name,
    fieldConfig,
    values,
    vertical,
    extraColElem,
    labelColumnWidth
  } = fieldProps
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
                extraColElem={extraColElem}
                labelColumnWidth={labelColumnWidth}
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
  linkToComp,
  vertical,
  index,
  extraColElem,
  labelColumnWidth
}) => {
  const objLabel = _upperFirst(fieldConfig.objectLabel || "item")
  return (
    <Fieldset title={`${objLabel} ${index + 1}`}>
      <ReadonlyCustomFields
        fieldsConfig={fieldConfig.objectFields}
        parentFieldName={`${fieldName}.${index}`}
        values={values}
        vertical={vertical}
        extraColElem={extraColElem}
        linkToComp={linkToComp}
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
  extraColElem: PropTypes.object,
  labelColumnWidth: PropTypes.number
}

const ReadonlyAnetObjectField = ({
  name,
  label,
  values,
  extraColElem,
  linkToComp,
  labelColumnWidth
}) => {
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
    />
  )
}
ReadonlyAnetObjectField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  values: PropTypes.object.isRequired,
  linkToComp: PropTypes.func.isRequired,
  extraColElem: PropTypes.object,
  labelColumnWidth: PropTypes.number
}

const ReadonlyArrayOfAnetObjectsField = ({
  name,
  label,
  values,
  extraColElem,
  linkToComp,
  labelColumnWidth
}) => {
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
    />
  )
}
ReadonlyArrayOfAnetObjectsField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  values: PropTypes.object.isRequired,
  linkToComp: PropTypes.func.isRequired,
  extraColElem: PropTypes.object,
  labelColumnWidth: PropTypes.number
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
  extraColElem,
  labelColumnWidth,
  linkToComp
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
            vertical={vertical}
            extraColElem={extraColElem}
            linkToComp={linkToComp}
            labelColumnWidth={labelColumnWidth}
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
            extraColElem={extraColElem}
            labelColumnWidth={labelColumnWidth}
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
  vertical: PropTypes.bool,
  extraColElem: PropTypes.object,
  linkToComp: PropTypes.func,
  labelColumnWidth: PropTypes.number
}
ReadonlyCustomFields.defaultProps = {
  parentFieldName: DEFAULT_CUSTOM_FIELDS_PARENT,
  vertical: false
}

// To access ordered custom fields when showing in a page
export const mapReadonlyCustomFieldsToComps = ({
  fieldsConfig,
  parentFieldName, // key path in the values object to get to the level of fields given by the fieldsConfig
  values,
  vertical,
  extraColElem,
  labelColumnWidth,
  linkToComp
}) => {
  return Object.entries(fieldsConfig).reduce((accum, [key, fieldConfig]) => {
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
    accum[key] = ReadonlyFieldComponent ? (
      <ReadonlyFieldComponent
        key={key}
        name={fieldName}
        values={values}
        vertical={vertical}
        extraColElem={extraColElem}
        linkToComp={linkToComp}
        labelColumnWidth={labelColumnWidth}
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
        extraColElem={extraColElem}
        labelColumnWidth={labelColumnWidth}
      />
    )

    return accum
  }, {})
}
