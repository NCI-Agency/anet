import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import App6Symbol, { getChoices } from "components/App6Symbol"
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

  const handleFieldUpdate = (field, newValue, setFieldValue, currentValues) => {
    if (newValue === currentValues[field]) {
      return
    }
    // handle field update
    setFieldValue(field, newValue)
    setPreviewValues({ ...previewValues, [field]: newValue })
    // verify if all other field have a valid value after the update
    Object.entries(currentValues).forEach(([key, value]) => {
      const choices = getChoices(key, currentValues)
      if (value && !Object.keys(choices).includes(value)) {
        setFieldValue(key, null)
      }
    })
    // clear specific fields
    if (field === "app6symbolSet") {
      setFieldValue("app6amplifier", null)
      setFieldValue("app6entity", null)
      setFieldValue("app6entityType", null)
      setFieldValue("app6entitySubtype", null)
    }
    if (field === "app6entity") {
      setFieldValue("app6entityType", null)
      setFieldValue("app6entitySubtype", null)
    }
    if (field === "app6entityType") {
      setFieldValue("app6entitySubtype", null)
    }
  }

  const getApp6Symbol = (size, tempValues) => {
    const app6SymbolValues = { ...tempValues }
    Object.entries(parentValues).forEach(([key, value]) => {
      if (value !== null && app6SymbolValues[key] === null) {
        app6SymbolValues[key] = value
      }
    })
    return <App6Symbol values={app6SymbolValues} size={size} />
  }

  const getFieldName = (field, values) => {
    if (field === "app6amplifier") {
      const amplifierLabels = {
        10: "Echelon",
        15: "Mobility",
        27: "Leader",
        30: "Towed Array",
        35: "Towed Array"
      }
      return amplifierLabels[values.app6symbolSet] || null
    }

    return Settings.fields.organization[field].label || null
  }

  const getFieldRow = (field, setFieldValue, currentValues) => {
    const fieldWidget = getFieldWidget(field, setFieldValue, currentValues)
    if (!fieldWidget) {
      return null
    }
    return (
      <div className="d-flex flex-column gap-1">
        <div style={{ fontWeight: "bold" }}>
          {getFieldName(field, currentValues)}
        </div>
        {fieldWidget}
      </div>
    )
  }

  const getFieldWidget = (field, setFieldValue, currentValues) => {
    const choices = getChoices(field, currentValues)
    if (Object.entries(choices).length === 0) {
      return null
    }

    const parentValue = parentValues[field]
    const selectedChoice = currentValues[field]
      ? choices?.[currentValues[field]]?.value ||
        choices?.[currentValues[field]]
      : parentValue
        ? `${choices?.[parentValue]} (inherited)`
        : ""

    const sortedChoicesKeys = Object.keys(choices).sort((a, b) =>
      a.localeCompare(b)
    )
    const dropdownOptions = sortedChoicesKeys.map(key => ({
      key,
      label: choices[key],
      values: { ...currentValues, [field]: key }
    }))
    dropdownOptions.unshift({
      key: null,
      label: parentValue ? `${choices[parentValue]} (inherited)` : "",
      values: { ...currentValues, [field]: null }
    })

    return (
      <Row>
        <Col md={11}>
          {getDropdown(
            field,
            setFieldValue,
            selectedChoice,
            dropdownOptions,
            currentValues
          )}
        </Col>
        <Col md={1} className="d-flex justify-content-center">
          {selectedChoice && (
            <Button
              variant="outline"
              onClick={() => {
                handleFieldUpdate(
                  field,
                  initialValues[field],
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
    field,
    setFieldValue,
    selectedChoice,
    dropdownOptions,
    currentValues
  ) => {
    return (
      <Dropdown className="w-100">
        <Dropdown.Toggle
          variant="tertiary"
          id={`${field}-dropdown`}
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
            <div>{getApp6Symbol(20, currentValues)}</div>
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
              onClick={() =>
                handleFieldUpdate(field, key, setFieldValue, currentValues)}
              className="d-flex align-items-center gap-2"
              style={{
                minHeight: 40
              }}
              onMouseEnter={() => setPreviewValues({ ...values })}
              onMouseLeave={() => setPreviewValues({ ...currentValues })}
            >
              {getApp6Symbol(20, values)}
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

  const onReset = (values, setFieldValue) => {
    Object.keys(values).forEach(field => {
      setFieldValue(field, initialValues[field])
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
                    {Object.keys(values).map(field =>
                      getFieldRow(field, setFieldValue, values)
                    )}
                  </div>
                  <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ minWidth: 200 }}
                  >
                    {getApp6Symbol(200, previewValues)}
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="tertiary"
                  onClick={() => onReset(values, setFieldValue)}
                >
                  Reset
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    onReset(values, setFieldValue)
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
