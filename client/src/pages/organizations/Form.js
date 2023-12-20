import { gql } from "@apollo/client"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import {
  LocationOverlayRow,
  OrganizationOverlayRow,
  TaskOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import ApprovalsDefinition from "components/approvals/ApprovalsDefinition"
import UploadAttachment from "components/Attachment/UploadAttachment"
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
import NoPaginationTaskTable from "components/NoPaginationTaskTable"
import { jumpToTop } from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import { FastField, Field, Form, Formik } from "formik"
import DictionaryField from "HOC/DictionaryField"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import { Location, Organization, Position, Task } from "models"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import { Badge, Button } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import LOCATIONS_ICON from "resources/locations.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import TASKS_ICON from "resources/tasks.png"
import { RECURSE_STRATEGY } from "searchUtils"
import Settings from "settings"
import utils from "utils"

const GQL_CREATE_ORGANIZATION = gql`
  mutation ($organization: OrganizationInput!) {
    createOrganization(organization: $organization) {
      uuid
    }
  }
`
const GQL_UPDATE_ORGANIZATION = gql`
  mutation ($organization: OrganizationInput!) {
    updateOrganization(organization: $organization)
  }
`

const OrganizationForm = ({ edit, title, initialValues, notesComponent }) => {
  const { loadAppData, currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [attachmentList, setAttachmentList] = useState(
    initialValues?.attachments
  )
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled
  const attachmentEditEnabled =
    attachmentsEnabled &&
    (!Settings.fields.attachment.restrictToAdmins || currentUser.isAdmin())
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
      value: Organization.TYPE.ADVISOR_ORG,
      label: Settings.fields.advisor.org.name
    },
    {
      id: "typePrincipalButton",
      value: Organization.TYPE.PRINCIPAL_ORG,
      label: Settings.fields.principal.org.name
    }
  ]

  const DictField = DictionaryField(Field)
  const DictFastField = DictionaryField(FastField)

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={Organization.yupSchema}
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
        const isAdmin = currentUser && currentUser.isAdmin()
        const isAdvisorOrg = values.type === Organization.TYPE.ADVISOR_ORG
        const canAdministrateParentOrg =
          _isEmpty(values.parentOrg) ||
          (currentUser &&
            currentUser.hasAdministrativePermissionsForOrganization(
              values.parentOrg
            ))
        const canAdministrateOrg = edit
          ? currentUser &&
            currentUser.hasAdministrativePermissionsForOrganization(values)
          : canAdministrateParentOrg
        const orgSearchQuery = {
          status: Model.STATUS.ACTIVE,
          type: values.type
        }
        // Superusers can select parent organizations among the ones their position is administrating
        if (!isAdmin) {
          const orgsAdministratedUuids =
            currentUser.position.organizationsAdministrated.map(org => org.uuid)
          orgSearchQuery.parentOrgUuid = [
            currentUser.position.organization.uuid,
            ...orgsAdministratedUuids
          ]
          orgSearchQuery.orgRecurseStrategy = RECURSE_STRATEGY.CHILDREN
        }
        // Reset the parentOrg property when changing the organization type
        if (
          values.parentOrg &&
          values.parentOrg.type &&
          values.parentOrg.type !== values.type
        ) {
          values.parentOrg = {}
        }
        const action = canAdministrateOrg && (
          <>
            <Button
              key="submit"
              variant="primary"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save Organization
            </Button>
            {notesComponent}
          </>
        )
        const tasksFilters = {
          allTasks: {
            label: `All ${pluralize(Settings.fields.task.shortLabel)}`,
            queryVars: {}
          }
        }
        if (currentUser.position) {
          tasksFilters.assignedToMyOrg = {
            label: "Assigned to my organization",
            queryVars: {
              taskedOrgUuid: currentUser.position.organization.uuid
            }
          }
        }

        const organizationFilters = {
          allOrganizations: {
            label: "All organizations",
            queryVars: {}
          }
        }

        const approversFilters = {
          allAdvisorPositions: {
            label: "All advisor positions",
            queryVars: {
              type: [
                Position.TYPE.ADVISOR,
                Position.TYPE.SUPERUSER,
                Position.TYPE.ADMINISTRATOR
              ],
              matchPersonName: true
            }
          }
        }
        if (currentUser.position) {
          approversFilters.myColleagues = {
            label: "My colleagues",
            queryVars: {
              matchPersonName: true,
              organizationUuid: currentUser.position.organization.uuid
            }
          }
        }

        return (
          <div>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <Messages error={error} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                {!canAdministrateOrg ? (
                  <>
                    <DictFastField
                      dictProps={Settings.fields.organization.shortName}
                      name="shortName"
                      component={FieldHelper.ReadonlyField}
                    />
                    <DictFastField
                      dictProps={Settings.fields.organization.longName}
                      name="longName"
                      component={FieldHelper.ReadonlyField}
                    />
                    <DictFastField
                      dictProps={Settings.fields.organization.type}
                      name="type"
                      component={FieldHelper.ReadonlyField}
                      humanValue={Organization.humanNameOfType}
                    />
                    <DictFastField
                      dictProps={Settings.fields.organization.parentOrg}
                      name="parentOrg"
                      component={FieldHelper.ReadonlyField}
                      humanValue={
                        values.parentOrg && (
                          <LinkTo
                            modelType="Organization"
                            model={values.parentOrg}
                          />
                        )
                      }
                    />
                    <DictFastField
                      dictProps={
                        Settings.fields.organization.identificationCode
                      }
                      name="identificationCode"
                      component={FieldHelper.ReadonlyField}
                    />
                    <DictFastField
                      dictProps={Settings.fields.organization.location}
                      name="location"
                      component={FieldHelper.ReadonlyField}
                      humanValue={
                        values.location && (
                          <>
                            <LinkTo
                              modelType="Location"
                              model={values.location}
                            />{" "}
                            <Badge>
                              {Location.humanNameOfType(values.location.type)}
                            </Badge>
                          </>
                        )
                      }
                    />
                    <DictFastField
                      dictProps={Settings.fields.organization.status}
                      name="status"
                      component={FieldHelper.ReadonlyField}
                      humanValue={Organization.humanNameOfStatus}
                    />
                    <DictFastField
                      dictProps={Settings.fields.organization.profile}
                      name="profile"
                      component={FieldHelper.ReadonlyField}
                      humanValue={
                        <RichTextEditor readOnly className="profile" />
                      }
                    />
                  </>
                ) : (
                  <>
                    <DictFastField
                      dictProps={Settings.fields.organization.shortName}
                      name="shortName"
                      component={FieldHelper.InputField}
                    />
                    <DictFastField
                      dictProps={Settings.fields.organization.longName}
                      name="longName"
                      component={FieldHelper.InputField}
                    />
                    <DictFastField
                      dictProps={Settings.fields.organization.type}
                      name="type"
                      component={FieldHelper.RadioButtonToggleGroupField}
                      buttons={typeButtons}
                      onChange={value => setFieldValue("type", value)}
                      disabled={!isAdmin}
                    />
                    <DictField
                      dictProps={Settings.fields.organization.parentOrg}
                      name="parentOrg"
                      component={FieldHelper.SpecialField}
                      onChange={value => {
                        // validation will be done by setFieldValue
                        setFieldTouched("parentOrg", true, false) // onBlur doesn't work when selecting an option
                        setFieldValue("parentOrg", value)
                      }}
                      disabled={!canAdministrateParentOrg}
                      widget={
                        <AdvancedSingleSelect
                          fieldName="parentOrg"
                          placeholder={
                            Settings.fields.organization.parentOrg.placeholder
                          }
                          showRemoveButton={isAdmin}
                          value={values.parentOrg}
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
                    <DictFastField
                      dictProps={
                        Settings.fields.organization.identificationCode
                      }
                      name="identificationCode"
                      component={FieldHelper.InputField}
                    />
                    <DictField
                      dictProps={Settings.fields.organization.location}
                      name="location"
                      component={FieldHelper.SpecialField}
                      onChange={value => {
                        // validation will be done by setFieldValue
                        setFieldTouched("location", true, false) // onBlur doesn't work when selecting an option
                        setFieldValue("location", value)
                      }}
                      widget={
                        <AdvancedSingleSelect
                          fieldName="location"
                          placeholder={
                            Settings.fields.organization.location.placeholder
                          }
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
                    <DictFastField
                      dictProps={Settings.fields.organization.status}
                      name="status"
                      component={FieldHelper.RadioButtonToggleGroupField}
                      buttons={statusButtons}
                      onChange={value => setFieldValue("status", value)}
                    />
                    <DictFastField
                      dictProps={Settings.fields.organization.profile}
                      name="profile"
                      component={FieldHelper.SpecialField}
                      onChange={value => {
                        // prevent initial unnecessary render of RichTextEditor
                        if (!_isEqual(values.profile, value)) {
                          setFieldValue("profile", value, true)
                        }
                      }}
                      onHandleBlur={() => {
                        // validation will be done by setFieldValue
                        setFieldTouched("profile", true, false)
                      }}
                      widget={
                        <RichTextEditor
                          className="profile"
                          placeholder={
                            Settings.fields.organization.profile?.placeholder
                          }
                        />
                      }
                    />
                  </>
                )}

                {edit && attachmentEditEnabled && (
                  <Field
                    name="uploadAttachments"
                    label="Attachments"
                    component={FieldHelper.SpecialField}
                    widget={
                      <UploadAttachment
                        attachments={attachmentList}
                        updateAttachments={setAttachmentList}
                        relatedObjectType={Organization.relatedObjectType}
                        relatedObjectUuid={values.uuid}
                      />
                    }
                    onHandleBlur={() => {
                      setFieldTouched("uploadAttachments", true, false)
                    }}
                  />
                )}
              </Fieldset>

              {isAdvisorOrg && (
                <div>
                  <ApprovalsDefinition
                    fieldName="planningApprovalSteps"
                    values={values}
                    title="Engagement planning approval process"
                    addButtonLabel="Add a Planning Approval Step"
                    setFieldTouched={setFieldTouched}
                    setFieldValue={setFieldValue}
                    approversFilters={approversFilters}
                  />
                </div>
              )}

              {isAdvisorOrg && (
                <div>
                  <ApprovalsDefinition
                    fieldName="approvalSteps"
                    values={values}
                    title="Report publication approval process"
                    addButtonLabel="Add a Publication Approval Step"
                    setFieldTouched={setFieldTouched}
                    setFieldValue={setFieldValue}
                    approversFilters={approversFilters}
                  />

                  {Organization.isTaskEnabled(values.shortName) && (
                    <Fieldset
                      title={Settings.fields.task.longLabel}
                      className="tasks-selector"
                    >
                      {!isAdmin ? (
                        <NoPaginationTaskTable tasks={values.tasks} />
                      ) : (
                        <FastField
                          name="tasks"
                          label={Settings.fields.task.shortLabel}
                          component={FieldHelper.SpecialField}
                          onChange={value => {
                            // validation will be done by setFieldValue
                            setFieldTouched("tasks", true, false) // onBlur doesn't work when selecting an option
                            setFieldValue("tasks", value)
                          }}
                          widget={
                            <AdvancedMultiSelect
                              fieldName="tasks"
                              placeholder={`Search for ${pluralize(
                                Settings.fields.task.shortLabel
                              )}...`}
                              value={values.tasks}
                              renderSelected={
                                <NoPaginationTaskTable
                                  tasks={values.tasks}
                                  showDelete
                                />
                              }
                              overlayColumns={["Name"]}
                              overlayRenderRow={TaskOverlayRow}
                              filterDefs={tasksFilters}
                              objectType={Task}
                              queryParams={{ status: Model.STATUS.ACTIVE }}
                              fields={Task.autocompleteQuery}
                              addon={TASKS_ICON}
                            />
                          }
                        />
                      )}
                    </Fieldset>
                  )}
                </div>
              )}
              {Settings.fields.organization.customFields && (
                <Fieldset title="Organization information" id="custom-fields">
                  <CustomFieldsContainer
                    fieldsConfig={Settings.fields.organization.customFields}
                    formikProps={{
                      setFieldTouched,
                      setFieldValue,
                      values,
                      validateForm
                    }}
                  />
                </Fieldset>
              )}

              <div className="submit-buttons">
                <div>
                  <Button onClick={onCancel} variant="outline-secondary">
                    Cancel
                  </Button>
                </div>
                {canAdministrateOrg && (
                  <div>
                    <Button
                      id="formBottomSubmit"
                      variant="primary"
                      onClick={submitForm}
                      disabled={isSubmitting}
                    >
                      Save Organization
                    </Button>
                  </div>
                )}
              </div>
            </Form>
          </div>
        )
      }}
    </Formik>
  )

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
    const operation = edit ? "updateOrganization" : "createOrganization"
    const organization = new Organization({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : initialValues.uuid
    })
    // reset the form to latest values
    // to avoid unsaved changes prompt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    loadAppData()
    if (!edit) {
      navigate(Organization.pathForEdit(organization), { replace: true })
    }
    navigate(Organization.pathFor(organization), {
      state: { success: "Organization saved" }
    })
  }

  function save(values, form) {
    const organization = Organization.filterClientSideFields(
      new Organization(values)
    )
    // strip tasks fields not in data model
    organization.tasks = values.tasks.map(t => utils.getReference(t))
    organization.parentOrg = utils.getReference(organization.parentOrg)
    organization.location = utils.getReference(organization.location)
    organization.customFields = customFieldsJSONString(values)
    return API.mutation(
      edit ? GQL_UPDATE_ORGANIZATION : GQL_CREATE_ORGANIZATION,
      { organization }
    ).then()
  }

  function getLocationFilters(values) {
    return Settings?.fields[
      values.type === Organization.TYPE.ADVISOR_ORG ? "advisor" : "principal"
    ]?.org?.location?.filter.reduce((accummulator, filter) => {
      accummulator[filter] = {
        label: Location.humanNameOfType(filter),
        queryVars: { type: filter }
      }
      return accummulator
    }, {})
  }
}

OrganizationForm.propTypes = {
  initialValues: PropTypes.instanceOf(Organization).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool,
  notesComponent: PropTypes.node
}

OrganizationForm.defaultProps = {
  title: "",
  edit: false
}

export default OrganizationForm
