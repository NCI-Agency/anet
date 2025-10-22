import { gql } from "@apollo/client"
import { Icon, IconSize, Intent } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import { OrganizationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import {
  HierarchicalLocationOverlayTable,
  locationFields
} from "components/advancedSelectWidget/HierarchicalLocationOverlayTable"
import AppContext from "components/AppContext"
import UploadAttachment from "components/Attachment/UploadAttachment"
import EntityAvatarComponent from "components/avatar/EntityAvatarComponent"
import {
  CustomFieldsContainer,
  customFieldsJSONString
} from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import EmailAddressInputTable, {
  initializeEmailAddresses
} from "components/EmailAddressInputTable"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Leaflet, { ICON_TYPES } from "components/Leaflet"
import LinkTo from "components/LinkTo"
import { MessagesWithConflict } from "components/Messages"
import Model from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import SimilarObjectsModal from "components/SimilarObjectsModal"
import { FastField, Field, Form, Formik } from "formik"
import _isEqual from "lodash/isEqual"
import { Location, Organization, Position } from "models"
import { PositionRole } from "models/Position"
import React, { useContext, useEffect, useState } from "react"
import { Button, Col, Form as FormBS, Row } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import LOCATIONS_ICON from "resources/locations.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import { RECURSE_STRATEGY } from "searchUtils"
import Settings from "settings"
import { useDebouncedCallback } from "use-debounce"
import utils from "utils"

const GQL_CREATE_POSITION = gql`
  mutation ($position: PositionInput!) {
    createPosition(position: $position) {
      uuid
    }
  }
`
const GQL_UPDATE_POSITION = gql`
  mutation ($position: PositionInput!, $force: Boolean) {
    updatePosition(position: $position, force: $force)
  }
`
const GQL_GET_POSITION_COUNT = gql`
  query ($positionQuery: PositionSearchQueryInput) {
    positionList(query: $positionQuery) {
      totalCount
    }
  }
`
const MIN_CHARS_FOR_DUPLICATES = 3

interface PositionFormProps {
  initialValues: any
  title?: string
  edit?: boolean
  notesComponent?: React.ReactNode
}

const PositionForm = ({
  edit = false,
  title = "",
  initialValues,
  notesComponent
}: PositionFormProps) => {
  const { currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [attachmentList, setAttachmentList] = useState(
    initialValues?.attachments
  )
  const [showSimilarPositions, setShowSimilarPositions] = useState(false)
  const [showSimilarPositionsMessage, setShowSimilarPositionsMessage] =
    useState(false)
  const [positionName, setPositionName] = useState(initialValues?.name)
  const [permissions, setPermissions] = useState(initialValues?.type)
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled
  const attachmentEditEnabled =
    attachmentsEnabled &&
    (!Settings.fields.attachment.restrictToAdmins || currentUser.isAdmin())
  const avatarMimeTypes = Settings.fields.attachment.fileTypes
    .filter(fileType => fileType.avatar)
    .map(fileType => fileType.mimeType)
  initialValues.emailAddresses = initializeEmailAddresses(
    initialValues.emailAddresses
  )
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
      id: "typeRegularButton",
      value: Position.TYPE.REGULAR,
      label: Settings.fields.regular.position.name
    }
  ]
  const nonAdminPermissionsButtons = [
    {
      id: "permsRegularButton",
      value: Position.TYPE.REGULAR,
      label: Settings.fields.regular.position.type
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

  const superUserTypeButtons = [
    {
      id: "permsSuperuserRegularButton",
      value: Position.SUPERUSER_TYPE.REGULAR,
      label: Position.humanNameOfSuperuserType(Position.SUPERUSER_TYPE.REGULAR)
    },
    {
      id: "permsSuperuserRegularButton",
      value:
        Position.SUPERUSER_TYPE.CAN_CREATE_TOP_LEVEL_ORGANIZATIONS_OR_TASKS,
      label: Position.humanNameOfSuperuserType(
        Position.SUPERUSER_TYPE.CAN_CREATE_TOP_LEVEL_ORGANIZATIONS_OR_TASKS
      )
    },
    {
      id: "permsSuperuserRegularButton",
      value:
        Position.SUPERUSER_TYPE.CAN_CREATE_OR_EDIT_ANY_ORGANIZATION_OR_TASK,
      label: Position.humanNameOfSuperuserType(
        Position.SUPERUSER_TYPE.CAN_CREATE_OR_EDIT_ANY_ORGANIZATION_OR_TASK
      )
    }
  ]

  const checkPotentialDuplicatesDebounced = useDebouncedCallback(
    checkPotentialDuplicates,
    400
  )
  useEffect(() => {
    checkPotentialDuplicatesDebounced(positionName)
  }, [checkPotentialDuplicatesDebounced, positionName])

  // The permissions property allows selecting a
  // specific type and is removed in the onSubmit method.
  initialValues.permissions = initialValues.type

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
        resetForm,
        setSubmitting,
        submitForm
      }) => {
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
        const positionSuperuserTypeButtons = superUserTypeButtons
        const orgSearchQuery = { status: Model.STATUS.ACTIVE }
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
        const imageAttachments = attachmentList?.filter(a =>
          avatarMimeTypes.includes(a.mimeType)
        )
        const action = (
          <>
            <Button
              key="submit"
              variant="primary"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save Position
            </Button>
            {notesComponent}
          </>
        )
        const organizationFilters = {
          allOrganizations: {
            label: "All organizations",
            queryVars: {}
          }
        }
        const locationFilters = Location.getPositionLocationFilters()

        return (
          <div>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <MessagesWithConflict
              error={error}
              objectType="Position"
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
                        relatedObjectType={Position.relatedObjectType}
                        relatedObjectUuid={initialValues.uuid}
                        relatedObjectName={initialValues.name}
                        editMode={attachmentEditEnabled}
                        imageAttachments={imageAttachments}
                      />
                    </Col>
                  )}
                  <Col sm={12} md={12} lg={8} xl={8}>
                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.fields.position.name}
                      name="name"
                      component={FieldHelper.InputField}
                      onChange={event => {
                        setFieldValue("name", event.target.value)
                        setPositionName(event.target.value)
                      }}
                      extraColElem={
                        showSimilarPositionsMessage ? (
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

                    {edit ? (
                      <DictionaryField
                        wrappedComponent={FastField}
                        dictProps={Settings.fields.position.type}
                        name="type"
                        component={FieldHelper.ReadonlyField}
                        humanValue={Position.humanNameOfType}
                      />
                    ) : (
                      <DictionaryField
                        wrappedComponent={FastField}
                        dictProps={Settings.fields.position.type}
                        name="type"
                        component={FieldHelper.RadioButtonToggleGroupField}
                        buttons={typeButtons}
                        onChange={value => {
                          setFieldValue("type", value)
                        }}
                      />
                    )}

                    <FastField
                      name="permissions"
                      component={FieldHelper.RadioButtonToggleGroupField}
                      buttons={permissionsButtons}
                      onChange={value => {
                        setFieldValue("permissions", value)
                        setFieldValue(
                          "superuserType",
                          value === Position.TYPE.SUPERUSER
                            ? Position.SUPERUSER_TYPE.REGULAR
                            : null
                        )
                        setPermissions(value)
                      }}
                    />
                    {permissions === Position.TYPE.SUPERUSER && (
                      <DictionaryField
                        wrappedComponent={FastField}
                        dictProps={Settings.fields.position.superuserType}
                        name="superuserType"
                        component={FieldHelper.RadioButtonToggleGroupField}
                        buttons={positionSuperuserTypeButtons}
                        onChange={value => {
                          setFieldValue("superuserType", value)
                        }}
                      />
                    )}

                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.fields.position.organization}
                      name="organization"
                      component={FieldHelper.SpecialField}
                      onChange={value => {
                        // validation will be done by setFieldValue
                        setFieldTouched("organization", true, false) // onBlur doesn't work when selecting an option
                        setFieldValue("organization", value)
                      }}
                      widget={
                        <AdvancedSingleSelect
                          fieldName="organization"
                          placeholder={
                            Settings.fields.position.organization.placeholder
                          }
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

                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.fields.position.location}
                      name="location"
                      component={FieldHelper.SpecialField}
                      widget={
                        <>
                          <AdvancedSingleSelect
                            fieldName="location"
                            placeholder={
                              Settings.fields.position.location.placeholder
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
                            <Leaflet
                              mapId="position-location"
                              markers={
                                values.location &&
                                Location.hasCoordinates(values.location)
                                  ? [
                                      {
                                        id:
                                          values.location.uuid ||
                                          `${values.location.lat},${values.location.lng}`,
                                        lat: Number(values.location.lat),
                                        lng: Number(values.location.lng),
                                        name: values.location.name,
                                        icon: ICON_TYPES.DEFAULT
                                      }
                                    ]
                                  : []
                              }
                              onSelectAnetLocation={(loc: any) => {
                                setFieldTouched("location", true, false)
                                setFieldValue("location", loc, true)
                              }}
                            />
                          </div>
                        </>
                      }
                    />
                  </Col>
                </Row>
              </Fieldset>
              <Fieldset title="Additional information">
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.position.code}
                  name="code"
                  component={FieldHelper.InputField}
                />

                <DictionaryField
                  wrappedComponent={FastField}
                  as="div"
                  dictProps={Settings.fields.position.emailAddresses}
                  component={FieldHelper.SpecialField}
                  widget={
                    <EmailAddressInputTable
                      emailAddresses={values.emailAddresses}
                    />
                  }
                />

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.position.status}
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
                </DictionaryField>

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.position.role}
                  name="role"
                  component={FieldHelper.RadioButtonToggleGroupField}
                  buttons={positionRoleButtons}
                  onChange={value => setFieldValue("role", value)}
                />

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.position.description}
                  name="description"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // prevent initial unnecessary render of RichTextEditor
                    if (!_isEqual(values.description, value)) {
                      setFieldValue("description", value, true)
                    }
                  }}
                  onHandleBlur={() => {
                    // validation will be done by setFieldValue
                    setFieldTouched("description", true, false)
                  }}
                  widget={
                    <RichTextEditor
                      className="description"
                      placeholder={
                        Settings.fields.position.description?.placeholder
                      }
                    />
                  }
                />
                {edit && attachmentEditEnabled && (
                  <Field
                    name="uploadAttachments"
                    label="Attachments"
                    component={FieldHelper.SpecialField}
                    widget={
                      <UploadAttachment
                        attachments={attachmentList}
                        updateAttachments={setAttachmentList}
                        relatedObjectType={Position.relatedObjectType}
                        relatedObjectUuid={values.uuid}
                      />
                    }
                    onHandleBlur={() => {
                      setFieldTouched("uploadAttachments", true, false)
                    }}
                  />
                )}
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
                />
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
  function save(values, form, force) {
    const position = new Position(values).filterClientSideFields(
      "previousPeople",
      "customFields",
      "responsibleTasks"
    )

    position.type = position.permissions || Position.TYPE.REGULAR
    // Remove permissions property, was added temporarily in order to be able
    // to select a specific advisor type.
    delete position.permissions
    position.location = utils.getReference(position.location)
    position.organization = utils.getReference(position.organization)
    position.person = utils.getReference(position.person)
    position.code = position.code || null // Need to null out empty position codes
    position.customFields = customFieldsJSONString(values)

    return API.mutation(edit ? GQL_UPDATE_POSITION : GQL_CREATE_POSITION, {
      position,
      force
    })
  }

  async function checkPotentialDuplicates(positionName) {
    if (!edit && positionName.length >= MIN_CHARS_FOR_DUPLICATES) {
      const positionQuery = {
        pageSize: 1,
        text: positionName
      }
      try {
        const response = await API.query(GQL_GET_POSITION_COUNT, {
          positionQuery
        })
        setError(null)
        setShowSimilarPositionsMessage(response?.positionList.totalCount > 0)
      } catch (error) {
        setError(error)
        setShowSimilarPositionsMessage(false)
        jumpToTop()
      }
    } else {
      setError(null)
      setShowSimilarPositionsMessage(false)
    }
  }
}

export default PositionForm
