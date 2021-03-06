import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import AssignPersonModal from "components/AssignPersonModal"
import ConfirmDestructive from "components/ConfirmDestructive"
import { ReadonlyCustomFields } from "components/CustomFields"
import EditAssociatedPositionsModal from "components/EditAssociatedPositionsModal"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import GuidedTour from "components/GuidedTour"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model, { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import RelatedObjectNotes from "components/RelatedObjectNotes"
import { Field, Form, Formik } from "formik"
import DictionaryField from "HOC/DictionaryField"
import { Location, Position } from "models"
import { positionTour } from "pages/HopscotchTour"
import React, { useContext, useState } from "react"
import { Badge, Button } from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory, useLocation, useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import AssociatedPositions from "./AssociatedPositions"
import PreviousPeople from "./PreviousPeople"

const GQL_GET_POSITION = gql`
  query($uuid: String!) {
    position(uuid: $uuid) {
      ${Position.allFieldsQuery}
    }
  }
`
const GQL_DELETE_POSITION = gql`
  mutation($uuid: String!) {
    deletePosition(uuid: $uuid)
  }
`

const PositionShow = ({ pageDispatchers }) => {
  const { currentUser } = useContext(AppContext)
  const history = useHistory()
  const [showAssignPersonModal, setShowAssignPersonModal] = useState(false)
  const [
    showAssociatedPositionsModal,
    setShowAssociatedPositionsModal
  ] = useState(false)
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const [stateError, setStateError] = useState(
    routerLocation.state && routerLocation.state.error
  )
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
  if (done) {
    return result
  }

  if (data) {
    data.position[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.position.customFields
    )
  }

  const position = new Position(data ? data.position : {})
  const CodeFieldWithLabel = DictionaryField(Field)

  const isPrincipal = position.type === Position.TYPE.PRINCIPAL
  const assignedRole = isPrincipal
    ? Settings.fields.advisor.person.name
    : Settings.fields.principal.person.name
  const positionSettings = isPrincipal
    ? Settings.fields.principal.position
    : Settings.fields.advisor.position

  const canEdit =
    // Super Users can edit any Principal
    (currentUser.isSuperUser() && isPrincipal) ||
    // Admins can edit anybody
    currentUser.isAdmin() ||
    // Super users can edit positions within their own organization
    (position.organization &&
      position.organization.uuid &&
      currentUser.isSuperUserForOrg(position.organization))
  const canDelete =
    currentUser.isAdmin() &&
    position.status === Model.STATUS.INACTIVE &&
    position.uuid &&
    (!position.person || !position.person.uuid)

  return (
    <Formik enableReinitialize initialValues={position}>
      {({ values }) => {
        const action = canEdit && (
          <LinkTo
            modelType="Position"
            model={position}
            edit
            button="primary"
            className="edit-position"
          >
            Edit
          </LinkTo>
        )
        return (
          <div>
            <div className="pull-right">
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
            <Messages success={stateSuccess} error={stateError} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={`Position ${position.name}`} action={action} />
              <Fieldset>
                <Field
                  name="name"
                  component={FieldHelper.ReadonlyField}
                  label={Settings.fields.position.name}
                />

                <CodeFieldWithLabel
                  dictProps={positionSettings.code}
                  name="code"
                  component={FieldHelper.ReadonlyField}
                />

                <Field
                  name="type"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Position.humanNameOfType}
                />

                <Field
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Position.humanNameOfStatus}
                />

                {position.organization && (
                  <Field
                    name="organization"
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      position.organization && (
                        <LinkTo
                          modelType="Organization"
                          model={position.organization}
                        >
                          {position.organization.shortName}{" "}
                          {position.organization.longName}{" "}
                          {position.organization.identificationCode}
                        </LinkTo>
                      )
                    }
                  />
                )}

                <Field
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
              </Fieldset>

              <Fieldset
                title="Current assigned person"
                id="assigned-advisor"
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
                    <Button onClick={() => setShowAssignPersonModal(true)}>
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
                title={`Assigned ${assignedRole}`}
                id="assigned-principal"
                action={
                  canEdit && (
                    <Button
                      onClick={() => setShowAssociatedPositionsModal(true)}
                    >
                      Change assigned {assignedRole}
                    </Button>
                  )
                }
              >
                <AssociatedPositions
                  associatedPositions={position.associatedPositions}
                />
                {position.associatedPositions.length === 0 && (
                  <em>
                    {position.name} has no associated {assignedRole}
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

              <Fieldset title="Previous position holders" id="previous-people">
                <PreviousPeople history={position.previousPeople} />
              </Fieldset>
              {Settings.fields.position.customFields && (
                <Fieldset title="Position information" id="custom-fields">
                  <ReadonlyCustomFields
                    fieldsConfig={Settings.fields.position.customFields}
                    values={values}
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
                    bsStyle="warning"
                    buttonLabel="Delete position"
                    className="pull-right"
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

  function onConfirmDelete() {
    const { uuid } = position
    API.mutation(GQL_DELETE_POSITION, { uuid })
      .then(data => {
        history.push("/", { success: "Position deleted" })
      })
      .catch(error => {
        setStateError(error)
        jumpToTop()
      })
  }
}

PositionShow.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(PositionShow)
