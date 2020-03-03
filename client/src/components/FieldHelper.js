import LinkTo from "components/LinkTo"
import _cloneDeep from "lodash/cloneDeep"
import _get from "lodash/get"
import PropTypes from "prop-types"
import React, { useCallback, useMemo } from "react"
import {
  Button,
  Col,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
  InputGroup,
  ToggleButton,
  ToggleButtonGroup
} from "react-bootstrap"
import utils from "utils"

const getFieldId = field => field.id || field.name // name property is required

const getHumanValue = (field, humanValue) => {
  if (typeof humanValue === "function") {
    return humanValue(field.value)
  } else if (humanValue !== undefined) {
    return humanValue
  } else {
    return field.value
  }
}

const getFormGroupValidationState = (field, form) => {
  const { touched, errors } = form
  const fieldTouched = _get(touched, field.name)
  const fieldError = _get(errors, field.name)
  return (fieldTouched && (fieldError ? "error" : null)) || null
}

const getHelpBlock = (field, form) => {
  const { touched, errors } = form
  const fieldTouched = _get(touched, field.name)
  const fieldError = _get(errors, field.name)
  return fieldTouched && fieldError && <HelpBlock>{fieldError}</HelpBlock>
}

const FieldNoLabel = ({ field, form, widgetElem, children }) => {
  const id = getFieldId(field)
  const validationState = getFormGroupValidationState(field, form)
  return (
    <FormGroup controlId={id} validationState={validationState}>
      {widgetElem}
      {getHelpBlock(field, form)}
      {children}
    </FormGroup>
  )
}
FieldNoLabel.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object,
  widgetElem: PropTypes.object,
  children: PropTypes.any
}

const Field = ({
  field,
  form,
  label,
  widgetElem,
  children,
  extraColElem,
  addon,
  vertical,
  extraAddon
}) => {
  const id = getFieldId(field)
  const widget = useMemo(
    () =>
      !addon ? (
        widgetElem
      ) : (
        <InputGroup>
          {widgetElem}
          {extraAddon && <InputGroup.Addon>{extraAddon}</InputGroup.Addon>}
          <FieldAddon id={id} addon={addon} />
        </InputGroup>
      ),
    [addon, extraAddon, id, widgetElem]
  )
  const validationState = getFormGroupValidationState(field, form)
  if (label === undefined) {
    label = utils.sentenceCase(field.name) // name is a required prop of field
  }

  // setting label or extraColElem explicitly to null will completely remove these columns!
  const widgetWidth =
    12 - (label === null ? 0 : 2) - (extraColElem === null ? 0 : 3)
  // controlId prop of the FormGroup sets the id of the control element
  return (
    <FormGroup controlId={id} validationState={validationState}>
      {vertical ? (
        <>
          {label !== null && <ControlLabel>{label}</ControlLabel>}
          {widget}
          {getHelpBlock(field, form)}
          {children}
        </>
      ) : (
        <>
          {label !== null && (
            <Col sm={2} componentClass={ControlLabel}>
              {label}
            </Col>
          )}
          <Col sm={widgetWidth}>
            <div>
              {widget}
              {getHelpBlock(field, form)}
              {children}
            </div>
          </Col>
        </>
      )}
      {extraColElem && <Col sm={3} {...extraColElem.props} />}
    </FormGroup>
  )
}
Field.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object,
  label: PropTypes.string,
  widgetElem: PropTypes.object,
  children: PropTypes.any,
  extraColElem: PropTypes.object,
  addon: PropTypes.object,
  vertical: PropTypes.bool,
  extraAddon: PropTypes.object
}
Field.defaultProps = {
  vertical: false // default direction of label and input = horizontal
}

export const InputField = ({
  field, // { name, value, onChange, onBlur }
  form, // contains, touched, errors, values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  children,
  extraColElem,
  addon,
  vertical,
  extraAddon,
  ...otherProps
}) => {
  const widgetElem = useMemo(
    () => (
      <FormControl
        {...Object.without(field, "value")}
        value={
          field.value === null || field.value === undefined ? "" : field.value
        }
        {...otherProps}
      />
    ),
    [field, otherProps]
  )
  return (
    <Field
      field={field}
      form={form}
      label={label}
      widgetElem={widgetElem}
      children={children}
      extraColElem={extraColElem}
      addon={addon}
      vertical={vertical}
      extraAddon={extraAddon}
    />
  )
}
InputField.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object,
  label: PropTypes.string,
  children: PropTypes.any,
  extraColElem: PropTypes.object,
  addon: PropTypes.object,
  vertical: PropTypes.bool,
  extraAddon: PropTypes.object
}

export const InputFieldNoLabel = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  children,
  ...otherProps
}) => {
  const widgetElem = useMemo(
    () => (
      <FormControl
        {...Object.without(field, "value")}
        value={
          field.value === null || field.value === undefined ? "" : field.value
        }
        {...otherProps}
      />
    ),
    [field, otherProps]
  )
  return (
    <FieldNoLabel
      field={field}
      form={form}
      widgetElem={widgetElem}
      children={children}
    />
  )
}
InputFieldNoLabel.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object,
  children: PropTypes.any
}

export const ReadonlyField = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  children,
  extraColElem,
  addon,
  vertical,
  humanValue,
  ...otherProps
}) => {
  const widgetElem = useMemo(
    () => (
      <FormControl.Static componentClass="div" {...field} {...otherProps}>
        {getHumanValue(field, humanValue)}
      </FormControl.Static>
    ),
    [field, humanValue, otherProps]
  )
  return (
    <Field
      field={field}
      form={form}
      label={label}
      widgetElem={widgetElem}
      children={children}
      extraColElem={extraColElem}
      addon={addon}
      vertical={vertical}
    />
  )
}
ReadonlyField.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object,
  label: PropTypes.string,
  children: PropTypes.any,
  extraColElem: PropTypes.object,
  addon: PropTypes.object,
  vertical: PropTypes.bool,
  humanValue: PropTypes.any
}

