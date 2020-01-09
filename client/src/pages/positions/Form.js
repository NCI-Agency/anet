import API, { Settings } from "api"
import { gql } from "apollo-boost"
import {
  LocationOverlayRow,
  OrganizationOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import { FastField, Form, Formik } from "formik"
import DictionaryField from "HOC/DictionaryField"
import { Location, Organization, Person, Position } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, HelpBlock } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import LOCATIONS_ICON from "resources/locations.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import utils from "utils"

const GQL_CREATE_POSITION = gql`
  mutation($position: PositionInput!) {
    createPosition(position: $position) {
      uuid
    }
  }
`
const GQL_UPDATE_POSITION = gql`
  mutation($position: PositionInput!) {
    updatePosition(position: $position)
  }
`

const BasePositionForm = props => {
  const { currentUser, edit, title, initialValues, ...myFormProps } = props
  const history = useHistory()
  const [error, setError] = useState(null)
  const statusButtons = [
    {
      id: "statusActiveButton",
      value: Position.STATUS.ACTIVE,
      label: "Active"
    },
    {
      id: "statusInactiveButton",
      value: Position.STATUS.INACTIVE,
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
      id: "permsSuperUserButton",
      value: Position.TYPE.SUPER_USER,
      label: Settings.fields.superUser.position.type
    },
    {
      id: "permsAdminButton",
      value: Position.TYPE.ADMINISTRATOR,
      label: Settings.fields.administrator.position.type
    }
  ])

  const CodeFieldWithLabel = DictionaryField(FastField)

  // For advisor types of positions, add permissions property.
  // The permissions property allows selecting a
  // specific advisor type and is removed in the onSubmit method.
  if (
    [
      Position.TYPE.ADVISOR,
      Position.TYPE.SUPER_USER,
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
        const isPrincipal = values.type === Position.TYPE.PRINCIPAL
        const positionSettings = isPrincipal
          ? Settings.fields.principal.position
          : Settings.fields.advisor.position

        const isAdmin = currentUser && currentUser.isAdmin()
        const permissionsButtons = isAdmin
          ? adminPermissionsButtons
          : nonAdminPermissionsButtons

        const orgSearchQuery = { status: Organization.STATUS.ACTIVE }
        if (isPrincipal) {
          orgSearchQuery.type = Organization.TYPE.PRINCIPAL_ORG
        } else {
          orgSearchQuery.type = Organization.TYPE.ADVISOR_ORG
          if (
            currentUser &&
            currentUser.position &&
            currentUser.position.type === Position.TYPE.SUPER_USER
          ) {
            orgSearchQuery.parentOrgUuid =
              currentUser.position.organization.uuid
            orgSearchQuery.parentOrgRecursively = true
          }
        }
        // Reset the organization property when changing the organization type
        if (
          values.organization &&
          values.organization.type &&
          values.organization.type !== orgSearchQuery.type
        ) {
          values.organization = {}
        }
        const willAutoKickPerson =
          values.status === Position.STATUS.INACTIVE &&
          values.person &&
          values.person.uuid
        const action = (
          <div>
            <Button
              key="submit"
              bsStyle="primary"
              type="button"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save Position
            </Button>
          </div>
        )
        const organizationFilters = {
          allOrganizations: {
            label: "All organizations",
            queryVars: {}
          }
        }
        const locationFilters = {
          activeLocations: {
            label: "All locations",
            queryVars: { status: Location.STATUS.ACTIVE }
          }
        }
        return (
          <div>
            <NavigationWarning isBlocking={dirty} />
            <Messages error={error} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                {props.edit ? (
                  <FastField
                    name="type"
                    component={FieldHelper.renderReadonlyField}
                    humanValue={Position.humanNameOfType}
                  />
                ) : (
                  <FastField
                    name="type"
                    component={FieldHelper.renderRadioButtonToggleGroup}
                    buttons={typeButtons}
                    onChange={value => setFieldValue("type", value)}
                  />
                )}

                <FastField
                  name="status"
                  component={FieldHelper.renderRadioButtonToggleGroup}
                  buttons={statusButtons}
                  onChange={value => setFieldValue("status", value)}
                >
                  {willAutoKickPerson && (
                    <HelpBlock>
                      <span className="text-danger">
                        Setting this position to inactive will automatically
                        remove <LinkTo person={values.person} /> from this
                        position.
                      </span>
                    </HelpBlock>
                  )}
                </FastField>

                <AdvancedSingleSelect
                  fieldName="organization"
                  fieldLabel="Organization"
                  placeholder="Search the organization for this position..."
                  value={values.organization}
                  overlayColumns={["Name"]}
                  overlayRenderRow={OrganizationOverlayRow}
                  filterDefs={organizationFilters}
                  onChange={value => setFieldValue("organization", value)}
                  objectType={Organization}
                  fields={Organization.autocompleteQuery}
                  queryParams={orgSearchQuery}
                  valueKey="shortName"
                  addon={ORGANIZATIONS_ICON}
                />

                <CodeFieldWithLabel
                  dictProps={positionSettings.code}
                  name="code"
                  component={FieldHelper.renderInputField}
                />

                <FastField
                  name="name"
                  component={FieldHelper.renderInputField}
                  label={Settings.fields.position.name}
                  placeholder="Name/Description of Position"
                />

                {!isPrincipal && (
                  <FastField
                    name="permissions"
                    component={FieldHelper.renderRadioButtonToggleGroup}
                    buttons={permissionsButtons}
                    onChange={value => setFieldValue("permissions", value)}
                  />
                )}
              </Fieldset>

              <Fieldset title="Additional information">
                <AdvancedSingleSelect
                  fieldName="location"
                  fieldLabel="Location"
                  placeholder="Search for the location where this Position will operate from..."
                  value={values.location}
                  overlayColumns={["Name"]}
                  overlayRenderRow={LocationOverlayRow}
                  filterDefs={locationFilters}
                  onChange={value => setFieldValue("location", value)}
                  objectType={Location}
                  fields={Location.autocompleteQuery}
                  queryParams={{ status: Location.STATUS.ACTIVE }}
                  valueKey="name"
                  addon={LOCATIONS_ICON}
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
    const operation = edit ? "updatePosition" : "createPosition"
    const position = new Position({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : props.initialValues.uuid
    })
    // After successful submit, reset the form in order to make sure the dirty
    // prop is also reset (otherwise we would get a blocking navigation warning)
    form.resetForm()
    if (!edit) {
      history.replace(Position.pathForEdit(position))
    }
    history.push(Position.pathFor(position), {
      success: "Position saved"
    })
  }

  function save(values, form) {
    const position = Object.without(new Position(values), "notes")
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
    return API.mutation(
      props.edit ? GQL_UPDATE_POSITION : GQL_CREATE_POSITION,
      { position }
    )
  }
}

BasePositionForm.propTypes = {
  initialValues: PropTypes.instanceOf(Position).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool,
  currentUser: PropTypes.instanceOf(Person)
}

BasePositionForm.defaultProps = {
  title: "",
  edit: false
}

const PositionForm = props => (
  <AppContext.Consumer>
    {context => (
      <BasePositionForm currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default PositionForm
