import { gql } from "@apollo/client"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import { ENTITY_TYPES } from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import AppContext from "components/AppContext"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import Model from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import PositionTable from "components/PositionTable"
import { RelatedObjectsTableInput } from "components/RelatedObjectsTable"
import { FastField, Field, Form, Formik } from "formik"
import { AuthorizationGroup, Position } from "models"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import { Button } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import POSITIONS_ICON from "resources/positions.png"
import Settings from "settings"

const GQL_CREATE_AUTHORIZATION_GROUP = gql`
  mutation ($authorizationGroup: AuthorizationGroupInput!) {
    createAuthorizationGroup(authorizationGroup: $authorizationGroup) {
      uuid
    }
  }
`
const GQL_UPDATE_AUTHORIZATION_GROUP = gql`
  mutation ($authorizationGroup: AuthorizationGroupInput!) {
    updateAuthorizationGroup(authorizationGroup: $authorizationGroup)
  }
`

const AuthorizationGroupForm = ({ edit, title, initialValues }) => {
  const { currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const positionsFilters = {
    allSuperusers: {
      label: "All superusers",
      queryVars: {
        status: Model.STATUS.ACTIVE,
        type: [Position.TYPE.SUPERUSER],
        matchPersonName: true
      }
    }
  }
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
        isSubmitting,
        dirty,
        setFieldValue,
        setFieldTouched,
        values,
        submitForm
      }) => {
        const action = (
          <Button
            key="submit"
            variant="primary"
            onClick={submitForm}
            disabled={isSubmitting}
          >
            Save Authorization Group
          </Button>
        )
        return (
          <div>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <Messages error={error} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.authorizationGroup.name}
                  name="name"
                  component={FieldHelper.InputField}
                />

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.authorizationGroup.description}
                  name="description"
                  component={FieldHelper.InputField}
                  asA="textarea"
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
                          initialValues.description.length}
                      </span>{" "}
                      characters remaining
                    </>
                  }
                />

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.authorizationGroup.status}
                  name="status"
                  component={FieldHelper.RadioButtonToggleGroupField}
                  buttons={statusButtons}
                  onChange={value => setFieldValue("status", value)}
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={
                    Settings.fields.authorizationGroup.administrativePositions
                  }
                  name="administrativePositions"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    value = value.map(position =>
                      Position.filterClientSideFields(position)
                    )
                    setFieldTouched("administrativePositions", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("administrativePositions", value)
                  }}
                  widget={
                    <AdvancedMultiSelect
                      fieldName="administrativePositions"
                      value={values.administrativePositions}
                      renderSelected={
                        <PositionTable
                          positions={values.administrativePositions}
                          showDelete={currentUser?.isAdmin()}
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
                      disabled={!currentUser?.isAdmin()}
                    />
                  }
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={
                    Settings.fields.authorizationGroup
                      .authorizationGroupRelatedObjects
                  }
                  name="authorizationGroupRelatedObjects"
                  component={FieldHelper.SpecialField}
                  widget={
                    <RelatedObjectsTableInput
                      title={pluralize.singular(
                        Settings.fields.authorizationGroup
                          .authorizationGroupRelatedObjects?.label
                      )}
                      relatedObjects={values.authorizationGroupRelatedObjects}
                      objectType={ENTITY_TYPES.POSITIONS}
                      entityTypes={[
                        ENTITY_TYPES.POSITIONS,
                        ENTITY_TYPES.ORGANIZATIONS,
                        ENTITY_TYPES.PEOPLE
                      ]}
                      setRelatedObjects={value =>
                        setFieldValue("authorizationGroupRelatedObjects", value)}
                      showDelete
                    />
                  }
                />
              </Fieldset>

              <div className="submit-buttons">
                <div>
                  <Button onClick={onCancel} variant="outline-secondary">
                    Cancel
                  </Button>
                </div>
                <div>
                  <Button
                    id="formBottomSubmit"
                    variant="primary"
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
    navigate(-1)
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
    // to avoid unsaved changes prompt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    if (!edit) {
      navigate(AuthorizationGroup.pathForEdit(authGroup), { replace: true })
    }
    navigate(AuthorizationGroup.pathFor(authGroup), {
      state: { success: "Authorization Group saved" }
    })
  }

  function save(values, form) {
    const authorizationGroup = AuthorizationGroup.filterClientSideFields(values)
    authorizationGroup.authorizationGroupRelatedObjects =
      authorizationGroup.authorizationGroupRelatedObjects.map(ro =>
        Object.without(ro, "relatedObject")
      )
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