export const SpecialField = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  children,
  extraColElem,
  addon,
  vertical,
  widget,
  ...otherProps
}) => {
  const widgetElem = useMemo(
    () => React.cloneElement(widget, { ...field, ...otherProps }),
    [field, otherProps, widget]
  )
  return (
    <Field
      field={field}
      form={form}
      label={label}
      widgetElem={widgetElem}
      children={children}
      extraColElem={extraColElem}
      addon={addon}
      vertical={vertical}
    />
  )
}
SpecialField.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object,
  label: PropTypes.string,
  children: PropTypes.any,
  extraColElem: PropTypes.object,
  addon: PropTypes.object,
  vertical: PropTypes.bool,
  widget: PropTypes.any
}

export const customEnumButtons = list => {
  const buttons = []
  for (const key in list) {
    if (Object.prototype.hasOwnProperty.call(list, key)) {
      buttons.push({
        id: key,
        value: key,
        label: list[key].label,
        color: list[key].color
      })
    }
  }
  return buttons
}

const ButtonToggleGroupField = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  type,
  label,
  children,
  extraColElem,
  addon,
  vertical,
  buttons,
  ...otherProps
}) => {
  const widgetElem = useMemo(
    () => (
      <ToggleButtonGroup
        type={type}
        defaultValue={field.value}
        {...field}
        {...otherProps}
      >
        {buttons.map((button, index) => {
          if (!button) {
            return null
          }
          let { label, value, color, style, ...props } = button
          if (color) {
            if (field.value === value) {
              style = { ...style, backgroundColor: color }
            }
            style = { ...style, borderColor: color, borderWidth: "2px" }
          }
          return (
            <ToggleButton {...props} key={value} value={value} style={style}>
              {label}
            </ToggleButton>
          )
        })}
      </ToggleButtonGroup>
    ),
    [buttons, field, otherProps, type]
  )
  return (
    <Field
      field={field}
      form={form}
      label={label}
      widgetElem={widgetElem}
      children={children}
      extraColElem={extraColElem}
      addon={addon}
      vertical={vertical}
    />
  )
}
ButtonToggleGroupField.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object,
  type: PropTypes.string,
  label: PropTypes.string,
  children: PropTypes.any,
  extraColElem: PropTypes.object,
  addon: PropTypes.object,
  vertical: PropTypes.bool,
  buttons: PropTypes.array
}

export const RadioButtonToggleGroupField = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  ...props
}) => (
  <ButtonToggleGroupField field={field} form={form} type="radio" {...props} />
)
RadioButtonToggleGroupField.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object
}

export const CheckboxButtonToggleGroupField = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  ...props
}) => (
  <ButtonToggleGroupField
    field={field}
    form={form}
    type="checkbox"
    {...props}
  />
)
CheckboxButtonToggleGroupField.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object
}

export default Field

export const FieldAddon = ({ fieldId, addon }) => {
  const addonComponent = useMemo(
    () =>
      // allows passing a url for an image
      typeof addon === "string" && addon.indexOf(".") !== -1 ? (
        <img src={addon} height={20} alt="" />
      ) : (
        addon
      ),
    [addon]
  )
  const focusElement = useCallback(() => {
    const element = document.getElementById(fieldId)
    if (element && element.focus) {
      element.focus()
    }
  }, [fieldId])
  return (
    <InputGroup.Addon onClick={focusElement}>{addonComponent}</InputGroup.Addon>
  )
}
FieldAddon.propTypes = {
  fieldId: PropTypes.string,
  addon: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.object
  ])
}

export function handleMultiSelectAddItem(newItem, onChange, curValue) {
  if (!newItem || !newItem.uuid) {
    return
  }
  if (!curValue.find(obj => obj.uuid === newItem.uuid)) {
    const value = _cloneDeep(curValue)
    value.push(_cloneDeep(newItem))
    onChange(value)
  }
}

export function handleMultiSelectRemoveItem(oldItem, onChange, curValue) {
  if (curValue.find(obj => obj.uuid === oldItem.uuid)) {
    const value = _cloneDeep(curValue)
    const index = value.findIndex(item => item.uuid === oldItem.uuid)
    value.splice(index, 1)
    onChange(value)
  }
}

export function handleSingleSelectAddItem(newItem, onChange, curValue) {
  if (!newItem || !newItem.uuid) {
    return
  }
  onChange(newItem)
}

export function handleSingleSelectRemoveItem(oldItem, onChange, curValue) {
  onChange(null)
}

export const FieldShortcuts = ({
  shortcuts,
  fieldName,
  objectType,
  curValue,
  onChange,
  handleAddItem,
  title
}) =>
  shortcuts &&
  shortcuts.length > 0 && (
    <div id={`${fieldName}-shortcut-list`} className="shortcut-list">
      <h5>{title}</h5>
      {shortcuts.map(shortcut => (
        <Button
          key={shortcut.uuid}
          bsStyle="link"
          onClick={() => handleAddItem(shortcut, onChange, curValue)}
        >
          Add{" "}
          <LinkTo
            modelType={objectType}
            model={shortcut}
            isLink={false}
            forShortcut
          />
        </Button>
      ))}
    </div>
  )

FieldShortcuts.propTypes = {
  shortcuts: PropTypes.arrayOf(PropTypes.shape({ uuid: PropTypes.string })),
  fieldName: PropTypes.string.isRequired,
  objectType: PropTypes.string.isRequired,
  curValue: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onChange: PropTypes.func,
  handleAddItem: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired
}
