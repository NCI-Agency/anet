import API, { Settings } from "api"
import AppContext from "components/AppContext"
import AssignPersonModal from "components/AssignPersonModal"
import ConfirmDelete from "components/ConfirmDelete"
import EditAssociatedPositionsModal from "components/EditAssociatedPositionsModal"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import GuidedTour from "components/GuidedTour"
import LinkTo from "components/LinkTo"
import Messages, { setMessages } from "components/Messages"
import Page, {
  jumpToTop,
  mapDispatchToProps,
  propTypes as pagePropTypes
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
import React from "react"
import { Button, Table } from "react-bootstrap"
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"

class BasePositionShow extends Page {
  static propTypes = {
    ...pagePropTypes,
    currentUser: PropTypes.instanceOf(Person)
  }

  static modelName = "Position"

  CodeFieldWithLabel = DictionaryField(Field)
  state = {
    position: new Position(),
    success: null,
    error: null,
    showAssignPersonModal: false,
    showAssociatedPositionModal: false
  }

  constructor(props) {
    super(props)
    setMessages(props, this.state)
  }

  fetchData(props) {
    return API.query(
      /* GraphQL */ `
      position(uuid:"${props.match.params.uuid}") {
        uuid, name, type, status, code,
        organization { uuid, shortName, longName, identificationCode },
        person { uuid, name, rank, role },
        associatedPositions {
          uuid, name, type
          person { uuid, name, rank, role }
          organization { uuid, shortName }
        },
        previousPeople { startTime, endTime, person { uuid, name, rank, role }}
        location { uuid, name }
        ${GRAPHQL_NOTES_FIELDS}
      }
    `
    ).then(data => this.setState({ position: new Position(data.position) }))
  }

  render() {
    const { position } = this.state
    const { currentUser, ...myFormProps } = this.props

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
      (position.uuid && (!position.person || !position.person.uuid))

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
              <Messages success={this.state.success} error={this.state.error} />
              <Form className="form-horizontal" method="post">
                <Fieldset title={`Position ${position.name}`} action={action} />
                <Fieldset>
                  <Field
                    name="name"
                    component={FieldHelper.renderReadonlyField}
                    label={Settings.fields.position.name}
                  />

                  <this.CodeFieldWithLabel
                    dictProps={positionSettings.code}
                    name="code"
                    component={FieldHelper.renderReadonlyField}
                  />

                  <Field
                    name="type"
                    component={FieldHelper.renderReadonlyField}
                    humanValue={Position.humanNameOfType}
                  />

                  <Field
                    name="status"
                    component={FieldHelper.renderReadonlyField}
                    humanValue={Position.humanNameOfStatus}
                  />

                  {position.organization && (
                    <Field
                      name="organization"
                      component={FieldHelper.renderReadonlyField}
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
                    component={FieldHelper.renderReadonlyField}
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
                      <Button onClick={this.showAssignPersonModal}>
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
                            onClick={this.showAssignPersonModal}
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
                    showModal={this.state.showAssignPersonModal}
                    onCancel={() => this.hideAssignPersonModal(false)}
                    onSuccess={() => this.hideAssignPersonModal(true)}
                  />
                </Fieldset>

                <Fieldset
                  title={`Assigned ${assignedRole}`}
                  id="assigned-principal"
                  action={
                    canEdit && (
                      <Button onClick={this.showAssociatedPositionModal}>
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
                        this.renderAssociatedPositionRow(pos, idx)
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
                      showModal={this.state.showAssociatedPositionModal}
                      onCancel={() => this.hideAssociatedPositionsModal(false)}
                      onSuccess={() => this.hideAssociatedPositionsModal(true)}
                    />
                  )}
                </Fieldset>

                <Fieldset
                  title="Previous position holders"
                  id="previous-people"
                >
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
                      onConfirmDelete={this.onConfirmDelete}
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
  }

  renderAssociatedPositionRow = (pos, idx) => {
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

  showAssignPersonModal = () => {
    this.setState({ showAssignPersonModal: true })
  }

  hideAssignPersonModal = success => {
    this.setState({ showAssignPersonModal: false })
    if (success) {
      this.fetchData(this.props)
    }
  }

  showAssociatedPositionModal = () => {
    this.setState({ showAssociatedPositionModal: true })
  }

  hideAssociatedPositionsModal = success => {
    this.setState({ showAssociatedPositionModal: false })
    if (success) {
      this.fetchData(this.props)
    }
  }

  onConfirmDelete = () => {
    const operation = "deletePosition"
    let graphql = /* GraphQL */ operation + "(uuid: $uuid)"
    const variables = { uuid: this.state.position.uuid }
    const variableDef = "($uuid: String!)"
    API.mutation(graphql, variables, variableDef)
      .then(data => {
        this.props.history.push({
          pathname: "/",
          state: { success: "Position deleted" }
        })
      })
      .catch(error => {
        this.setState({ success: null, error: error })
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

export default connect(
  null,
  mapDispatchToProps
)(withRouter(PositionShow))
