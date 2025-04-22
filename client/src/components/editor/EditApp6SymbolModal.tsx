import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import App6Symbol, { getChoices, getFieldsList } from "components/App6Symbol"
import { Form, Formik } from "formik"
import { Organization } from "models"
import React, { useState } from "react"
import { Button, Col, Dropdown, Modal, Row } from "react-bootstrap"
import Settings from "settings"

interface EditApp6SymbolModalProps {
  values: any
  showModal?: boolean
  onHide: (...args: unknown[]) => unknown
  onSave: (...args: unknown[]) => unknown
}

const EditApp6SymbolModal = ({
  values,
  showModal,
  onHide,
  onSave
}: EditApp6SymbolModalProps) => {
  const { parentContext, parentStandardIdentity, parentSymbolSet } =
    Organization.getApp6ParentFields(values.parentOrg, {})
  const parentValues = {
    app6context: parentContext,
    app6standardIdentity: parentStandardIdentity,
    app6symbolSet: parentSymbolSet
  }

  const initialValues = Object.fromEntries(
    Object.entries(values).filter(([key]) => key.startsWith("app6"))
  )
  const [previewValues, setPreviewValues] = useState({ ...initialValues })

  const handleFieldUpdate = (
    fieldName,
    newValue,
    setFieldValue,
    currentValues
  ) => {
    if (newValue === currentValues[fieldName]) {
      return
    }
    // handle field update
    setFieldValue(fieldName, newValue)
    setPreviewValues({ ...previewValues, [fieldName]: newValue })
    // verify if all other fields have a valid value after the update
    Object.entries(currentValues).forEach(([key, value]) => {
      const choices = getChoices(key, mergeWithParentValues(currentValues))
      if (value && !Object.keys(choices).includes(value)) {
        setFieldValue(key, null)
      }
    })
    // clear specific fields
    if (fieldName === "app6symbolSet") {
      setFieldValue("app6amplifier", null)
      setFieldValue("app6entity", null)
      setFieldValue("app6entityType", null)
      setFieldValue("app6entitySubtype", null)
    }
    if (fieldName === "app6entity") {
      setFieldValue("app6entityType", null)
      setFieldValue("app6entitySubtype", null)
    }
    if (fieldName === "app6entityType") {
      setFieldValue("app6entitySubtype", null)
    }
  }

  const calculateUpdateValues = (currentValues, fieldName, value) => {
    if (value === currentValues[fieldName]) {
      return { ...currentValues }
    }
    const newValues = { ...currentValues, [fieldName]: value }
    if (fieldName === "app6symbolSet") {
      newValues.app6amplifier = null
      newValues.app6entity = null
      newValues.app6entityType = null
      newValues.app6entitySubtype = null
    }
    if (fieldName === "app6entity") {
      newValues.app6entityType = null
      newValues.app6entitySubtype = null
    }
    if (fieldName === "app6entityType") {
      newValues.app6entitySubtype = null
    }
    return newValues
  }

  const mergeWithParentValues = currentValues => {
    // replace the null values with the parent values if they are not null
    const app6SymbolValues = { ...currentValues }
    Object.entries(parentValues).forEach(([key, value]) => {
      if (value !== null && !app6SymbolValues[key]) {
        app6SymbolValues[key] = value
      }
    })
    return app6SymbolValues
  }

  const getApp6Symbol = (tempValues, size, maxHeight) => {
    const app6SymbolValues = mergeWithParentValues(tempValues)
    return (
      <App6Symbol values={app6SymbolValues} size={size} maxHeight={maxHeight} />
    )
  }

  const getFieldName = (fieldName, values) => {
    if (fieldName === "app6amplifier") {
      const amplifierLabels = {
        10: "Echelon",
        15: "Mobility",
        27: "Leader",
        30: "Towed Array",
        35: "Towed Array"
      }
      return (
        amplifierLabels[values.app6symbolSet || parentValues.app6symbolSet] ||
        null
      )
    }

    return Settings.fields.organization[fieldName].label || null
  }

  const getFieldRow = (fieldName, setFieldValue, currentValues) => {
    const fieldWidget = getFieldWidget(fieldName, setFieldValue, currentValues)
    if (!fieldWidget) {
      return null
    }
    return (
      <div key={`field-${fieldName}`} className="d-flex flex-column gap-1">
        <div style={{ fontWeight: "bold" }}>
          {getFieldName(fieldName, currentValues)}
        </div>
        {fieldWidget}
      </div>
    )
  }

  const getFieldWidget = (fieldName, setFieldValue, currentValues) => {
    const currentMergedValues = mergeWithParentValues(currentValues)
    const choices = getChoices(fieldName, currentMergedValues)
    if (Object.entries(choices).length === 0) {
      return null
    }

    const sortedChoicesKeys = Object.keys(choices).sort((a, b) =>
      a.localeCompare(b)
    )
    const dropdownOptions = sortedChoicesKeys.map(key => ({
      key,
      label: choices[key],
      values: calculateUpdateValues(currentMergedValues, fieldName, key)
    }))
    const parentValue = parentValues[fieldName]
    dropdownOptions.unshift({
      key: null,
      label: parentValue ? `${choices[parentValue]} (inherited)` : "",
      values: calculateUpdateValues(currentMergedValues, fieldName, null)
    })

    const selectedOption = currentValues[fieldName] || null
    const selectedChoice = dropdownOptions.find(
      option => option.key === selectedOption
    )?.label

    return (
      <Row>
        <Col md={11}>
          {getDropdown(
            fieldName,
            setFieldValue,
            selectedChoice,
            dropdownOptions,
            currentValues
          )}
        </Col>
        <Col md={1} className="d-flex justify-content-center">
          {selectedOption !== initialValues[fieldName] && (
            <Button
              variant="outline"
              onClick={() => {
                handleFieldUpdate(
                  fieldName,
                  initialValues[fieldName],
                  setFieldValue,
                  currentValues
                )
              }}
            >
              <Icon icon={IconNames.RESET} />
            </Button>
          )}
        </Col>
      </Row>
    )
  }

  const getDropdown = (
    fieldName,
    setFieldValue,
    selectedChoice,
    dropdownOptions,
    currentValues
  ) => {
    return (
      <Dropdown className="w-100">
        <Dropdown.Toggle
          variant="tertiary"
          id={`${fieldName}-dropdown`}
          className="d-flex align-content-space-between align-items-center w-100"
          style={{
            color: "#212529",
            fontSize: "14px",
            borderColor: "#212529"
          }}
        >
          <div
            className="d-flex align-items-center gap-2 w-100"
            style={{
              height: 40,
              overflow: "hidden",
              textAlign: "left"
            }}
          >
            <div>{getApp6Symbol(currentValues, 20, 40)}</div>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {selectedChoice}
            </div>
          </div>
        </Dropdown.Toggle>
        <Dropdown.Menu className="w-100">
          {dropdownOptions.map(({ key, label, values }) => (
            <Dropdown.Item
              key={key}
              data-key={key}
              onClick={() =>
                handleFieldUpdate(fieldName, key, setFieldValue, currentValues)}
              className="d-flex align-items-center gap-2"
              style={{
                minHeight: 40
              }}
              onMouseEnter={() => setPreviewValues({ ...values })}
              onMouseLeave={() => setPreviewValues({ ...currentValues })}
            >
              {getApp6Symbol(values, 20, 40)}
              <span
                className="text-truncate w-100"
                style={{
                  whiteSpace: "normal"
                }}
              >
                {label}
              </span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    )
  }

  const reset = (values, setFieldValue) => {
    Object.keys(values).forEach(fieldName => {
      setFieldValue(fieldName, initialValues[fieldName])
    })
    setPreviewValues({ ...initialValues })
  }

  return (
    <Modal centered show={showModal} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Edit APP-06 Symbol</Modal.Title>
      </Modal.Header>
      <Formik
        initialValues={initialValues}
        onSubmit={values => {
          onSave(values)
          onHide()
        }}
        enableReinitialize
      >
        {({ handleSubmit, setFieldValue, values }) => {
          return (
            <Form>
              <Modal.Body>
                <div
                  className="d-flex justify-content-evenly"
                  style={{ padding: 20 }}
                >
                  <div
                    className="d-flex flex-column gap-2"
                    style={{ width: "50%" }}
                  >
                    {getFieldsList().map(fieldName =>
                      getFieldRow(fieldName, setFieldValue, values)
                    )}
                  </div>
                  <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ minWidth: 200 }}
                  >
                    {getApp6Symbol(previewValues, 200, 300)}
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="tertiary"
                  onClick={() => reset(values, setFieldValue)}
                >
                  Reset
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    reset(values, setFieldValue)
                    onHide()
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                  Apply
                </Button>
              </Modal.Footer>
            </Form>
          )
        }}
      </Formik>
    </Modal>
  )
}

export default EditApp6SymbolModal
