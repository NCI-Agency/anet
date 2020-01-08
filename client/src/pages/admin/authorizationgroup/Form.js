import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
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

const AuthorizationGroupForm = props => {
  const { edit, title, ...myFormProps } = props
  const history = useHistory()
  const [error, setError] = useState(null)
  const statusButtons = [
    {
      id: "statusActiveButton",
      value: AuthorizationGroup.STATUS.ACTIVE,
      label: "Active"
    },
    {
      id: "statusInactiveButton",
      value: AuthorizationGroup.STATUS.INACTIVE,
      label: "Inactive"
    }
  ]

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={AuthorizationGroup.yupSchema}
      {...myFormProps}
    >
      {({
        handleSubmit,
        isSubmitting,
        dirty,
        errors,
        setFieldValue,
        values,
        submitForm
      }) => {
        const positionsFilters = {
          allAdvisorPositions: {
            label: "All advisor positions",
            queryVars: {
              status: Position.STATUS.ACTIVE,
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
                <Field name="name" component={FieldHelper.renderInputField} />

                <Field
                  name="description"
                  component={FieldHelper.renderInputField}
                  componentClass="textarea"
                  maxLength={Settings.maxTextFieldLength}
                  onKeyUp={event =>
                    countCharsLeft(
                      "descriptionCharsLeft",
                      Settings.maxTextFieldLength,
                      event
                    )}
                  extraColElem={
                    <>
                      <span id="descriptionCharsLeft">
                        {Settings.maxTextFieldLength -
                          props.initialValues.description.length}
                      </span>{" "}
                      characters remaining
                    </>
                  }
                />

                <Field
                  name="status"
                  component={FieldHelper.renderButtonToggleGroup}
                  buttons={statusButtons}
                  onChange={value => setFieldValue("status", value)}
                />

                <AdvancedMultiSelect
                  fieldName="positions"
                  fieldLabel="Positions"
                  placeholder="Search for a position..."
                  value={values.positions}
                  renderSelected={
                    <PositionTable positions={values.positions} showDelete />
                  }
                  overlayColumns={[
                    "Position",
                    "Organization",
                    "Current Occupant"
                  ]}
                  overlayRenderRow={PositionOverlayRow}
                  filterDefs={positionsFilters}
                  onChange={value => setFieldValue("positions", value)}
                  objectType={Position}
                  fields={Position.autocompleteQuery}
                  addon={POSITIONS_ICON}
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
    const { edit } = props
    const operation = edit
      ? "updateAuthorizationGroup"
      : "createAuthorizationGroup"
    const authGroup = new AuthorizationGroup({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : props.initialValues.uuid
    })
    // After successful submit, reset the form in order to make sure the dirty
    // prop is also reset (otherwise we would get a blocking navigation warning)
    form.resetForm()
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
    return API.mutation(
      props.edit
        ? GQL_UPDATE_AUTHORIZATION_GROUP
        : GQL_CREATE_AUTHORIZATION_GROUP,
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
