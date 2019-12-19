import _get from "lodash/get"
import React from "react"
import {
  Col,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
  InputGroup,
  Radio,
  Table,
  ToggleButton,
  ToggleButtonGroup
} from "react-bootstrap"
import utils from "utils"
import LikertScale from "./graphs/LikertScale"

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
  let widget
  if (!addon) {
    widget = widgetElem
  } else {
    // allows passing a url for an image
    if (addon.indexOf(".") !== -1) {
      addon = <img src={addon} height={20} alt="" />
    }
    const focusElement = () => {
      const element = document.getElementById(id)
      if (element && element.focus) {
        element.focus()
      }
    }
    widget = (
      <InputGroup>
        {widgetElem}
        {extraAddon && <InputGroup.Addon>{extraAddon}</InputGroup.Addon>}
        <InputGroup.Addon onClick={focusElement}>{addon}</InputGroup.Addon>
      </InputGroup>
    )
  }
  const id = getFieldId(field)
  const validationState = getFormGroupValidationState(field, form)

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
    innerRef,
    extraAddon,
    ...otherProps
  } = props
  const widgetElem = (
    <FormControl
      {...Object.without(field, "value")}
      value={field.value === null ? "" : field.value}
      ref={innerRef}
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
    <FormControl.Static componentClass="div" {...field} {...otherProps}>
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

export const customEnumButtons = list => {
  const buttons = []
  for (const key in list) {
    if (list.hasOwnProperty(key)) {
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

const renderButtonToggleGroup = (
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  type,
  props
) => {
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

export const renderRadioButtonToggleGroup = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  ...props
}) => renderButtonToggleGroup(field, form, "radio", props)

export const renderCheckboxButtonToggleGroup = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  ...props
}) => renderButtonToggleGroup(field, form, "checkbox", props)

export const renderLikertScale = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  ...props
}) => {
  const { label, children, extraColElem, addon, vertical, buttons } = props
  const { value, ...fieldProps } = field
  const widgetElem = (
    <Table striped condensed hover responsive style={{ marginBottom: 0 }}>
      <tbody>
        <tr>
          {buttons.map((button, index) => {
            return <td key={button.value}>{button.label}</td>
          })}
        </tr>
        <tr>
          {buttons.map((button, index) => {
            return (
              <td key={button.value}>
                <Radio value={button.value} {...fieldProps} />
              </td>
            )
          })}
        </tr>
      </tbody>
    </Table>
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

export const RenderLikertScale2 = ({ field, form, ...props }) => {
  const {
    label,
    children,
    extraColElem,
    addon,
    vertical,
    trainingEvent
  } = props
  console.log(props)
  console.log(field)
  console.log(form)
  const { value, ...fieldProps } = field
  const widgetElem = <LikertScale value={trainingEvent} {...fieldProps} />
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
