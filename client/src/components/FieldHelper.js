import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import classNames from "classnames"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import { CompactRow } from "components/Compact"
import LinkTo from "components/LinkTo"
import RemoveButton from "components/RemoveButton"
import _cloneDeep from "lodash/cloneDeep"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import { Task } from "models"
import PropTypes from "prop-types"
import React, { useCallback, useMemo } from "react"
import {
  Button,
  Col,
  Form,
  FormControl,
  FormGroup,
  FormSelect,
  InputGroup,
  ListGroup,
  Row,
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

export const getFormGroupValidationState = (fieldName, form, className) => {
  const { touched, errors } = form
  const fieldTouched = _get(touched, fieldName)
  const fieldError = _get(errors, fieldName)
  const validationState = fieldTouched && fieldError
  if (validationState) {
    className = classNames(className, "is-invalid")
  }
  return { validationState, fieldError, className }
}

export const getHelpBlock = (fieldName, form) => {
  const { validationState, fieldError } = getFormGroupValidationState(
    fieldName,
    form
  )
  return (
    validationState && (
      <FormControl.Feedback type="invalid">{fieldError}</FormControl.Feedback>
    )
  )
}

const FieldNoLabel = ({ field, form, widgetElem, children }) => {
  const id = getFieldId(field)
  return (
    <FormGroup id={`fg-${id}`} controlId={id}>
      {widgetElem}
      {getHelpBlock(field.name, form)}
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
  isCompact,
  extraAddon,
  labelColumnWidth,
  className,
  style
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

  if (label === undefined) {
    label = utils.sentenceCase(field.name) // name is a required prop of field
  }
  // setting label or extraColElem explicitly to null will completely remove these columns!
  const widgetWidth =
    12 -
    (label === null ? 0 : labelColumnWidth) -
    (extraColElem === null ? 0 : 3)
  // controlId prop of the FormGroup sets the id of the control element

  if (isCompact) {
    return (
      <CompactRow
        label={label}
        className={className}
        content={
          <>
            {widget}
            {getHelpBlock(field.name, form)}
            {extraColElem}
            {children}
          </>
        }
      />
    )
  }

  return (
    <FormGroup id={`fg-${id}`} controlId={id} className={className}>
      {vertical ? (
        <>
          <div>{label !== null && <Form.Label>{label}</Form.Label>}</div>
          {widget}
          {getHelpBlock(field.name, form)}
          {children}
        </>
      ) : (
        <Row style={{ marginBottom: "1rem", ...style }}>
          {label !== null && (
            <Col sm={labelColumnWidth} as={Form.Label}>
              {label}
            </Col>
          )}
          <Col sm={widgetWidth}>
            <div>
              {widget}
              {getHelpBlock(field.name, form)}
              {children}
            </div>
          </Col>
          {extraColElem && <Col sm={3} {...extraColElem.props} />}
        </Row>
      )}
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
  extraAddon: PropTypes.object,
  isCompact: PropTypes.bool,
  labelColumnWidth: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.object
}
Field.defaultProps = {
  vertical: false, // default direction of label and input = horizontal
  labelColumnWidth: 2
}

export const InputField = ({
  field, // { name, value, onChange, onBlur }
  form, // contains, touched, errors, values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  asA,
  inputType,
  children,
  extraColElem,
  addon,
  vertical,
  extraAddon,
  ...otherProps
}) => {
  const { validationState } = getFormGroupValidationState(field.name, form)
  const widgetElem = useMemo(
    () => (
      <FormControl
        type={inputType}
        {...Object.without(field, "value")}
        value={utils.isNullOrUndefined(field.value) ? "" : field.value}
        {...otherProps}
        as={asA ?? "input"}
        isInvalid={validationState}
      />
    ),
    [field, otherProps, inputType, asA, validationState]
  )
  return (
    <Field
      field={field}
      form={form}
      label={label}
      widgetElem={widgetElem}
      extraColElem={extraColElem}
      addon={addon}
      vertical={vertical}
      extraAddon={extraAddon}
    >
      {children}
    </Field>
  )
}
InputField.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object,
  label: PropTypes.string,
  asA: PropTypes.string,
  inputType: PropTypes.string,
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
  const { validationState } = getFormGroupValidationState(field.name, form)
  const widgetElem = useMemo(
    () => (
      <FormControl
        {...Object.without(field, "value")}
        value={utils.isNullOrUndefined(field.value) ? "" : field.value}
        {...otherProps}
        isInvalid={validationState}
      />
    ),
    [field, otherProps, validationState]
  )
  return (
    <FieldNoLabel field={field} form={form} widgetElem={widgetElem}>
      {children}
    </FieldNoLabel>
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
  asA,
  children,
  extraColElem,
  labelColumnWidth,
  addon,
  vertical,
  humanValue,
  isCompact,
  ...otherProps
}) => {
  const { className, style } = otherProps
  const widgetElem = useMemo(
    () => (
      <FormControl as="div" plaintext {...field} {...otherProps}>
        {getHumanValue(field, humanValue)}
      </FormControl>
    ),
    [field, humanValue, otherProps]
  )
  return (
    <Field
      field={field}
      form={form}
      label={label}
      widgetElem={widgetElem}
      extraColElem={extraColElem}
      labelColumnWidth={labelColumnWidth}
      addon={addon}
      vertical={vertical}
      isCompact={isCompact}
      className={className}
      style={style}
    >
      {children}
    </Field>
  )
}
ReadonlyField.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object,
  label: PropTypes.string,
  asA: PropTypes.string, // unused, prop is discarded
  children: PropTypes.any,
  extraColElem: PropTypes.object,
  addon: PropTypes.object,
  vertical: PropTypes.bool,
  humanValue: PropTypes.any,
  isCompact: PropTypes.bool,
  labelColumnWidth: PropTypes.number
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
  isCompact,
  ...otherProps
}) => {
  const { className } = getFormGroupValidationState(
    field.name,
    form,
    widget.props?.className
  )
  const widgetElem = useMemo(
    () => React.cloneElement(widget, { ...field, ...otherProps, className }),
    [className, field, otherProps, widget]
  )
  return (
    <Field
      field={field}
      form={form}
      label={label}
      widgetElem={widgetElem}
      extraColElem={extraColElem}
      addon={addon}
      vertical={vertical}
      isCompact={isCompact}
    >
      {children}
    </Field>
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
  widget: PropTypes.any,
  isCompact: PropTypes.bool
}

export const customEnumButtons = list => {
  const buttons = []
  for (const key in list) {
    if (Object.prototype.hasOwnProperty.call(list, key)) {
      buttons.push({
        id: list[key].label,
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
  disabled,
  enableClear,
  ...otherProps
}) => {
  const { className } = getFormGroupValidationState(
    field.name,
    form,
    classNames(otherProps?.className, "flex-wrap")
  )
  const widgetElem = useMemo(
    () => (
      <>
        <ToggleButtonGroup
          type={type}
          defaultValue={field.value}
          {...field}
          // null out onBlur to prevent errors like: "Formik called `handleBlur`,
          // but you forgot to pass an `id` or `name` attribute to your input"
          onBlur={null}
          {...otherProps}
          className={className}
        >
          {buttons.map((button, index) => {
            if (!button) {
              return null
            }
            let {
              label,
              value,
              color,
              style,
              title,
              disabled: buttonDisabled,
              ...props
            } = button
            const textColor = utils.getContrastYIQ(color)
            if (color) {
              if (
                field.value === value ||
                (Array.isArray(field.value) && field.value.includes(value))
              ) {
                style = { ...style, backgroundColor: color, color: textColor }
              }
              style = {
                ...style,
                borderColor: color,
                borderWidth: "2px"
              }
            }
            if (buttonDisabled) {
              style = {
                ...style,
                pointerEvents: "none"
              }
            }
            const key = `${field.name}_${value}`
            const toggleButton = (
              <ToggleButton
                disabled={disabled || buttonDisabled}
                title={title}
                {...props}
                id={key}
                key={key}
                className={
                  color
                    ? textColor === "black"
                      ? "light-colored-toggle-button"
                      : "dark-colored-toggle-button"
                    : ""
                }
                value={value}
                style={style}
                variant="outline-secondary"
              >
                {label}
              </ToggleButton>
            )
            return buttonDisabled ? (
              <span id={`${key}_tooltip`} key={`${key}_tooltip`} title={title}>
                {toggleButton}
              </span>
            ) : (
              toggleButton
            )
          })}
        </ToggleButtonGroup>
        {!_isEmpty(buttons) && enableClear && (
          <RemoveButton
            title="Clear choice"
            onClick={() => form.setFieldValue(field.name, null, true)}
          />
        )}
      </>
    ),
    [buttons, field, form, disabled, enableClear, otherProps, type, className]
  )
  return (
    <Field
      field={field}
      form={form}
      label={label}
      widgetElem={widgetElem}
      extraColElem={extraColElem}
      addon={addon}
      vertical={vertical}
    >
      {children}
    </Field>
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
  buttons: PropTypes.array,
  disabled: PropTypes.bool,
  enableClear: PropTypes.bool
}

export const RadioButtonToggleGroupField = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  asA,
  enableClear,
  ...props
}) =>
  (asA === "select" && (
    <SelectField field={field} form={form} {...props} />
  )) || (
    <ButtonToggleGroupField
      field={field}
      form={form}
      type="radio"
      enableClear={enableClear}
      {...props}
    />
  )
RadioButtonToggleGroupField.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object,
  asA: PropTypes.string,
  enableClear: PropTypes.bool
}

export const CheckboxButtonToggleGroupField = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  asA,
  enableClear,
  ...props
}) =>
  (asA === "select" && (
    <SelectField field={field} form={form} multiple {...props} />
  )) || (
    <ButtonToggleGroupField
      field={field}
      form={form}
      type="checkbox"
      enableClear={enableClear}
      {...props}
    />
  )
