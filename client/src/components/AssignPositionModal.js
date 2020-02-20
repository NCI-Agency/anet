import API from "api"
import { gql } from "apollo-boost"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import _isEmpty from "lodash/isEmpty"
import _isEqualWith from "lodash/isEqualWith"
import { Person, Position } from "models"
import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Button,
  Col,
  FormGroup,
  Grid,
  Modal,
  Row,
  Table
} from "react-bootstrap"
import POSITIONS_ICON from "resources/positions.png"
import { RECURSE_STRATEGY } from "components/SearchFilters"
import utils from "utils"

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

const BaseAssignPositionModal = props => {
  const { person, currentUser, showModal, onCancel, onSuccess } = props

  const latestPersonProp = useRef(person)
  const personPropUnchanged = _isEqualWith(
    latestPersonProp.current,
    person,
    utils.treatFunctionsAsEqual
  )

  const [error, setError] = useState(null)
  const [position, setPosition] = useState(person && person.position)
  const [doSave, setDoSave] = useState(false)

  const save = useCallback(() => {
    let graphql, variables
    if (position === null) {
      graphql = GQL_DELETE_PERSON_FROM_POSITION
      variables = {
        uuid: person.position.uuid
      }
    } else {
      graphql = GQL_PUT_PERSON_IN_POSITION
      variables = {
        uuid: position.uuid,
        person: { uuid: person.uuid }
      }
    }
    API.mutation(graphql, variables)
      .then(data => onSuccess())
      .catch(error => {
        setError(error)
      })
  }, [position, person, onSuccess])

  useEffect(() => {
    if (!personPropUnchanged) {
      latestPersonProp.current = person
      setPosition(person && person.position)
    }
  }, [personPropUnchanged, person])

  useEffect(() => {
    if (doSave) {
      setDoSave(false)
      save()
    }
  }, [doSave, save])

  useEffect(() => {
    let newError = null
    if (
      !_isEmpty(position) &&
      !_isEmpty(position.person) &&
      position.person.uuid !== person.uuid
    ) {
      const errorMessage = (
        <>
          This position is currently held by <LinkTo person={position.person} />
          . By selecting this position, they will be removed.
        </>
      )
      newError = { message: errorMessage }
    }
    setError(newError)
  }, [position, person.uuid])

  const newPosition = position ? new Position(position) : new Position()

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
      positionSearchQuery.orgRecurseStrategy = RECURSE_STRATEGY.CHILDREN
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
    <Modal show={showModal} onHide={closeModal}>
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
              onClick={() => {
                setPosition(null)
                setDoSave(true)
              }}
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
              <FormGroup controlId="position">
                <AdvancedSingleSelect
                  fieldName="position"
                  fieldLabel="Select a position"
                  placeholder="Select a position for this person"
                  value={position}
                  overlayColumns={[
                    "Position",
                    "Organization",
                    "Current Occupant"
                  ]}
                  overlayRenderRow={PositionOverlayRow}
                  filterDefs={positionsFilters}
                  onChange={value => setPosition(value)}
                  objectType={Position}
                  valueKey="name"
                  fields="uuid, name, code, type, organization { uuid, shortName, longName, identificationCode}, person { uuid, name, rank, role, avatar(size: 32) }"
                  addon={POSITIONS_ICON}
                  vertical
                />
              </FormGroup>
            </Col>
          </Row>
          {newPosition.uuid && (
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
          <Messages error={error} />
        </Grid>
      </Modal.Body>
      <Modal.Footer>
        <Button className="pull-left" onClick={closeModal}>
          Cancel
        </Button>
        <Button onClick={save} bsStyle="primary">
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  )

  function closeModal() {
    // Reset state before closing (cancel)
    setPosition(person.position)
    onCancel()
  }
}

BaseAssignPositionModal.propTypes = {
  person: PropTypes.instanceOf(Person).isRequired,
  showModal: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  currentUser: PropTypes.instanceOf(Person)
}

const AssignPositionModal = props => (
  <AppContext.Consumer>
    {context => (
      <BaseAssignPositionModal currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default AssignPositionModal
