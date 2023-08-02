import { gql } from "@apollo/client"
import { Icon, IconSize, Intent } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import {
  LocationOverlayRow,
  OrganizationOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import {
  CustomFieldsContainer,
  customFieldsJSONString
} from "components/CustomFields"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import SimilarObjectsModal from "components/SimilarObjectsModal"
import { FastField, Field, Form, Formik } from "formik"
import DictionaryField from "HOC/DictionaryField"
import { Location, Organization, Position } from "models"
import { PositionRole } from "models/Position"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import { Button, Form as FormBS } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import LOCATIONS_ICON from "resources/locations.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import { RECURSE_STRATEGY } from "searchUtils"
import Settings from "settings"
import utils from "utils"

const GQL_CREATE_POSITION = gql`
  mutation ($position: PositionInput!) {
    createPosition(position: $position) {
      uuid
    }
  }
`
const GQL_UPDATE_POSITION = gql`
  mutation ($position: PositionInput!) {
    updatePosition(position: $position)
  }
`
const MIN_CHARS_FOR_DUPLICATES = 3

const PositionForm = ({ edit, title, initialValues, notesComponent }) => {
  const { currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [showSimilarPositions, setShowSimilarPositions] = useState(false)
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
  const typeButtons = [
    {
      id: "typeAdvisorButton",
      value: Position.TYPE.ADVISOR,
      label: Settings.fields.advisor.position.name
    },
    {
      id: "typePrincipalButton",
      value: Position.TYPE.PRINCIPAL,
      label: Settings.fields.principal.position.name
    }
  ]
  const nonAdminPermissionsButtons = [
    {
      id: "permsAdvisorButton",
      value: Position.TYPE.ADVISOR,
      label: Settings.fields.advisor.position.type
    }
  ]
  const adminPermissionsButtons = nonAdminPermissionsButtons.concat([
    {
      id: "permsSuperuserButton",
      value: Position.TYPE.SUPERUSER,
      label: Settings.fields.superuser.position.type
    },
    {
      id: "permsAdminButton",
      value: Position.TYPE.ADMINISTRATOR,
      label: Settings.fields.administrator.position.type
    }
  ])
  const nonAdminRolesButtons = [
    {
      id: "roleMemberButton",
      value: PositionRole.MEMBER.toString(),
      label: PositionRole.MEMBER.humanNameOfRole()
    }
  ]
  const adminRolesButtons = nonAdminRolesButtons.concat([
    {
      id: "roleDeputyButton",
      value: PositionRole.DEPUTY.toString(),
      label: PositionRole.DEPUTY.humanNameOfRole()
    },
    {
      id: "roleLeaderButton",
      value: PositionRole.LEADER.toString(),
      label: PositionRole.LEADER.humanNameOfRole()
    }
  ])

  const CodeFieldWithLabel = DictionaryField(Field)

  // For advisor types of positions, add permissions property.
  // The permissions property allows selecting a
  // specific advisor type and is removed in the onSubmit method.
  if (
    [
      Position.TYPE.ADVISOR,
      Position.TYPE.SUPERUSER,
      Position.TYPE.ADMINISTRATOR
    ].includes(initialValues.type)
  ) {
    initialValues.permissions = initialValues.type
  }

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={Position.yupSchema}
      initialValues={initialValues}
    >
      {({
        isSubmitting,
        dirty,
        setFieldValue,
        setFieldTouched,
        values,
        validateForm,
        submitForm
      }) => {
        const isPrincipal = values.type === Position.TYPE.PRINCIPAL
        const positionSettings = isPrincipal
          ? Settings.fields.principal.position
          : Settings.fields.advisor.position

        const isAdmin = currentUser && currentUser.isAdmin()
        const permissionsButtons = isAdmin
          ? adminPermissionsButtons
          : nonAdminPermissionsButtons
        const administratingOrgUuids =
          currentUser.position.organizationsAdministrated.map(org => org.uuid)
        const isSuperuser =
          currentUser && currentUser.isSuperuser() && !currentUser.isAdmin()
        // Only admin and superuser can assign high role (other than member role) to a position
        const positionRoleButtons =
          isAdmin || isSuperuser ? adminRolesButtons : nonAdminRolesButtons
        const orgSearchQuery = { status: Model.STATUS.ACTIVE }
        orgSearchQuery.type = isPrincipal
          ? Organization.TYPE.PRINCIPAL_ORG
          : Organization.TYPE.ADVISOR_ORG
        if (isSuperuser) {
          orgSearchQuery.parentOrgUuid = [...administratingOrgUuids]
          orgSearchQuery.orgRecurseStrategy = RECURSE_STRATEGY.CHILDREN
        }
        // Reset the organization property when changing the organization type
        if (
          values.organization &&
          values.organization.type &&
          values.organization.type !== orgSearchQuery.type
        ) {
          setFieldValue("organization", null)
        }
        const willAutoKickPerson =
          values.status === Model.STATUS.INACTIVE &&
          values.person &&
          values.person.uuid
        const action = (
          <div>
            <Button
              key="submit"
              variant="primary"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save Position
            </Button>
            {notesComponent}
          </div>
        )
        const organizationFilters = {
          allOrganizations: {
            label: "All organizations",
            queryVars: {}
          }
        }

        return (
          <div>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <Messages error={error} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                {edit ? (
                  <FastField
                    name="type"
                    component={FieldHelper.ReadonlyField}
                    humanValue={Position.humanNameOfType}
                  />
                ) : (
                  <FastField
                    name="type"
                    component={FieldHelper.RadioButtonToggleGroupField}
                    buttons={typeButtons}
                    onChange={value => setFieldValue("type", value)}
                  />
                )}

                <FastField
                  name="status"
                  component={FieldHelper.RadioButtonToggleGroupField}
                  buttons={statusButtons}
                  onChange={value => setFieldValue("status", value)}
                >
                  {willAutoKickPerson && (
                    <FormBS.Text>
                      <span className="text-danger">
                        Setting this position to inactive will automatically
                        remove{" "}
                        <LinkTo modelType="Person" model={values.person} /> from
                        this position.
                      </span>
                    </FormBS.Text>
                  )}
                </FastField>

                <Field
                  name="organization"
                  label="Organization"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("organization", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("organization", value)
                  }}
                  widget={
                    <AdvancedSingleSelect
                      fieldName="organization"
                      placeholder="Search the organization for this position..."
                      value={values.organization}
                      overlayColumns={["Name"]}
                      overlayRenderRow={OrganizationOverlayRow}
                      filterDefs={organizationFilters}
                      objectType={Organization}
                      fields={Organization.autocompleteQuery}
                      queryParams={orgSearchQuery}
                      valueKey="shortName"
                      addon={ORGANIZATIONS_ICON}
                    />
                  }
                />

                <CodeFieldWithLabel
                  dictProps={positionSettings.code}
                  name="code"
                  component={FieldHelper.InputField}
                />

                <Field
                  name="name"
                  component={FieldHelper.InputField}
                  label={Settings.fields.position.name}
                  placeholder="Name/Description of Position"
                  extraColElem={
                    !edit && values.name.length >= MIN_CHARS_FOR_DUPLICATES ? (
                      <>
                        <Button
                          onClick={() => setShowSimilarPositions(true)}
                          variant="outline-secondary"
                        >
                          <Icon
                            icon={IconNames.WARNING_SIGN}
                            intent={Intent.WARNING}
                            size={IconSize.STANDARD}
                            style={{ margin: "0 6px" }}
                          />
                          Possible Duplicates
                        </Button>
                      </>
                    ) : undefined
                  }
                />

                {!isPrincipal && (
                  <FastField
                    name="permissions"
                    component={FieldHelper.RadioButtonToggleGroupField}
                    buttons={permissionsButtons}
                    onChange={value => setFieldValue("permissions", value)}
                  />
                )}

                <FastField
                  name="role"
                  label={Settings.fields.position.role.label}
                  component={FieldHelper.RadioButtonToggleGroupField}
                  buttons={positionRoleButtons}
                  onChange={value => setFieldValue("role", value)}
                />
              </Fieldset>

              <Fieldset title="Additional information">
                <Field
                  name="location"
                  label="Location"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("location", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("location", value)
                  }}
                  widget={
                    <AdvancedSingleSelect
                      fieldName="location"
                      placeholder="Search for the location where this Position will operate from..."
                      value={values.location}
                      overlayColumns={["Name"]}
                      overlayRenderRow={LocationOverlayRow}
                      filterDefs={getLocationFilters(values)}
                      objectType={Location}
                      fields={Location.autocompleteQuery}
                      valueKey="name"
                      addon={LOCATIONS_ICON}
                    />
                  }
                />
              </Fieldset>
              {Settings.fields.position.customFields && (
                <Fieldset title="Position information" id="custom-fields">
                  <CustomFieldsContainer
                    fieldsConfig={Settings.fields.position.customFields}
                    formikProps={{
                      setFieldTouched,
                      setFieldValue,
                      values,
                      validateForm
                    }}
                  />
                </Fieldset>
              )}
              {showSimilarPositions && (
                <SimilarObjectsModal
                  objectType="Position"
                  userInput={`${values.name}`}
                  onCancel={() => {
                    setShowSimilarPositions(false)
                  }}
                >
                </SimilarObjectsModal>
              )}
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
                    Save Position
                  </Button>
                </div>
              </div>
            </Form>
          </div>
        )
      }}
    </Formik>
  )

  function getLocationFilters(values) {
    return Settings?.fields[
      values.type === Position.TYPE.ADVISOR ? "advisor" : "principal"
    ]?.position?.location?.filter.reduce((accummulator, filter) => {
      accummulator[filter] = {
        label: Location.humanNameOfType(filter),
        queryVars: { type: filter }
      }
      return accummulator
    }, {})
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
    const operation = edit ? "updatePosition" : "createPosition"
    const position = new Position({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : initialValues.uuid
    })
    // reset the form to latest values
    // to avoid unsaved changes prompt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    if (!edit) {
      navigate(Position.pathForEdit(position), { replace: true })
    }
    navigate(Position.pathFor(position), {
      state: { success: "Position saved" }
    })
  }

  function save(values, form) {
    const position = new Position(values).filterClientSideFields(
      "previousPeople",
      "customFields",
      "responsibleTasks"
    )

    if (position.type !== Position.TYPE.PRINCIPAL) {
      position.type = position.permissions || Position.TYPE.ADVISOR
    }
    // Remove permissions property, was added temporarily in order to be able
    // to select a specific advisor type.
    delete position.permissions
    position.location = utils.getReference(position.location)
    position.organization = utils.getReference(position.organization)
    position.person = utils.getReference(position.person)
    position.code = position.code || null // Need to null out empty position codes
    position.customFields = customFieldsJSONString(values)

    return API.mutation(edit ? GQL_UPDATE_POSITION : GQL_CREATE_POSITION, {
      position
    })
  }
}

PositionForm.propTypes = {
  initialValues: PropTypes.instanceOf(Position).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool,
  notesComponent: PropTypes.node
}

PositionForm.defaultProps = {
  title: "",
  edit: false
}

export default PositionForm
