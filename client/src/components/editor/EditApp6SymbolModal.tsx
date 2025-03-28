import App6Symbol from "components/App6Symbol"
import App6Symbol2, { getChoices } from "components/App6Symbol2"
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
    status: null
  }

  const initialValues = {
    symbolSet: null,
    affiliation: null,
    status: null
  }

  const getApp6Symbol = (size, tempValues) => {
    return (
      <App6Symbol2
        symbolSet={tempValues.symbolSet}
        affiliation={tempValues.affiliation}
        status={tempValues.status}
        size={size}
      />
    )
  }

  const getFieldWidget = (field, setFieldValue, currentValues) => {
    const choices = getChoices(field)

    const parentValue = parentValues[field]
    const selectedChoice = currentValues[field]
      ? choices?.[currentValues[field]]
      : parentValue
        ? `${choices?.[parentValue]} (inherited)`
        : ""

    return (
      <Dropdown>
        <Dropdown.Toggle
          variant="outline-tertiary"
          id={`${field}-dropdown`}
          style={{
            width: 300,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#212529",
            fontSize: "14px",
            borderColor: "#212529"
          }}
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
        <Dropdown.Menu style={{ width: 300 }}>
          {Object.entries(choices).map(([key, value]) => (
            <Dropdown.Item
              key={key}
              onClick={() => setFieldValue(field, key)}
              className="d-flex align-items-center gap-3"
              style={{ height: 40 }}
            >
              {getApp6Symbol(20, { ...currentValues, [field]: key })}
              {value}
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
                <div style={{ display: "flex" }}>
                  <div>
                    <Fieldset
                      title="APP-06 Symbol"
                      style={{ marginBottom: "1rem" }}
                    >
                      <DictionaryField
                        wrappedComponent={Field}
                        dictProps={{ label: "Symbol Set" }}
                        name="symbolSet"
                        component={FieldHelper.SpecialField}
                        widget={getFieldWidget(
                          "symbolSet",
                          setFieldValue,
                          values
                        )}
                      />
                      <DictionaryField
                        wrappedComponent={Field}
                        dictProps={{ label: "Affiliation" }}
                        name="affiliation"
                        component={FieldHelper.SpecialField}
                        widget={getFieldWidget(
                          "affiliation",
                          setFieldValue,
                          values
                        )}
                      />
                      <DictionaryField
                        wrappedComponent={Field}
                        dictProps={{ label: "Status" }}
                        name="status"
                        component={FieldHelper.SpecialField}
                        widget={getFieldWidget("status", setFieldValue, values)}
                      />
                    </Fieldset>
                  </div>
                  {/* <div
                    style={{
                      display: "flex",
                      width: "50%",
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    {getApp6Symbol(200, values)}
                  </div> */}
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
