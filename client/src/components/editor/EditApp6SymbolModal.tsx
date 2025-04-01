import App6Symbol from "components/App6Symbol"
import App6Symbol2, { getChoices, getSymbolCode } from "components/App6Symbol2"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import { Field, Form, Formik } from "formik"
import { Organization } from "models"
import React from "react"
import { Button, Dropdown, Modal } from "react-bootstrap"
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
  /* const { parentContext, parentStandardIdentity, parentSymbolSet } =
    Organization.getApp6ParentFields(values.parentOrg, values) */
  const parentValues = {
    symbolSet: null,
    affiliation: null,
    status: null,
    hq: null,
    echilon: null,
    mainIcon: null,
    firstModifier: null,
    secondModifier: null
  }

  const initialValues = {
    symbolSet: null,
    affiliation: null,
    status: null,
    hq: null,
    echilon: null,
    mainIcon: null,
    firstModifier: null,
    secondModifier: null
  }

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
  }

  const getApp6Symbol = (size, tempValues) => {
    const code = getSymbolCode(tempValues)
    return <App6Symbol2 code={code} size={size} />
  }

  const getFieldRow = (field, fieldName, setFieldValue, currentValues) => {
    return (
      <div className="d-flex flex-column gap-2">
        <div style={{ fontWeight: "bold" }}>{fieldName}</div>
        {getFieldWidget(field, setFieldValue, currentValues)}
      </div>
    )
  }

  const getFieldWidget = (field, setFieldValue, currentValues) => {
    const choices = getChoices(field, currentValues)

    const parentValue = parentValues[field]
    const selectedChoice = currentValues[field]
      ? choices?.[currentValues[field]]?.value ||
        choices?.[currentValues[field]]
      : parentValue
        ? `${choices?.[parentValue]} (inherited)`
        : ""

    const disabled = Object.entries(choices).length === 0
    return (
      <Dropdown>
        <Dropdown.Toggle
          variant="outline-tertiary"
          id={`${field}-dropdown`}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#212529",
            fontSize: "14px",
            borderColor: "#212529"
          }}
          disabled={disabled}
        >
          <div
            className="d-flex align-items-center gap-3"
            style={{
              width: "100%",
              height: 30,
              overflow: "hidden",
              textAlign: "left"
            }}
          >
            {!disabled && (
              <>
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
              </>
            )}
          </div>
        </Dropdown.Toggle>
        <Dropdown.Menu style={{ width: "100%" }}>
          {Object.entries(choices).map(([key, value]) => (
            <Dropdown.Item
              key={key}
              onClick={() =>
                handleFieldUpdate(field, key, setFieldValue, currentValues)}
              className="d-flex align-items-center gap-3"
              style={{ height: 40 }}
            >
              {getApp6Symbol(20, { ...currentValues, [field]: key })}
              {value?.value || value}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    )
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
                    className="d-flex flex-column gap-3"
                    style={{ width: "50%" }}
                  >
                    {getFieldRow(
                      "symbolSet",
                      "Symbol Set",
                      setFieldValue,
                      values
                    )}
                    {getFieldRow(
                      "affiliation",
                      "Affiliation",
                      setFieldValue,
                      values
                    )}
                    {getFieldRow("status", "Status", setFieldValue, values)}
                    {getFieldRow(
                      "hq",
                      "Headquarters / Task Force / Dummy",
                      setFieldValue,
                      values
                    )}
                    {getFieldRow(
                      "echelon",
                      "Echelon / Mobility / Towed Array",
                      setFieldValue,
                      values
                    )}
                    {getFieldRow(
                      "mainIcon",
                      "Main Icon",
                      setFieldValue,
                      values
                    )}
                    {getFieldRow(
                      "firstModifier",
                      "First Modifier",
                      setFieldValue,
                      values
                    )}
                    {getFieldRow(
                      "secondModifier",
                      "Second Modifier",
                      setFieldValue,
                      values
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      minWidth: 200,
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    {getApp6Symbol(200, values)}
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
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
