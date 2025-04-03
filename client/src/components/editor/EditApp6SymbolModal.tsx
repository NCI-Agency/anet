import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import App6Symbol from "components/App6Symbol"
import App6Symbol2, {
  getApp6Values,
  getChoices,
  getSymbolCode
} from "components/App6Symbol2"
import { Form, Formik } from "formik"
import { Organization } from "models"
import React, { useState } from "react"
import { Button, Col, Dropdown, Modal, Row } from "react-bootstrap"

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
    Organization.getApp6ParentFields(values.parentOrg, values)
  const parentValues = {
    app6context: parentContext,
    app6standardIdentity: parentStandardIdentity,
    app6symbolSet: parentSymbolSet
  }
  const filteredValues = Object.fromEntries(
    Object.entries(values).filter(([key]) => key.startsWith("app6"))
  )
  const code = getSymbolCode(filteredValues)
  const initialValues = getApp6Values(code)

  const [previewValues, setPreviewValues] = useState(null)

  const handleFieldUpdate = (field, newValue, setFieldValue, currentValues) => {
    // handle field update
    setFieldValue(field, newValue)
    currentValues[field] = newValue
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
      setFieldValue("iconEntity", null)
      setFieldValue("iconEntityType", null)
      setFieldValue("iconEntitySubtype", null)
    }
    if (field === "iconEntity") {
      setFieldValue("iconEntityType", null)
      setFieldValue("iconEntitySubtype", null)
    }
    if (field === "iconEntityType") {
      setFieldValue("iconEntitySubtype", null)
    }
  }

  const getApp6Symbol = (size, tempValues) => {
    const code = getSymbolCode(tempValues)
    return <App6Symbol2 code={code} size={size} />
  }

  const getFieldName = (field, values) => {
    const staticLabels = {
      app6context: "Context",
      app6standardIdentity: "Standard Identity",
      app6symbolSet: "Symbol Set",
      status: "Status",
      app6hq: "Headquarters / Task Force / Dummy",
      iconEntity: "Main Icon",
      firstModifier: "First Modifier",
      secondModifier: "Second Modifier"
    }

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

    return staticLabels[field] || null
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

    return (
      <Row>
        <Col md={11}>
          {getDropdown(
            field,
            setFieldValue,
            selectedChoice,
            choices,
            currentValues
          )}
        </Col>
        <Col md={1} className="d-flex justify-content-center">
          {selectedChoice && (
            <Button
              variant="outline"
              onClick={() =>
                handleFieldUpdate(field, null, setFieldValue, currentValues)}
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
    choices,
    currentValues
  ) => {
    const sortedChoices = Object.keys(choices).sort((a, b) => {
      return a.localeCompare(b)
    })
    return (
      <Dropdown style={{ width: "100%" }}>
        <Dropdown.Toggle
          variant="tertiary"
          id={`${field}-dropdown`}
          className="d-flex align-content-space-between align-items-center"
          style={{
            width: "100%",
            color: "#212529",
            fontSize: "14px",
            borderColor: "#212529"
          }}
        >
          <div
            className="d-flex align-items-center gap-2"
            style={{
              width: "100%",
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
        <Dropdown.Menu style={{ width: "100%" }}>
          {sortedChoices.map(key => (
            <Dropdown.Item
              key={key}
              onClick={() =>
                handleFieldUpdate(field, key, setFieldValue, currentValues)}
              className="d-flex align-items-center gap-2"
              style={{
                height: 40,
                whiteSpace: "nowrap",
                textOverflow: "ellipsis"
              }}
              onMouseEnter={() =>
                setPreviewValues({ ...currentValues, [field]: key })}
              onMouseLeave={() => setPreviewValues(null)}
            >
              {getApp6Symbol(20, { ...currentValues, [field]: key })}
              <span className="text-truncate" style={{ maxWidth: "100%" }}>
                {choices[key]}
              </span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    )
  }

  const onReset = (values, setFieldValue) => {
    Object.keys(values).forEach(field => {
      setFieldValue(field, null)
    })
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
                    {getApp6Symbol(200, previewValues || values)}
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
                <Button variant="secondary" onClick={onHide}>
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
