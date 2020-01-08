import API from "api"
import { gql } from "apollo-boost"
import autobind from "autobind-decorator"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import _isEmpty from "lodash/isEmpty"
import { Person, Position } from "models"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Button, Col, Grid, Modal, Row, Table } from "react-bootstrap"
import POSITIONS_ICON from "resources/positions.png"

const GQL_DELETE_PERSON_FROM_POSITION = gql`
  mutation($uuid: String!) {
    deletePersonFromPosition(uuid: $uuid)
  }
`
const GQL_PUT_PERSON_IN_POSITION = gql`
  mutation($uuid: String!, $person: PersonInput!) {
    putPersonInPosition(uuid: $uuid, person: $person)
  }
`

class BaseAssignPositionModal extends Component {
  static propTypes = {
    person: PropTypes.instanceOf(Person).isRequired,
    showModal: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    currentUser: PropTypes.instanceOf(Person)
  }

  constructor(props) {
    super(props)
    this.state = {
      error: null,
      position: props.person && props.person.position
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.person.position !== this.props.person.position) {
      this.setState({ position: this.props.person.position }, () =>
        this.updateAlert()
      )
    }
  }

  render() {
    const { person, currentUser } = this.props
    const newPosition = this.state.position
      ? new Position(this.state.position)
      : new Position()

    const positionSearchQuery = { status: Position.STATUS.ACTIVE }
    if (person.role === Person.ROLE.ADVISOR) {
      positionSearchQuery.type = [Position.TYPE.ADVISOR]
      if (currentUser.isAdmin()) {
        // only admins can put people in admin billets.
        positionSearchQuery.type.push(Position.TYPE.ADMINISTRATOR)
        positionSearchQuery.type.push(Position.TYPE.SUPER_USER)
      } else if (currentUser.isSuperUser()) {
        // Only super users can put people in super user billets
        // And they are limited to their organization.
        positionSearchQuery.type.push(Position.TYPE.SUPER_USER)
        positionSearchQuery.organizationUuid =
          currentUser.position.organization.uuid
        positionSearchQuery.includeChildrenOrgs = true
      }
    } else if (person.role === Person.ROLE.PRINCIPAL) {
      positionSearchQuery.type = [Position.TYPE.PRINCIPAL]
    }
    const positionsFilters = {
      allAdvisorPositions: {
        label: "All",
        queryVars: positionSearchQuery
      }
    }

    return (
      <Modal show={this.props.showModal} onHide={this.close}>
        <Modal.Header closeButton>
          <Modal.Title>
            Set Position for <LinkTo person={person} isLink={false} />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {person.position.uuid && (
            <div style={{ textAlign: "center" }}>
              <Button
                bsStyle="danger"
                onClick={this.remove}
                className="remove-person-from-position"
              >
                Remove <LinkTo person={person} isLink={false} /> from{" "}
                <LinkTo position={person.position} isLink={false} />
              </Button>
              <hr className="assignModalSplit" />
            </div>
          )}
          <Grid fluid>
            <Row>
              <Col md={12}>
                <AdvancedSingleSelect
                  fieldName="position"
                  fieldLabel="Select a position"
                  placeholder="Select a position for this person"
                  value={this.state.position}
                  overlayColumns={[
                    "Position",
                    "Organization",
                    "Current Occupant"
                  ]}
                  overlayRenderRow={PositionOverlayRow}
                  filterDefs={positionsFilters}
                  onChange={this.handlePositionChange}
                  objectType={Position}
                  valueKey="name"
                  fields="uuid, name, code, type, organization { uuid, shortName, longName, identificationCode}, person { uuid, name, rank, role, avatar(size: 32) }"
                  addon={POSITIONS_ICON}
                  vertical
                />
              </Col>
            </Row>
            {newPosition && newPosition.uuid && (
              <Table striped condensed hover responsive>
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Type</th>
                    <th>Current Person</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{newPosition.organization.shortName}</td>
                    <td>{newPosition.humanNameOfType()}</td>
                    <td>
                      {newPosition.person ? (
                        newPosition.person.name
                      ) : newPosition.uuid === person.position.uuid ? (
                        person.name
                      ) : (
                        <i>Unfilled</i>
                      )}
                    </td>
                  </tr>
                </tbody>
              </Table>
            )}
            <Messages error={this.state.error} />
          </Grid>
        </Modal.Body>
        <Modal.Footer>
          <Button className="pull-left" onClick={this.close}>
            Cancel
          </Button>
          <Button onClick={this.save} bsStyle="primary">
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }

  @autobind
  remove() {
    this.setState({ position: null }, () => this.save())
  }

  @autobind
  save() {
    let graphql, variables
    if (this.state.position === null) {
      graphql = GQL_DELETE_PERSON_FROM_POSITION
      variables = {
        uuid: this.props.person.position.uuid
      }
    } else {
      graphql = GQL_PUT_PERSON_IN_POSITION
      variables = {
        uuid: this.state.position.uuid,
        person: { uuid: this.props.person.uuid }
      }
    }
    API.mutation(graphql, variables)
      .then(data => this.props.onSuccess())
      .catch(error => {
        this.setState({ error: error })
      })
  }

  @autobind
  close() {
    // Reset state before closing (cancel)
    this.setState({ position: this.props.person.position }, () =>
      this.updateAlert()
    )
    this.props.onCancel()
  }

  @autobind
  handlePositionChange(position) {
    this.setState({ position }, () => this.updateAlert())
  }

  @autobind
  updateAlert() {
    let error = null
    if (
      !_isEmpty(this.state.position) &&
      !_isEmpty(this.state.position.person) &&
      this.state.position.person.uuid !== this.props.person.uuid
    ) {
      const errorMessage = (
        <>
          This position is currently held by{" "}
          <LinkTo person={this.state.position.person} />. By selecting this
          position, they will be removed.
        </>
      )
      error = { message: errorMessage }
    }
    this.setState({ error: error })
  }
}

const AssignPositionModal = props => (
  <AppContext.Consumer>
    {context => (
      <BaseAssignPositionModal currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default AssignPositionModal