CheckboxButtonToggleGroupField.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object,
  asA: PropTypes.string,
  enableClear: PropTypes.bool
}

export const SelectField = ({
  field, // { name, value, onChange, onBlur }
  form, // contains, touched, errors, values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  buttons,
  multiple,
  onChange,
  className,
  children,
  extraColElem,
  addon,
  vertical,
  extraAddon,
  ...otherProps
}) => {
  const { validationState, className: updatedClassName } =
    getFormGroupValidationState(field.name, form, className)
  const widgetElem = useMemo(
    () => (
      <FormSelect
        {...field}
        value={field.value ?? ""}
        multiple={multiple}
        isInvalid={validationState}
        className={updatedClassName}
        onChange={e => {
          let newValue
          if (!multiple) {
            // First (empty) option must be the empty string (""); replace with null when selected
            newValue = e.target.value || null
          } else {
            newValue = []
            for (const opt of e.target.options) {
              if (opt.selected) {
                newValue.push(opt.value)
              }
            }
          }
          onChange(newValue)
        }}
        {...otherProps}
      >
        {!multiple && <option />}
        {buttons.map(option => (
          <option key={`${field.name}_${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </FormSelect>
    ),
    [
      field,
      updatedClassName,
      otherProps,
      buttons,
      multiple,
      onChange,
      validationState
    ]
  )
  return (
    <Field
      field={field}
      form={form}
      label={label}
      widgetElem={widgetElem}
      extraColElem={extraColElem}
      addon={addon}
      vertical={vertical}
      extraAddon={extraAddon}
    >
      {children}
    </Field>
  )
}
SelectField.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object,
  label: PropTypes.string,
  buttons: PropTypes.array.isRequired,
  multiple: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.any,
  extraColElem: PropTypes.object,
  addon: PropTypes.object,
  vertical: PropTypes.bool,
  extraAddon: PropTypes.object
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
  return <InputGroup onClick={focusElement}>{addonComponent}</InputGroup>
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
}) => {
  const modelType = objectType.resourceName
  return (
    shortcuts &&
    shortcuts.length > 0 && (
      <div id={`${fieldName}-shortcut-list`} className="shortcut-list">
        <h5>{title}</h5>
        <ListGroup>
          {objectType.map(shortcuts, (shortcut, idx) => (
            <ListGroup.Item key={shortcut.uuid}>
              <Button
                onClick={() => handleAddItem(shortcut, onChange, curValue)}
                variant="secondary"
                size="sm"
              >
                <Icon icon={IconNames.DOUBLE_CHEVRON_LEFT} />
              </Button>
              {modelType === Task.resourceName ? (
                <BreadcrumbTrail
                  modelType={modelType}
                  leaf={shortcut}
                  ascendantObjects={shortcut.ascendantTasks}
                  parentField="parentTask"
                  isLink={false}
                />
              ) : (
                <LinkTo modelType={modelType} model={shortcut} isLink={false} />
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>
    )
  )
}

FieldShortcuts.propTypes = {
  shortcuts: PropTypes.arrayOf(PropTypes.shape({ uuid: PropTypes.string })),
  fieldName: PropTypes.string.isRequired,
  objectType: PropTypes.func.isRequired,
  curValue: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onChange: PropTypes.func,
  handleAddItem: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired
}

/**
 * @prop {string} label
 * @returns
 */
export const PreviewField = ({ label, value, extraColForValue }) => {
  if (extraColForValue) {
    return (
      <>
        <Row>
          <Col xs={3}>
            <div className="preview-field-label">{label}</div>
          </Col>
          <Col>
            <div className="preview-field-value">{value}</div>
          </Col>
        </Row>
      </>
    )
  } else {
    return (
      <>
        <div className="preview-field-label">{label}</div>
        <div className="preview-field-value">{value}</div>
      </>
    )
  }
}
PreviewField.propTypes = {
  label: PropTypes.string.isRequired,
  extraColForValue: PropTypes.bool,
  value: PropTypes.any
}
PreviewField.defaultProps = {
  extraColForValue: false
}
