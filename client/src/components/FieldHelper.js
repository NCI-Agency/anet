import LinkTo from "components/LinkTo"
import _cloneDeep from "lodash/cloneDeep"
import _get from "lodash/get"
import PropTypes from "prop-types"
import React from "react"
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

const renderFieldNoLabel = (field, form, widgetElem, children) => {
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

const renderField = (
  field,
  label,
  form,
  widgetElem,
  children,
  extraColElem,
  addon,
  vertical,
  extraAddon
) => {
  if (label === undefined) {
    label = utils.sentenceCase(field.name) // name is a required prop of field
  }
  vertical = vertical || false // default direction of label and input = vertical
  const id = getFieldId(field)
  let widget
  if (!addon) {
    widget = widgetElem
  } else {
    widget = (
      <InputGroup>
        {widgetElem}
        {extraAddon && <InputGroup.Addon>{extraAddon}</InputGroup.Addon>}
        <FieldAddon id={id} addon={addon} />
      </InputGroup>
    )
  }
  const validationState = getFormGroupValidationState(field, form)

  // setting label or extraColElem explicitly to null will completely remove these columns!
  const widgetWidth =
    12 - (label === null ? 0 : 2) - (extraColElem === null ? 0 : 3)
  // controlId prop of the FormGroup sets the id of the control element
  return (
    <FormGroup controlId={id} validationState={validationState}>
      {vertical ? (
        <React.Fragment>
          {label !== null && <ControlLabel>{label}</ControlLabel>}
          {widget}
          {getHelpBlock(field, form)}
          {children}
        </React.Fragment>
      ) : (
        <React.Fragment>
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
        </React.Fragment>
      )}
      {extraColElem && <Col sm={3} {...extraColElem.props} />}
    </FormGroup>
  )
}

export const renderInputField = ({
  field, // { name, value, onChange, onBlur }
  form, // contains, touched, errors, values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  ...props
}) => {
  const {
    label,
    children,
    extraColElem,
    addon,
    vertical,
    extraAddon,
    ...otherProps
  } = props
  const widgetElem = (
    <FormControl
      {...Object.without(field, "value")}
      value={field.value === null ? "" : field.value}
      {...otherProps}
    />
  )
  return renderField(
    field,
    label,
    form,
    widgetElem,
    children,
    extraColElem,
    addon,
    vertical,
    extraAddon
  )
}

export const renderInputFieldNoLabel = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  ...props
}) => {
  const { children, ...otherProps } = props
  const widgetElem = (
    <FormControl
      {...Object.without(field, "value")}
      value={field.value === null ? "" : field.value}
      {...otherProps}
    />
  )
  return renderFieldNoLabel(field, form, widgetElem, children)
}

export const renderReadonlyField = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  ...props
}) => {
  const {
    label,
    children,
    extraColElem,
    addon,
    vertical,
    humanValue,
    ...otherProps
  } = props
  const widgetElem = (
    <FormControl.Static componentClass={"div"} {...field} {...otherProps}>
      {getHumanValue(field, humanValue)}
    </FormControl.Static>
  )
  return renderField(
    field,
    label,
    form,
    widgetElem,
    children,
    extraColElem,
    addon,
    vertical
  )
}

export const renderSpecialField = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  ...props
}) => {
  const {
    label,
    children,
    extraColElem,
    addon,
    vertical,
    widget,
    ...otherProps
  } = props
  const widgetElem = React.cloneElement(widget, { ...field, ...otherProps })
  return renderField(
    field,
    label,
    form,
    widgetElem,
    children,
    extraColElem,
    addon,
    vertical
  )
}

export const renderButtonToggleGroup = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  ...props
}) => {
  const {
    label,
    children,
    extraColElem,
    addon,
    vertical,
    buttons,
    ...otherProps
  } = props
  const widgetElem = (
    <ToggleButtonGroup
      type="radio"
      defaultValue={field.value}
      {...field}
      {...otherProps}
    >
      {buttons.map((button, index) => {
        if (!button) {
          return null
        }
        let { label, color, style, ...props } = button
        if (color) {
          if (field.value === button.value) {
            style = { ...style, backgroundColor: color }
          }
          style = { ...style, borderColor: color, borderWidth: "2px" }
        }
        return (
          <ToggleButton
            {...props}
            key={button.value}
            value={button.value}
            style={style}
          >
            {label}
          </ToggleButton>
        )
      })}
    </ToggleButtonGroup>
  )
  return renderField(
    field,
    label,
    form,
    widgetElem,
    children,
    extraColElem,
    addon,
    vertical
  )
}

export default renderField

export const FieldAddon = ({ fieldId, addon }) => {
  // allows passing a url for an image
  if (addon.indexOf(".") !== -1) {
    addon = <img src={addon} height={20} alt="" />
  }
  const focusElement = () => {
    const element = document.getElementById(fieldId)
    if (element && element.focus) {
      element.focus()
    }
  }
  return <InputGroup.Addon onClick={focusElement}>{addon}</InputGroup.Addon>
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
    value.push(newItem)
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

export const FieldShortcuts = props => {
  const {
    shortcuts,
    fieldName,
    objectType,
    curValue,
    onChange,
    handleAddItem,
    title
  } = props
  return (
    shortcuts &&
    shortcuts.length > 0 && (
      <div id={`${fieldName}-shortcut-list`} className="shortcut-list">
        <h5>{title}</h5>
        {shortcuts.map(shortcut => {
          const shortcutLinkProps = {
            [objectType.getModelNameLinkTo]: shortcut,
            isLink: false,
            forShortcut: true
          }
          return (
            <Button
              key={shortcut.uuid}
              bsStyle="link"
              onClick={() => handleAddItem(shortcut, onChange, curValue)}
            >
              Add <LinkTo {...shortcutLinkProps} />
            </Button>
          )
        })}
      </div>
    )
  )
}
