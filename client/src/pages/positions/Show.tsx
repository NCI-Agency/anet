import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import AssignPersonModal from "components/AssignPersonModal"
import AssociatedPositions from "components/AssociatedPositions"
import AttachmentsDetailView from "components/Attachment/AttachmentsDetailView"
import AuthorizationGroupTable from "components/AuthorizationGroupTable"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import ConfirmDestructive from "components/ConfirmDestructive"
import { ReadonlyCustomFields } from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import EditAssociatedPositionsModal from "components/EditAssociatedPositionsModal"
import EditHistory from "components/EditHistory"
import EditOrganizationsAdministratedModal from "components/EditOrganizationsAdministratedModal"
import EmailAddressTable from "components/EmailAddressTable"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import FindObjectsButton from "components/FindObjectsButton"
import GuidedTour from "components/GuidedTour"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model, { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import OrganizationTable from "components/OrganizationTable"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RelatedObjectNotes from "components/RelatedObjectNotes"
import RichTextEditor from "components/RichTextEditor"
import { Attachment, Location, Position } from "models"
import { positionTour } from "pages/GuidedTour"
import React, { useContext, useEffect, useState } from "react"
import { Badge, Button, Col, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import PreviousPeople from "./PreviousPeople"

const GQL_GET_POSITION = gql`
  query($uuid: String!) {
    position(uuid: $uuid) {
      ${Position.allFieldsQuery}
      authorizationGroups {
        uuid
        name
        description
      }
      attachments {
        ${Attachment.basicFieldsQuery}
      }
    }
  }
`
const GQL_DELETE_POSITION = gql`
  mutation ($uuid: String!) {
    deletePosition(uuid: $uuid)
  }
`

const GQL_UPDATE_PREVIOUS_PEOPLE = gql`
  mutation ($position: PositionInput!) {
    updatePositionHistory(position: $position)
  }
`

interface PositionShowProps {
  pageDispatchers?: PageDispatchersPropType
}

const PositionShow = ({ pageDispatchers }: PositionShowProps) => {
  const { currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [showAssignPersonModal, setShowAssignPersonModal] = useState(false)
  const [showAssociatedPositionsModal, setShowAssociatedPositionsModal] =
    useState(false)
  const [showEditHistoryModal, setShowEditHistoryModal] = useState(false)
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const [stateError, setStateError] = useState(
    routerLocation.state && routerLocation.state.error
  )
  const [attachments, setAttachments] = useState([])
  const [
    showOrganizationsAdministratedModal,
    setShowOrganizationsAdministratedModal
  ] = useState(false)
  const { uuid } = useParams()
  const { loading, error, data, refetch } = API.useApiQuery(GQL_GET_POSITION, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Position",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(data?.position?.name)
  useEffect(() => {
    setAttachments(data?.position?.attachments || [])
  }, [data])
  if (done) {
    return result
  }

  if (data) {
    data.position[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.position.customFields
    )
  }

  const position = new Position(data ? data.position : {})

  const isSuperuser = position.type === Position.TYPE.SUPERUSER
  const isAdmin = currentUser?.isAdmin()
  const canEdit =
    // Admins can edit anybody
    isAdmin ||
    // Superusers can edit positions if they have administrative permissions for the organization of the position
    (position?.organization?.uuid &&
      currentUser.hasAdministrativePermissionsForOrganization(
        position.organization
      ))
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled
  const avatar =
    attachments?.some(a => a.uuid === position?.entityAvatar?.attachmentUuid) &&
    position.entityAvatar
  const canDelete =
    isAdmin &&
    position.status === Model.STATUS.INACTIVE &&
    position.uuid &&
    (!position.person || !position.person.uuid)

  const searchText = [position.name, position.code].join(" ")
  const action = (
    <>
      {isAdmin && (
        <Link
          id="mergeWithOther"
          to="/admin/merge/positions"
          state={{ initialLeftUuid: position.uuid }}
          className="btn btn-outline-secondary"
        >
          Merge with other position
        </Link>
      )}
      {canEdit && (
        <LinkTo
          modelType="Position"
          model={position}
          edit
          button="primary"
          className="edit-position"
        >
          Edit
        </LinkTo>
      )}
      <FindObjectsButton objectLabel="Position" searchText={searchText} />
      <RelatedObjectNotes
        notes={position.notes}
        relatedObject={
          position.uuid && {
            relatedObjectType: Position.relatedObjectType,
            relatedObjectUuid: position.uuid,
            relatedObject: position
          }
        }
      />
    </>
  )

  return (
    <div>
      <div className="float-end">
        <GuidedTour
          title="Take a guided tour of this position's page."
          tour={positionTour}
          autostart={
            localStorage.newUser === "true" &&
            localStorage.hasSeenPositionTour !== "true"
          }
          onEnd={() => (localStorage.hasSeenPositionTour = "true")}
        />
      </div>

      <Messages success={stateSuccess} error={stateError} />
      <div className="form-horizontal">
        <Fieldset
          id="info"
          title={
            <>
              {
                <SubscriptionIcon
                  subscribedObjectType="positions"
                  subscribedObjectUuid={position.uuid}
                  isSubscribed={position.isSubscribed}
                  updatedAt={position.updatedAt}
                  refetch={refetch}
                  setError={error => {
                    setStateError(error)
                    jumpToTop()
                  }}
                  persistent
                />
              }{" "}
              Position {position.name}
            </>
          }
          action={action}
        />
        <Fieldset>
          <Row>
            <Col sm={12} md={12} lg={4} xl={3} className="text-center">
              <EntityAvatarDisplay
                avatar={avatar}
                defaultAvatar={Position.relatedObjectType}
              />
            </Col>
            <Col
              lg={8}
              xl={9}
              className="d-flex flex-column justify-content-center"
            >
              <DictionaryField
                wrappedComponent={FieldHelper.ReadonlyField}
                dictProps={Settings.fields.position.type}
                field={{ name: "type" }}
                humanValue={Position.humanNameOfType(position.type)}
              />
              {position.type === Position.TYPE.SUPERUSER && (
                <DictionaryField
                  wrappedComponent={FieldHelper.ReadonlyField}
                  dictProps={Settings.fields.position.superuserType}
                  field={{ name: "superuserType" }}
                  humanValue={Position.humanNameOfSuperuserType(
                    position.superuserType
                  )}
                />
              )}

              {position.organization && (
                <DictionaryField
                  wrappedComponent={FieldHelper.ReadonlyField}
                  dictProps={Settings.fields.position.organization}
                  field={{ name: "organization" }}
                  humanValue={
                    position.organization && (
                      <LinkTo
                        modelType="Organization"
                        model={position.organization}
                      />
                    )
                  }
                />
              )}

              <DictionaryField
                wrappedComponent={FieldHelper.ReadonlyField}
                dictProps={Settings.fields.position.location}
                field={{ name: "location" }}
                humanValue={
                  position.location && (
                    <>
                      <LinkTo modelType="Location" model={position.location} />{" "}
                      <Badge>
                        {Location.humanNameOfType(position.location.type)}
                      </Badge>
                    </>
                  )
                }
              />
            </Col>
          </Row>
        </Fieldset>
        <Fieldset id="info" title="Additional Information">
          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.position.code}
            field={{ name: "code", value: position.code }}
          />

          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.position.emailAddresses}
            field={{ name: "emailAddresses" }}
            humanValue={
              <EmailAddressTable
                label={Settings.fields.position.emailAddresses.label}
                emailAddresses={position.emailAddresses}
              />
            }
          />

          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.position.authorizationGroups}
            field={{ name: "authorizationGroups" }}
            humanValue={
              <AuthorizationGroupTable
                authorizationGroups={position.authorizationGroups}
                showDistributionList
                showForSensitiveInformation
              />
            }
          />

          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.position.status}
            field={{ name: "status" }}
            humanValue={Position.humanNameOfStatus(position.status)}
          />

          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.position.role}
            field={{ name: "role" }}
            humanValue={Position.humanNameOfRole(position.role)}
          />

          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.position.description}
            field={{ name: "description" }}
            humanValue={
              <RichTextEditor readOnly value={position.description} />
            }
          />
          {attachmentsEnabled && (
            <FieldHelper.ReadonlyField
              field={{ name: "attachments" }}
              label="Attachments"
              humanValue={
                <AttachmentsDetailView
                  attachments={attachments}
                  updateAttachments={setAttachments}
                  relatedObjectType={Position.relatedObjectType}
                  relatedObjectUuid={position.uuid}
                  allowEdit={canEdit}
                />
              }
            />
          )}
        </Fieldset>

        {Settings.fields.position.customFields && (
          <Fieldset title="Position information" id="custom-fields">
            <ReadonlyCustomFields
              fieldsConfig={Settings.fields.position.customFields}
              values={position}
            />
          </Fieldset>
        )}

        <Fieldset
          title="Current person holding this position"
          id="assigned-person"
          className={
            !position.person || !position.person.uuid ? "warning" : undefined
          }
          style={{ textAlign: "center" }}
          action={
            position.person &&
            position.person.uuid &&
            canEdit && (
              <Button
                onClick={() => setShowAssignPersonModal(true)}
                variant="outline-secondary"
                className="change-current-person"
              >
                Change current person
              </Button>
            )
          }
        >
          {position.person && position.person.uuid ? (
            <div>
              <h4 className="assigned-person-name">
                <LinkTo modelType="Person" model={position.person} />
              </h4>
              <p />
            </div>
          ) : (
            <div>
              <p className="position-empty-message">
                <em>{position.name} is currently empty.</em>
              </p>
              {canEdit && (
                <p>
                  <Button
                    onClick={() => setShowAssignPersonModal(true)}
                    variant="outline-secondary"
                    className="assign-current-person"
                  >
                    Assign current person
                  </Button>
                </p>
              )}
            </div>
          )}
          <AssignPersonModal
            position={position}
            showModal={showAssignPersonModal}
            onCancel={() => hideAssignPersonModal(false)}
            onSuccess={() => hideAssignPersonModal(true)}
          />
        </Fieldset>

        <Fieldset
          title="Assigned counterparts"
          id="assigned-counterpart"
          action={
            canEdit && (
              <Button
                onClick={() => setShowAssociatedPositionsModal(true)}
                variant="outline-secondary"
              >
                Change assigned counterparts
              </Button>
            )
          }
        >
          {(position.associatedPositions.length === 0 && (
            <em>{position.name} has no counterparts assigned</em>
          )) || (
            <AssociatedPositions
              associatedPositions={position.associatedPositions}
            />
          )}

          {canEdit && (
            <EditAssociatedPositionsModal
              position={position}
              showModal={showAssociatedPositionsModal}
              onCancel={() => hideAssociatedPositionsModal(false)}
              onSuccess={() => hideAssociatedPositionsModal(true)}
            />
          )}
        </Fieldset>

        <Fieldset
          title="Previous position holders"
          id="previous-people"
          action={
            canEdit && (
              <EditHistory
                mainTitle="Edit person history"
                history1={position.previousPeople}
                initialHistory={position.previousPeople}
                currentlyOccupyingEntity={position.person}
                midColTitle="New History"
                showEditButton
                parentEntityUuid1={position.uuid}
                showModal={showEditHistoryModal}
                setShowModal={setShowEditHistoryModal}
                setHistory={history => {
                  onSavePreviousPeople(history)
                }}
              />
            )
          }
        >
          <PreviousPeople history={position.previousPeople} />
        </Fieldset>
        {isSuperuser && (
          <Fieldset
            id="organizationsAdministrated"
            title={utils.sentenceCase(
              Settings.fields.position.organizationsAdministrated.label
            )}
            action={
              isAdmin && (
                <Button
                  onClick={() => setShowOrganizationsAdministratedModal(true)}
                  variant="outline-secondary"
                >
                  Edit{" "}
                  {utils.noCase(
                    Settings.fields.position.organizationsAdministrated.label
                  )}
                </Button>
              )
            }
          >
            <OrganizationTable
              organizations={position.organizationsAdministrated}
              noOrganizationsMessage="No organizations selected"
            />
            <EditOrganizationsAdministratedModal
              position={position}
              showModal={showOrganizationsAdministratedModal}
              onCancel={() => hideOrganizationsAdministratedModal(false)}
              onSuccess={() => hideOrganizationsAdministratedModal(true)}
            />
          </Fieldset>
        )}
      </div>

      {canDelete && (
        <div className="submit-buttons">
          <div>
            <ConfirmDestructive
              onConfirm={onConfirmDelete}
              objectType="position"
              objectDisplay={"#" + position.uuid}
              variant="danger"
              buttonLabel="Delete position"
              buttonClassName="float-end"
            />
          </div>
        </div>
      )}
    </div>
  )

  function hideAssignPersonModal(success) {
    setShowAssignPersonModal(false)
    if (success) {
      refetch()
    }
  }

  function hideAssociatedPositionsModal(success) {
    setShowAssociatedPositionsModal(false)
    if (success) {
      refetch()
    }
  }

  function hideOrganizationsAdministratedModal(success) {
    setShowOrganizationsAdministratedModal(false)
    if (success) {
      refetch()
    }
  }

  function onConfirmDelete() {
    const { uuid } = position
    API.mutation(GQL_DELETE_POSITION, { uuid })
      .then(() => {
        navigate("/", { state: { success: "Position deleted" } })
      })
      .catch(error => {
        setStateError(error)
        jumpToTop()
      })
  }

  function onSavePreviousPeople(history) {
    const newPosition = position.filterClientSideFields()
    newPosition.previousPeople = history
    API.mutation(GQL_UPDATE_PREVIOUS_PEOPLE, { position: newPosition })
      .then(refetch)
      .catch(error => {
        setStateError(error)
        jumpToTop()
      })
  }
}

export default connect(null, mapPageDispatchersToProps)(PositionShow)
