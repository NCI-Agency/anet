import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import AssignPersonModal from "components/AssignPersonModal"
import AssociatedPositions from "components/AssociatedPositions"
import AuthorizationGroupTable from "components/AuthorizationGroupTable"
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
import { Field, Form, Formik } from "formik"
import { Location, Position } from "models"
import { positionTour } from "pages/HopscotchTour"
import React, { useContext, useState } from "react"
import { Badge, Button } from "react-bootstrap"
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
  const canDelete =
    isAdmin &&
    position.status === Model.STATUS.INACTIVE &&
    position.uuid &&
    (!position.person || !position.person.uuid)

  return (
    <Formik enableReinitialize initialValues={position}>
      {({ values }) => {
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
            <Form className="form-horizontal" method="post">
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
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.position.type}
                  name="type"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Position.humanNameOfType}
                />

                {position.organization && (
                  <DictionaryField
                    wrappedComponent={Field}
                    dictProps={Settings.fields.position.organization}
                    name="organization"
                    component={FieldHelper.ReadonlyField}
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
                  wrappedComponent={Field}
                  dictProps={Settings.fields.position.location}
                  name="location"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    position.location && (
                      <>
                        <LinkTo
                          modelType="Location"
                          model={position.location}
                        />{" "}
                        <Badge>
                          {Location.humanNameOfType(position.location.type)}
                        </Badge>
                      </>
                    )
                  }
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.position.code}
                  name="code"
                  component={FieldHelper.ReadonlyField}
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.position.emailAddresses}
                  name="emailAddresses"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    <EmailAddressTable
                      label={Settings.fields.position.emailAddresses.label}
                      emailAddresses={position.emailAddresses}
                    />
                  }
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.position.authorizationGroups}
                  name="authorizationGroups"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    <AuthorizationGroupTable
                      authorizationGroups={position.authorizationGroups}
                    />
                  }
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.position.status}
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Position.humanNameOfStatus}
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.position.role}
                  name="role"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Position.humanNameOfRole}
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.position.description}
                  name="description"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    <RichTextEditor readOnly value={position.description} />
                  }
                />
              </Fieldset>

              {Settings.fields.position.customFields && (
                <Fieldset title="Position information" id="custom-fields">
                  <ReadonlyCustomFields
                    fieldsConfig={Settings.fields.position.customFields}
                    values={values}
                  />
                </Fieldset>
              )}

              <Fieldset
                title="Current assigned person"
                id="assigned-person"
                className={
                  !position.person || !position.person.uuid
                    ? "warning"
                    : undefined
                }
                style={{ textAlign: "center" }}
                action={
                  position.person &&
                  position.person.uuid &&
                  canEdit && (
                    <Button
                      onClick={() => setShowAssignPersonModal(true)}
                      variant="outline-secondary"
                    >
                      Change assigned person
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
                          className="change-assigned-person"
                        >
                          Change assigned person
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
                title={`Assigned ${Settings.fields.regular.person.name}`}
                id="assigned-counterpart"
                action={
                  canEdit && (
                    <Button
                      onClick={() => setShowAssociatedPositionsModal(true)}
                      variant="outline-secondary"
                    >
                      Change assigned {Settings.fields.regular.person.name}
                    </Button>
                  )
                }
              >
                <AssociatedPositions
                  associatedPositions={position.associatedPositions}
                />
                {position.associatedPositions.length === 0 && (
                  <em>
                    {position.name} has no associated{" "}
                    {Settings.fields.regular.person.name}
                  </em>
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
                        onClick={() =>
                          setShowOrganizationsAdministratedModal(true)}
                        variant="outline-secondary"
                      >
                        Edit{" "}
                        {utils.noCase(
                          Settings.fields.position.organizationsAdministrated
                            .label
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
            </Form>

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
      }}
    </Formik>
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
      .then(data => {
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
      .then(data => refetch())
      .catch(error => {
        setStateError(error)
        jumpToTop()
      })
  }
}

export default connect(null, mapPageDispatchersToProps)(PositionShow)
