import API from "api"
import { gql } from "apollo-boost"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkToPreviewed from "components/LinkToPreviewed"
import Messages from "components/Messages"
import Model, { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import PositionTable from "components/PositionTable"
import { Field, Form, Formik } from "formik"
import { AuthorizationGroup, Position } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import POSITIONS_ICON from "resources/positions.png"
import Settings from "settings"

const GQL_CREATE_AUTHORIZATION_GROUP = gql`
  mutation($authorizationGroup: AuthorizationGroupInput!) {
    createAuthorizationGroup(authorizationGroup: $authorizationGroup) {
      uuid
    }
  }
`
const GQL_UPDATE_AUTHORIZATION_GROUP = gql`
  mutation($authorizationGroup: AuthorizationGroupInput!) {
    updateAuthorizationGroup(authorizationGroup: $authorizationGroup)
  }
`

const AuthorizationGroupForm = ({ edit, title, initialValues }) => {
  const history = useHistory()
  const [error, setError] = useState(null)
  const statusButtons = [
    {
      id: "statusActiveButton",
      value: Model.STATUS.ACTIVE,
      label: "Active"
    },
    {
      id: "statusInactiveButton",
      value: Model.STATUS.INACTIVE,
      label: "Inactive"
    }
  ]

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={AuthorizationGroup.yupSchema}
      initialValues={initialValues}
    >
      {({
        handleSubmit,
        isSubmitting,
        dirty,
        errors,
        setFieldValue,
        setFieldTouched,
        values,
        submitForm
      }) => {
        const positionsFilters = {
          allAdvisorPositions: {
            label: "All advisor positions",
            queryVars: {
              status: Model.STATUS.ACTIVE,
              type: [
                Position.TYPE.ADVISOR,
                Position.TYPE.SUPER_USER,
                Position.TYPE.ADMINISTRATOR
              ],
              matchPersonName: true
            }
          }
        }
        const action = (
          <div>
            <Button
              key="submit"
              bsStyle="primary"
              type="button"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save Authorization Group
            </Button>
          </div>
        )
        return (
          <div>
            <NavigationWarning isBlocking={dirty} />
            <Messages error={error} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <Field name="name" component={FieldHelper.InputField} />

                <Field
                  name="description"
                  component={FieldHelper.InputField}
                  componentClass="textarea"
                  maxLength={Settings.maxTextFieldLength}
                  onKeyUp={event =>
                    countCharsLeft(
                      "descriptionCharsLeft",
                      Settings.maxTextFieldLength,
                      event
                    )
                  }
                  extraColElem={
                    <>
                      <span id="descriptionCharsLeft">
                        {Settings.maxTextFieldLength -
                          initialValues.description.length}
                      </span>{" "}
                      characters remaining
                    </>
                  }
                />

                <Field
                  name="status"
                  component={FieldHelper.RadioButtonToggleGroupField}
                  buttons={statusButtons}
                  onChange={value => setFieldValue("status", value)}
                />

                <Field
                  name="positions"
                  label="Positions"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("positions", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("positions", value)
                  }}
                  widget={
                    <AdvancedMultiSelect
                      fieldName="positions"
                      placeholder="Search for a position..."
                      value={values.positions}
                      renderSelected={
                        <PositionTable
                          positions={values.positions}
                          showDelete
                          linkToComp={LinkToPreviewed}
                        />
                      }
                      overlayColumns={[
                        "Position",
                        "Organization",
                        "Current Occupant"
                      ]}
                      overlayRenderRow={PositionOverlayRow}
                      filterDefs={positionsFilters}
                      objectType={Position}
                      fields={Position.autocompleteQuery}
                      addon={POSITIONS_ICON}
                    />
                  }
                />
              </Fieldset>

              <div className="submit-buttons">
                <div>
                  <Button onClick={onCancel}>Cancel</Button>
                </div>
                <div>
                  <Button
                    id="formBottomSubmit"
                    bsStyle="primary"
                    type="button"
                    onClick={submitForm}
                    disabled={isSubmitting}
                  >
                    Save Authorization Group
                  </Button>
                </div>
              </div>
            </Form>
          </div>
        )
      }}
    </Formik>
  )

  function countCharsLeft(elemId, maxChars, event) {
    // update the number of characters left
    const charsLeftElem = document.getElementById(elemId)
    charsLeftElem.innerHTML = maxChars - event.target.value.length
  }

  function onCancel() {
    history.goBack()
  }

  function onSubmit(values, form) {
    return save(values, form)
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        setError(error)
        form.setSubmitting(false)
        jumpToTop()
      })
  }

  function onSubmitSuccess(response, values, form) {
    const operation = edit
      ? "updateAuthorizationGroup"
      : "createAuthorizationGroup"
    const authGroup = new AuthorizationGroup({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : initialValues.uuid
    })
    // reset the form to latest values
    // to avoid unsaved changes propmt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    if (!edit) {
      history.replace(AuthorizationGroup.pathForEdit(authGroup))
    }
    history.push(AuthorizationGroup.pathFor(authGroup), {
      success: "Authorization Group saved"
    })
  }

  function save(values, form) {
    const authorizationGroup = Object.without(
      new AuthorizationGroup(values),
      "notes"
    )
    authorizationGroup.positions = values.positions.map(pos => {
      const p = Object.without(
        pos,
        "customFields",
        DEFAULT_CUSTOM_FIELDS_PARENT
      )
      return p
    })
    return API.mutation(
      edit ? GQL_UPDATE_AUTHORIZATION_GROUP : GQL_CREATE_AUTHORIZATION_GROUP,
      { authorizationGroup }
    )
  }
}

AuthorizationGroupForm.propTypes = {
  initialValues: PropTypes.instanceOf(AuthorizationGroup).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool
}

AuthorizationGroupForm.defaultProps = {
  title: "",
  edit: false
}

export default AuthorizationGroupForm
