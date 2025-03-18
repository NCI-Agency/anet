import App6Symbol from "components/App6Symbol"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import { Field, Form, Formik } from "formik"
import { Organization } from "models"
import { Button, Modal } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

const EditApp6SymbolModal = ({ values, show, onHide, onSave }) => {
  const { parentContext, parentStandardIdentity, parentSymbolSet } =
    Organization.getApp6ParentFields(values.parentOrg, values)
  const initialValues = {
    app6context: values.app6context,
    app6standardIdentity: values.app6standardIdentity,
    app6symbolSet: values.app6symbolSet,
    app6hq: values.app6hq,
    app6amplifier: values.app6amplifier
  }

  const getDefaultOption = (parentValue, choices) => {
    if (!parentValue) {
      return null
    }
    return (
      <option key="" value="" style={{ fontStyle: "italic", color: "grey" }}>
        {choices[parentValue]} (inherited)
      </option>
    )
  }

  return (
    <Modal centered show={show} onHide={onHide} size="xl">
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
          const context = values.app6context || parentContext || "0"
          const standardIdentity =
            values.app6standardIdentity || parentStandardIdentity || "1"
          const symbolSet = values.app6symbolSet || parentSymbolSet || "00"
          const hq = values.app6hq || "0"
          const amplifier = values.app6amplifier || "00"

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
                        component={FieldHelper.SelectField}
                        buttons={utils.getButtonsFromChoices(
                          Settings.fields.organization.app6context.choices
                        )}
                        onChange={value => setFieldValue("app6context", value)}
                        defaultOption={getDefaultOption(
                          parentContext,
                          Settings.fields.organization.app6context.choices
                        )}
                      />
                      <DictionaryField
                        wrappedComponent={Field}
                        dictProps={
                          Settings.fields.organization.app6standardIdentity
                        }
                        name="app6standardIdentity"
                        component={FieldHelper.SelectField}
                        buttons={utils.getButtonsFromChoices(
                          Settings.fields.organization.app6standardIdentity
                            .choices
                        )}
                        onChange={value =>
                          setFieldValue("app6standardIdentity", value)}
                        defaultOption={getDefaultOption(
                          parentStandardIdentity,
                          Settings.fields.organization.app6standardIdentity
                            .choices
                        )}
                      />
                      <DictionaryField
                        wrappedComponent={Field}
                        dictProps={Settings.fields.organization.app6symbolSet}
                        name="app6symbolSet"
                        component={FieldHelper.SelectField}
                        buttons={utils.getButtonsFromChoices(
                          Settings.fields.organization.app6symbolSet.choices
                        )}
                        onChange={value =>
                          setFieldValue("app6symbolSet", value)}
                        defaultOption={getDefaultOption(
                          parentSymbolSet,
                          Settings.fields.organization.app6symbolSet.choices
                        )}
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
                        onChange={value =>
                          setFieldValue("app6amplifier", value)}
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
                    <App6Symbol
                      context={context}
                      standardIdentity={standardIdentity}
                      symbolSet={symbolSet}
                      hq={hq}
                      amplifier={amplifier}
                      version="10"
                      status="0"
                      size={120}
                    />
                  </div>
                </div>
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
          )
        }}
      </Formik>
    </Modal>
  )
}

export default EditApp6SymbolModal
