import { Icon, Intent, Tooltip } from "@blueprintjs/core"
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

interface FieldNoLabelProps {
  field?: any
  form?: any
  widgetElem?: any
  children?: React.ReactNode
}

const FieldNoLabel = ({
  field,
  form,
  widgetElem,
  children
}: FieldNoLabelProps) => {
  const id = getFieldId(field)
  return (
    <FormGroup id={`fg-${id}`} controlId={id}>
      {widgetElem}
      {getHelpBlock(field.name, form)}
      {children}
    </FormGroup>
  )
}

interface FieldProps {
  field?: any
  form?: any
  label?: string
  widgetElem?: any
  children?: React.ReactNode
  extraColElem?: any
  addon?: React.ReactNode
  vertical?: boolean
  extraAddon?: any
  isCompact?: boolean
  labelColumnWidth?: number
  className?: string
  style?: any
}

const Field = ({
  field,
  form,
  label,
  widgetElem,
  children,
  extraColElem,
  addon,
  vertical = false, // default direction of label and input = horizontal
  isCompact,
  extraAddon,
  labelColumnWidth = 2,
  className,
  style
}: FieldProps) => {
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

interface InputFieldProps {
  field?: any
  form?: any
  label?: string
  asA?: string
  inputType?: string
  children?: React.ReactNode
  extraColElem?: any
  addon?: React.ReactNode
  vertical?: boolean
  extraAddon?: any
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
}: InputFieldProps) => {
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

interface InputFieldNoLabelProps {
  field?: any
  form?: any
  children?: React.ReactNode
}

export const InputFieldNoLabel = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  children,
  ...otherProps
}: InputFieldNoLabelProps) => {
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

interface ReadonlyFieldProps {
  field?: any
  form?: any
  label?: string
  asA?: string
  children?: React.ReactNode // unused, prop is discarded
  extraColElem?: any
  addon?: React.ReactNode
  vertical?: boolean
  humanValue?: any
  isCompact?: boolean
  labelColumnWidth?: number
  tooltipText?: string
}

export const ReadonlyField = ({
  field = {}, // { name, value, onChange, onBlur }
  form = {}, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  asA, // eslint-disable-line @typescript-eslint/no-unused-vars
  children,
  extraColElem,
  labelColumnWidth,
  addon,
  vertical,
  humanValue,
  isCompact,
  tooltipText,
  ...otherProps
}: ReadonlyFieldProps) => {
  const { className, style } = otherProps
  const widgetElem = useMemo(() => {
    const value = tooltipText ? (
      <div className="d-flex align-items-center px-2 gap-2">
        <span>{getHumanValue(field, humanValue)}</span>
        <Tooltip content={tooltipText} intent={Intent.WARNING}>
          <Icon
            icon={IconNames.INFO_SIGN}
            intent={Intent.PRIMARY}
            className="sensitive-information-icon"
          />
        </Tooltip>
      </div>
    ) : (
      getHumanValue(field, humanValue)
    )
    return (
      <FormControl as="div" plaintext {...field} {...otherProps}>
        {value}
      </FormControl>
    )
  }, [field, humanValue, otherProps, tooltipText])
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

interface SpecialFieldProps {
  field?: any
  form?: any
  label?: string
  children?: React.ReactNode
  extraColElem?: any
  addon?: React.ReactNode
  vertical?: boolean
  widget?: any
  isCompact?: boolean
}

export const SpecialField = ({
  field = {}, // { name, value, onChange, onBlur }
  form = {}, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  children,
  extraColElem,
  addon,
  vertical,
  widget,
  isCompact,
  ...otherProps
}: SpecialFieldProps) => {
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

interface ButtonToggleGroupFieldProps {
  field?: any
  form?: any
  type?: string
  label?: string
  children?: React.ReactNode
  extraColElem?: any
  addon?: React.ReactNode
  vertical?: boolean
  buttons?: any[]
  disabled?: boolean
  enableClear?: boolean
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
}: ButtonToggleGroupFieldProps) => {
  const { className } = getFormGroupValidationState(
    field.name,
    form,
    otherProps?.className
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
          {buttons.map(button => {
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

interface RadioButtonToggleGroupFieldProps {
  field?: any
  form?: any
  asA?: string
  enableClear?: boolean
}

export const RadioButtonToggleGroupField = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  asA,
  enableClear,
  ...props
}: RadioButtonToggleGroupFieldProps) =>
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

interface CheckboxButtonToggleGroupFieldProps {
  field?: any
  form?: any
  asA?: string
  enableClear?: boolean
}

export const CheckboxButtonToggleGroupField = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  asA,
  enableClear,
  ...props
}: CheckboxButtonToggleGroupFieldProps) =>
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

interface SelectFieldProps {
  field?: any
  form?: any
  label?: string
  buttons: any[]
  multiple?: boolean
  onChange: (...args: unknown[]) => unknown
  className?: string
  children?: React.ReactNode
  extraColElem?: any
  addon?: React.ReactNode
  vertical?: boolean
  extraAddon?: any
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
}: SelectFieldProps) => {
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

export default Field

interface FieldAddonProps {
  fieldId?: string
  addon?: React.ReactNode
}

export const FieldAddon = ({ fieldId, addon }: FieldAddonProps) => {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
export function handleSingleSelectAddItem(newItem, onChange, curValue) {
  if (!newItem || !newItem.uuid) {
    return
  }
  onChange(newItem)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
export function handleSingleSelectRemoveItem(oldItem, onChange, curValue) {
  onChange(null)
}

interface FieldShortcutsProps {
  shortcuts?: {
    uuid?: string
  }[]
  fieldName: string
  objectType: (...args: unknown[]) => unknown
  curValue?: any | any[]
  onChange?: (...args: unknown[]) => unknown
  handleAddItem: (...args: unknown[]) => unknown
  title: string
}

export const FieldShortcuts = ({
  shortcuts,
  fieldName,
  objectType,
  curValue,
  onChange,
  handleAddItem,
  title
}: FieldShortcutsProps) => {
  const modelType = objectType.resourceName
  return (
    shortcuts &&
    shortcuts.length > 0 && (
      <div id={`${fieldName}-shortcut-list`} className="shortcut-list">
        <h5>{title}</h5>
        <ListGroup>
          {objectType.map(shortcuts, shortcut => (
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

interface PreviewFieldProps {
  label: string
  extraColForValue?: boolean
  value?: any
}

/**
 * @prop {string} label
 * @returns
 */
export const PreviewField = ({
  label,
  value,
  extraColForValue = false
}: PreviewFieldProps) => {
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
