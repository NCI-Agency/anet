import App6Symbol from "components/App6Symbol"
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
  const { parentContext, parentStandardIdentity, parentSymbolSet } =
    Organization.getApp6ParentFields(values.parentOrg, values)
  const parentValues = {
    app6context: parentContext,
    app6standardIdentity: parentStandardIdentity,
    app6symbolSet: parentSymbolSet,
    app6hq: null,
    app6amplifier: null
  }

  const initialValues = {
    app6context: values.app6context,
    app6standardIdentity: values.app6standardIdentity,
    app6symbolSet: values.app6symbolSet,
    app6hq: values.app6hq,
    app6amplifier: values.app6amplifier
  }

  const getApp6Symbol = (size, tempValues) => {
    const symbolValues = {
      app6context: tempValues.app6context || parentContext,
      app6standardIdentity:
        tempValues.app6standardIdentity || parentStandardIdentity,
      app6symbolSet: tempValues.app6symbolSet || parentSymbolSet,
      app6hq: tempValues.app6hq,
      app6amplifier: tempValues.app6amplifier
    }
    return (
      <App6Symbol
        context={symbolValues.app6context}
        standardIdentity={symbolValues.app6standardIdentity}
        symbolSet={symbolValues.app6symbolSet}
        hq={symbolValues.app6hq}
        amplifier={symbolValues.app6amplifier}
        size={size}
      />
    )
  }

  const getFieldWidget = (field, setFieldValue, currentValues) => {
    const choicesObj = Settings.fields.organization[field]?.choices || {}
    const choices = Object.entries(choicesObj).map(([key, value]) => ({
      value: key,
      label: value
    }))

    const parentValue = parentValues[field]
    const parentChoice = choices.find(choice => choice.value === parentValue)
    const selectedChoice = currentValues[field]
      ? choicesObj[currentValues[field]]
      : parentValue
        ? `${choicesObj[parentValue]} (inherited)`
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
          {parentChoice && (
            <Dropdown.Item
              key=""
              onClick={() => setFieldValue(field, "")}
              className="d-flex align-items-center gap-3"
              style={{ height: 40 }}
            >
              {getApp6Symbol(20, { ...currentValues, [field]: "" })}
              {`${parentChoice.label} (inherited)`}
            </Dropdown.Item>
          )}
          {choices.map(choice => (
            <Dropdown.Item
              key={choice.value}
              onClick={() => setFieldValue(field, choice.value)}
              className="d-flex align-items-center gap-3"
              style={{ height: 40 }}
            >
              {getApp6Symbol(20, { ...currentValues, [field]: choice.value })}
              {choice.label}
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
                        dictProps={Settings.fields.organization.app6context}
                        name="app6context"
                        component={FieldHelper.SpecialField}
                        widget={getFieldWidget(
                          "app6context",
                          setFieldValue,
                          values
                        )}
                      />
                      <DictionaryField
                        wrappedComponent={Field}
                        dictProps={
                          Settings.fields.organization.app6standardIdentity
                        }
                        name="app6standardIdentity"
                        component={FieldHelper.SpecialField}
                        widget={getFieldWidget(
                          "app6standardIdentity",
                          setFieldValue,
                          values
                        )}
                      />
                      <DictionaryField
                        wrappedComponent={Field}
                        dictProps={Settings.fields.organization.app6symbolSet}
                        name="app6symbolSet"
                        component={FieldHelper.SpecialField}
                        widget={getFieldWidget(
                          "app6symbolSet",
                          setFieldValue,
                          values
                        )}
                      />
                      <DictionaryField
                        wrappedComponent={Field}
                        dictProps={Settings.fields.organization.app6hq}
                        name="app6hq"
                        component={FieldHelper.SpecialField}
                        widget={getFieldWidget("app6hq", setFieldValue, values)}
                      />
                      <DictionaryField
                        wrappedComponent={Field}
                        dictProps={Settings.fields.organization.app6amplifier}
                        name="app6amplifier"
                        component={FieldHelper.SpecialField}
                        widget={getFieldWidget(
                          "app6amplifier",
                          setFieldValue,
                          values
                        )}
                      />
                    </Fieldset>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: "50%",
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
