import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import { Field, Form, Formik } from "formik"
import React from "react"
import { Button, Modal } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

const EditApp6SymbolModal = ({
  show,
  onHide,
  initialValues,
  onSave,
  parentContext,
  parentStandardIdentity,
  parentSymbolSet
}) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Edit APP6 Symbol</Modal.Title>
      </Modal.Header>
      <Formik
        initialValues={initialValues}
        onSubmit={values => {
          onSave(values)
          onHide()
        }}
        enableReinitialize
      >
        {({ handleSubmit, setFieldValue }) => (
          <Form>
            <Modal.Body>
              <Fieldset title="APP6 Symbol">
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.organization.app6context}
                  name="app6context"
                  component={FieldHelper.SelectField}
                  buttons={utils.getButtonsFromChoices(
                    Settings.fields.organization.app6context.choices
                  )}
                  onChange={value => setFieldValue("app6context", value)}
                  extraColElem={
                    parentContext && (
                      <div style={{ paddingTop: "9px" }}>
                        <em>
                          {
                            Settings.fields.organization.app6context.choices[
                              parentContext
                            ]
                          }{" "}
                          (inherited from parent)
                        </em>
                      </div>
                    )
                  }
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.organization.app6standardIdentity}
                  name="app6standardIdentity"
                  component={FieldHelper.SelectField}
                  buttons={utils.getButtonsFromChoices(
                    Settings.fields.organization.app6standardIdentity.choices
                  )}
                  onChange={value =>
                    setFieldValue("app6standardIdentity", value)}
                  extraColElem={
                    parentStandardIdentity && (
                      <div style={{ paddingTop: "9px" }}>
                        <em>
                          {
                            Settings.fields.organization.app6standardIdentity
                              .choices[parentStandardIdentity]
                          }{" "}
                          (inherited from parent)
                        </em>
                      </div>
                    )
                  }
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.organization.app6symbolSet}
                  name="app6symbolSet"
                  component={FieldHelper.SelectField}
                  buttons={utils.getButtonsFromChoices(
                    Settings.fields.organization.app6symbolSet.choices
                  )}
                  onChange={value => setFieldValue("app6symbolSet", value)}
                  extraColElem={
                    parentSymbolSet && (
                      <div style={{ paddingTop: "9px" }}>
                        <em>
                          {
                            Settings.fields.organization.app6symbolSet.choices[
                              parentSymbolSet
                            ]
                          }{" "}
                          (inherited from parent)
                        </em>
                      </div>
                    )
                  }
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.organization.app6hq}
                  name="app6hq"
                  component={FieldHelper.SelectField}
                  buttons={utils.getButtonsFromChoices(
                    Settings.fields.organization.app6hq.choices
                  )}
                  onChange={value => setFieldValue("app6hq", value)}
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.organization.app6amplifier}
                  name="app6amplifier"
                  component={FieldHelper.SelectField}
                  buttons={utils.getButtonsFromChoices(
                    Settings.fields.organization.app6amplifier.choices
                  )}
                  onChange={value => setFieldValue("app6amplifier", value)}
                />
              </Fieldset>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={onHide}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                Save
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Formik>
    </Modal>
  )
}

export default EditApp6SymbolModal
