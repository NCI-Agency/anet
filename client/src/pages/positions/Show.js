import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import AssignPersonModal from "components/AssignPersonModal"
import ConfirmDelete from "components/ConfirmDelete"
import EditAssociatedPositionsModal from "components/EditAssociatedPositionsModal"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import GuidedTour from "components/GuidedTour"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import {
  jumpToTop,
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { Field, Form, Formik } from "formik"
import DictionaryField from "HOC/DictionaryField"
import { Person, Position } from "models"
import moment from "moment"
import { positionTour } from "pages/HopscotchTour"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Table } from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory, useLocation, useParams } from "react-router-dom"

const GQL_GET_POSITION = gql`
  query($uuid: String!) {
    position(uuid: $uuid) {
      uuid
      name
      type
      status
      code
      organization {
        uuid
        shortName
        longName
        identificationCode
      }
      person {
        uuid
        name
        rank
        role
        avatar(size: 32)
      }
      associatedPositions {
        uuid
        name
        type
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
        organization {
          uuid
          shortName
        }
      }
      previousPeople {
        startTime
        endTime
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
      location {
        uuid
        name
      }
      ${GRAPHQL_NOTES_FIELDS}

    }
  }
`
const GQL_DELETE_POSITION = gql`
  mutation($uuid: String!) {
    deletePosition(uuid: $uuid)
  }
`

const BasePositionShow = props => {
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
    ...props
  })
  if (done) {
    return result
  }

  const position = new Position(data ? data.position : {})
  const { currentUser, ...myFormProps } = props
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
    position.status === Position.STATUS.INACTIVE &&
    position.uuid &&
    (!position.person || !position.person.uuid)

  return (
    <Formik enableReinitialize initialValues={position} {...myFormProps}>
      {({ values }) => {
        const action = canEdit && (
          <LinkTo
            position={position}
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
                  relatedObjectType: "positions",
                  relatedObjectUuid: position.uuid
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
                        <LinkTo organization={position.organization}>
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
                      <LinkTo anetLocation={position.location} />
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
                      <LinkTo person={position.person} />
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
                <Table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Position.map(position.associatedPositions, (pos, idx) =>
                      renderAssociatedPositionRow(pos, idx)
                    )}
                  </tbody>
                </Table>

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
                <Table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Dates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {position.previousPeople.map((pp, idx) => (
                      <tr key={idx} id={`previousPerson_${idx}`}>
                        <td>
                          <LinkTo person={pp.person} />
                        </td>
                        <td>
                          {moment(pp.startTime).format(
                            Settings.dateFormats.forms.displayShort.date
                          )}{" "}
                          - &nbsp;
                          {pp.endTime &&
                            moment(pp.endTime).format(
                              Settings.dateFormats.forms.displayShort.date
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Fieldset>
            </Form>

            {canDelete && (
              <div className="submit-buttons">
                <div>
                  <ConfirmDelete
                    onConfirmDelete={onConfirmDelete}
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

  function renderAssociatedPositionRow(pos, idx) {
    let personName
    if (!pos.person) {
      personName = "Unfilled"
    } else {
      personName = <LinkTo person={pos.person} />
    }
    return (
      <tr key={pos.uuid} id={`associatedPosition_${idx}`}>
        <td>{personName}</td>
        <td>
          <LinkTo position={pos} />
        </td>
      </tr>
    )
  }

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

const PositionShow = props => (
  <AppContext.Consumer>
    {context => (
      <BasePositionShow currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

BasePositionShow.propTypes = {
  ...pagePropTypes,
  currentUser: PropTypes.instanceOf(Person)
}

export default connect(null, mapDispatchToProps)(PositionShow)
