import { gql } from "@apollo/client"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import { ENTITY_TYPES } from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import AppContext from "components/AppContext"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import { MessagesWithConflict } from "components/Messages"
import Model from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import PositionTable from "components/PositionTable"
import { RelatedObjectsTableInput } from "components/RelatedObjectsTable"
import { FastField, Field, Form, Formik } from "formik"
import { AuthorizationGroup, Position } from "models"
import pluralize from "pluralize"
import React, { useContext, useState } from "react"
import { Alert, Button, FormCheck } from "react-bootstrap"
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
  mutation ($authorizationGroup: AuthorizationGroupInput!, $force: Boolean) {
    updateAuthorizationGroup(
      authorizationGroup: $authorizationGroup
      force: $force
    )
  }
`

interface AuthorizationGroupFormProps {
  initialValues: AuthorizationGroup
  title?: string
  edit?: boolean
  hasReports?: boolean
}

const AuthorizationGroupForm = ({
  edit = false,
  title = "",
  initialValues,
  hasReports
}: AuthorizationGroupFormProps) => {
  const { currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const isAdmin = currentUser?.isAdmin()
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
        resetForm,
        setSubmitting,
        submitForm
      }) => {
        const action = (
          <Button
            key="submit"
            variant="primary"
            onClick={submitForm}
            disabled={isSubmitting}
          >
            Save Community
          </Button>
        )
        return (
          <div>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <MessagesWithConflict
              error={error}
              objectType="Community"
              onCancel={onCancel}
              onConfirm={() => {
                resetForm({ values, isSubmitting: true })
                onSubmit(values, { resetForm, setSubmitting }, true)
              }}
            />
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

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.authorizationGroup.status}
                  name="status"
                  component={FieldHelper.RadioButtonToggleGroupField}
                  buttons={statusButtons}
                  onChange={value => setFieldValue("status", value)}
                />

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={
                    Settings.fields.authorizationGroup.distributionList
                  }
                  name="distributionList"
                  component={FieldHelper.SpecialField}
                  onChange={value =>
                    setFieldValue("distributionList", value?.target?.checked)
                  }
                  widget={
                    <FormCheck
                      type="checkbox"
                      className="pt-2"
                      checked={values.distributionList}
                    />
                  }
                />

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={
                    Settings.fields.authorizationGroup.forSensitiveInformation
                  }
                  name="forSensitiveInformation"
                  component={FieldHelper.SpecialField}
                  onChange={value =>
                    setFieldValue(
                      "forSensitiveInformation",
                      value?.target?.checked
                    )
                  }
                  widget={
                    <FormCheck
                      type="checkbox"
                      className="pt-2"
                      checked={values.forSensitiveInformation}
                      disabled={!isAdmin}
                    />
                  }
                >
                  {isAdmin &&
                    initialValues.forSensitiveInformation &&
                    hasReports && (
                      <Alert variant="warning">
                        CAUTION: This community is used for existing reports
                        with sensitive information; disabling this flag will NOT
                        revoke access to them!
                      </Alert>
                    )}
                </DictionaryField>

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
                          showLocation
                          showDelete={isAdmin}
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
                      disabled={!isAdmin}
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
                        setFieldValue("authorizationGroupRelatedObjects", value)
                      }
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
                    Save Community
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

  function onSubmit(values, form, force) {
    return save(values, form, force)
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
      state: { success: "Community saved" }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
  function save(values, form, force) {
    const authorizationGroup = AuthorizationGroup.filterClientSideFields(values)
    authorizationGroup.authorizationGroupRelatedObjects =
      authorizationGroup.authorizationGroupRelatedObjects.map(ro =>
        Object.without(ro, "relatedObject")
      )
    return API.mutation(
      edit ? GQL_UPDATE_AUTHORIZATION_GROUP : GQL_CREATE_AUTHORIZATION_GROUP,
      { authorizationGroup, force }
    )
  }
}

export default AuthorizationGroupForm
