import { gql } from "@apollo/client"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { OrganizationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import {
  HierarchicalLocationOverlayTable,
  locationFields
} from "components/advancedSelectWidget/HierarchicalLocationOverlayTable"
import {
  HierarchicalTaskOverlayTable,
  taskFields
} from "components/advancedSelectWidget/HierarchicalTaskOverlayTable"
import App6Symbol, { fieldsList as app6fieldsList } from "components/App6Symbol"
import AppContext from "components/AppContext"
import ApprovalsDefinition from "components/approvals/ApprovalsDefinition"
import UploadAttachment from "components/Attachment/UploadAttachment"
import EntityAvatarComponent from "components/avatar/EntityAvatarComponent"
import {
  CustomFieldsContainer,
  customFieldsJSONString
} from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import EditApp6SymbolModal from "components/editor/EditApp6SymbolModal"
import EmailAddressInputTable, {
  initializeEmailAddresses
} from "components/EmailAddressInputTable"
import EmailAddressTable from "components/EmailAddressTable"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import { LeafletWithSelection } from "components/Leaflet"
import LinkTo from "components/LinkTo"
import { MessagesWithConflict } from "components/Messages"
import Model from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import NoPaginationTaskTable from "components/NoPaginationTaskTable"
import { jumpToTop } from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import { FastField, Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import { Location, Organization, Task } from "models"
import pluralize from "pluralize"
import React, { useContext, useState } from "react"
import { Badge, Button, Col, FormGroup, Row } from "react-bootstrap"
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
  mutation ($organization: OrganizationInput!, $force: Boolean) {
    updateOrganization(organization: $organization, force: $force)
  }
`

const autocompleteQuery = `${Organization.autocompleteQuery} ascendantOrgs { uuid app6context app6standardIdentity app6symbolSet parentOrg { uuid } }`

interface OrganizationFormProps {
  initialValues: any
  title?: string
  edit?: boolean
  notesComponent?: React.ReactNode
}

const OrganizationForm = ({
  edit = false,
  title = "",
  initialValues,
  notesComponent
}: OrganizationFormProps) => {
  const [showApp6Modal, setShowApp6Modal] = useState(false)
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
  initialValues.emailAddresses = initializeEmailAddresses(
    initialValues.emailAddresses
  )
  const avatarMimeTypes = Settings.fields.attachment.fileTypes
    .filter(fileType => fileType.avatar)
    .map(fileType => fileType.mimeType)
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
        resetForm,
        setSubmitting,
        submitForm
      }) => {
        const isAdmin = currentUser && currentUser.isAdmin()
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
        const orgSearchQuery = {}
        // Superusers can select parent organizations among the ones their position is administrating
        if (!isAdmin) {
          const orgsAdministratedUuids =
            currentUser.position.organizationsAdministrated.map(org => org.uuid)
          orgSearchQuery.parentOrgUuid = [...orgsAdministratedUuids]
          orgSearchQuery.orgRecurseStrategy = RECURSE_STRATEGY.CHILDREN
        }
        const { parentContext, parentStandardIdentity, parentSymbolSet } =
          Organization.getApp6ParentFields(values.parentOrg, values)
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
            label: `All ${pluralize(Settings.fields.task.shortLabel)}`
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
            label: "All organizations"
          }
        }
        const locationFilters = Location.getOrganizationLocationFilters()

        const approversFilters = {
          allPositions: {
            label: "All positions",
            queryVars: {
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
        const imageAttachments = attachmentList?.filter(a =>
          avatarMimeTypes.includes(a.mimeType)
        )

        return (
          <div>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <MessagesWithConflict
              error={error}
              objectType="Organization"
              onCancel={onCancel}
              onConfirm={() => {
                resetForm({ values, isSubmitting: true })
                onSubmit(values, { resetForm, setSubmitting }, true)
              }}
            />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <Row>
                  {edit && (
                    <Col sm={12} md={12} lg={4} xl={4} className="text-center">
                      <EntityAvatarComponent
                        initialAvatar={initialValues.entityAvatar}
                        relatedObjectType="organizations"
                        relatedObjectUuid={initialValues.uuid}
                        relatedObjectName={initialValues.shortName}
                        editMode={attachmentEditEnabled}
                        imageAttachments={imageAttachments}
                      />
                    </Col>
                  )}
                  <Col
                    lg={8}
                    xl={8}
                    className="d-flex flex-column justify-content-center"
                  >
                    <FormGroup>
                      <Row
                        style={{ marginBottom: "1rem", alignItems: "center" }}
                      >
                        <Col sm={7}>
                          <Row>
                            <Col>
                              {!canAdministrateOrg ? (
                                <>
                                  <DictionaryField
                                    wrappedComponent={FastField}
                                    dictProps={
                                      Settings.fields.organization.shortName
                                    }
                                    name="shortName"
                                    component={FieldHelper.ReadonlyField}
                                  />
                                  <DictionaryField
                                    wrappedComponent={FastField}
                                    dictProps={
                                      Settings.fields.organization.longName
                                    }
                                    name="longName"
                                    component={FieldHelper.ReadonlyField}
                                  />
                                </>
                              ) : (
                                <>
                                  <DictionaryField
                                    wrappedComponent={FastField}
                                    dictProps={
                                      Settings.fields.organization.shortName
                                    }
                                    name="shortName"
                                    component={FieldHelper.InputField}
                                  />
                                  <DictionaryField
                                    wrappedComponent={FastField}
                                    dictProps={
                                      Settings.fields.organization.longName
                                    }
                                    name="longName"
                                    component={FieldHelper.InputField}
                                  />
                                </>
                              )}
                            </Col>
                          </Row>
                        </Col>
                        <Col
                          sm={5}
                          className="d-flex flex-column justify-content-center align-items-center"
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              width: 160,
                              gap: 30
                            }}
                          >
                            <App6Symbol
                              values={{
                                ...values,
                                app6context:
                                  values.app6context || parentContext,
                                app6standardIdentity:
                                  values.app6standardIdentity ||
                                  parentStandardIdentity,
                                app6symbolSet:
                                  values.app6symbolSet || parentSymbolSet
                              }}
                              size={120}
                              maxHeight={250}
                            />
                            <Button
                              onClick={() => setShowApp6Modal(true)}
                              id="edit-app6-button"
                            >
                              Edit APP-06 Symbol
                            </Button>
                          </div>
                          <EditApp6SymbolModal
                            values={values}
                            showModal={showApp6Modal}
                            onHide={() => setShowApp6Modal(false)}
                            onSave={symbologyValues => {
                              app6fieldsList.forEach(field => {
                                setFieldValue(field, symbologyValues[field])
                              })
                              setShowApp6Modal(false)
                            }}
                          />
                        </Col>
                      </Row>
                    </FormGroup>
                  </Col>
                </Row>
              </Fieldset>
              <Fieldset
                title="Additional Information"
                id="additional-information"
              >
                {!canAdministrateOrg ? (
                  <>
                    <DictionaryField
                      wrappedComponent={FastField}
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
                    <DictionaryField
                      wrappedComponent={FastField}
                      dictProps={
                        Settings.fields.organization.identificationCode
                      }
                      name="identificationCode"
                      component={FieldHelper.ReadonlyField}
                    />
                    <DictionaryField
                      wrappedComponent={FastField}
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
                    <DictionaryField
                      wrappedComponent={FastField}
                      dictProps={Settings.fields.organization.emailAddresses}
                      name="emailAddresses"
                      component={FieldHelper.ReadonlyField}
                      humanValue={
                        <EmailAddressTable
                          label={
                            Settings.fields.organization.emailAddresses.label
                          }
                          emailAddresses={values.emailAddresses}
                        />
                      }
                    />
                    <DictionaryField
                      wrappedComponent={FastField}
                      dictProps={Settings.fields.organization.status}
                      name="status"
                      component={FieldHelper.ReadonlyField}
                      humanValue={Organization.humanNameOfStatus}
                    />
                    <DictionaryField
                      wrappedComponent={FastField}
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
                    <DictionaryField
                      wrappedComponent={Field}
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
                          showRemoveButton={canAdministrateParentOrg}
                          value={values.parentOrg}
                          overlayColumns={["Name"]}
                          overlayRenderRow={OrganizationOverlayRow}
                          filterDefs={organizationFilters}
                          objectType={Organization}
                          fields={autocompleteQuery}
                          queryParams={orgSearchQuery}
                          valueKey="shortName"
                          addon={ORGANIZATIONS_ICON}
                        />
                      }
                    />
                    <DictionaryField
                      wrappedComponent={FastField}
                      dictProps={
                        Settings.fields.organization.identificationCode
                      }
                      name="identificationCode"
                      component={FieldHelper.InputField}
                    />
                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.fields.organization.location}
                      name="location"
                      component={FieldHelper.SpecialField}
                      widget={
                        <>
                          <AdvancedSingleSelect
                            fieldName="location"
                            placeholder={
                              Settings.fields.organization.location.placeholder
                            }
                            value={values.location}
                            overlayColumns={["Name"]}
                            overlayTable={HierarchicalLocationOverlayTable}
                            restrictSelectableItems
                            filterDefs={locationFilters}
                            objectType={Location}
                            fields={locationFields}
                            valueKey="name"
                            onChange={value => {
                              // validation will be done by setFieldValue
                              setFieldTouched("location", true, false) // onBlur doesn't work when selecting an option
                              setFieldValue("location", value)
                            }}
                            addon={LOCATIONS_ICON}
                            pageSize={0}
                          />
                          <div className="mt-3">
                            <LeafletWithSelection
                              mapId="organization-location"
                              location={values.location}
                              onSelectAnetLocation={(loc: any) => {
                                setFieldTouched("location", true, false)
                                setFieldValue("location", loc, true)
                              }}
                            />
                          </div>
                        </>
                      }
                    />
                    <DictionaryField
                      wrappedComponent={FastField}
                      as="div"
                      dictProps={Settings.fields.organization.emailAddresses}
                      component={FieldHelper.SpecialField}
                      widget={
                        <EmailAddressInputTable
                          emailAddresses={values.emailAddresses}
                        />
                      }
                    />
                    <DictionaryField
                      wrappedComponent={FastField}
                      dictProps={Settings.fields.organization.status}
                      name="status"
                      component={FieldHelper.RadioButtonToggleGroupField}
                      buttons={statusButtons}
                      onChange={value => setFieldValue("status", value)}
                    />
                    <DictionaryField
                      wrappedComponent={FastField}
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
                            )}…`}
                            value={values.tasks}
                            renderSelected={
                              <NoPaginationTaskTable
                                tasks={values.tasks}
                                showDelete
                              />
                            }
                            overlayColumns={["Name"]}
                            overlayTable={HierarchicalTaskOverlayTable}
                            restrictSelectableItems
                            filterDefs={tasksFilters}
                            objectType={Task}
                            fields={taskFields}
                            addon={TASKS_ICON}
                            pageSize={0}
                          />
                        }
                      />
                    )}
                  </Fieldset>
                )}
              </div>
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
  function save(values, form, force) {
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
      { organization, force }
    ).then()
  }
}

export default OrganizationForm
