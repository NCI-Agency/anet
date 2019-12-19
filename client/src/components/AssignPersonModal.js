import API from "api"
import { gql } from "apollo-boost"
import { PersonSimpleOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import _isEmpty from "lodash/isEmpty"
import _isEqualWith from "lodash/isEqualWith"
import { Person, Position } from "models"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"
import { Button, Col, Grid, Modal, Row, Table } from "react-bootstrap"
import PEOPLE_ICON from "resources/people.png"
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

const AssignPersonModal = props => {
  const { position, showModal, onCancel, onSuccess } = props

  const latestPositionProp = useRef(position)
  const positionPropUnchanged = _isEqualWith(
    latestPositionProp.current,
    position,
    utils.treatFunctionsAsEqual
  )

  const [error, setError] = useState(null)
  const [person, setPerson] = useState(position && position.person)

  useEffect(() => {
    if (!positionPropUnchanged) {
      latestPositionProp.current = position
      setPerson(position && position.person)
    }
  }, [positionPropUnchanged, position])

  useEffect(() => {
    let newError = null
    if (
      !_isEmpty(person) &&
      !_isEmpty(person.position) &&
      person.position.uuid !== position.uuid
    ) {
      const errorMessage = (
        <>
          This person is currently in another position. By selecting this
          person, <b>{person.position.name}</b> will be left unfilled.
        </>
      )
      newError = { message: errorMessage }
    }
    setError(newError)
  }, [person, position.uuid])

  const personSearchQuery = {
    status: [Person.STATUS.ACTIVE],
    role:
      position.type === Position.TYPE.PRINCIPAL
        ? Person.ROLE.PRINCIPAL
        : Person.ROLE.ADVISOR
  }
  const personFilters = {
    allPersons: {
      label: "All",
      queryVars: personSearchQuery
    }
  }

  return (
    <Modal show={showModal} onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>
          Set Person for <LinkTo position={position} isLink={false} />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {position.person.uuid && (
          <div style={{ textAlign: "center" }}>
            <Button bsStyle="danger" onClick={() => setPerson(null)}>
              Remove <LinkTo person={position.person} isLink={false} /> from{" "}
              <LinkTo position={position} isLink={false} />
            </Button>
            <hr className="assignModalSplit" />
          </div>
        )}
        <Grid fluid>
          <Row>
            <Col md={12}>
              <AdvancedSingleSelect
                fieldName="person"
                fieldLabel="Select a person"
                placeholder="Select a person for this position"
                value={person}
                overlayColumns={["Name"]}
                overlayRenderRow={PersonSimpleOverlayRow}
                filterDefs={personFilters}
                onChange={value => setPerson(value)}
                objectType={Person}
                valueKey="name"
                fields="uuid, name, rank, role, avatar(size: 32), position { uuid, name, type }"
                addon={PEOPLE_ICON}
                vertical
              />
            </Col>
          </Row>
          {person && person.uuid && (
            <Table striped condensed hover responsive>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Current Position</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{person.rank}</td>
                  <td>{person.name}</td>
                  <td>
                    {person.position ? (
                      person.position.name
                    ) : person.uuid === position.person.uuid ? (
                      position.name
                    ) : (
                      <i>None</i>
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
        <Button onClick={save} bsStyle="primary" className="save-button">
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  )

  function save() {
    let graphql, variables
    if (person === null) {
      graphql = GQL_DELETE_PERSON_FROM_POSITION
      variables = {
        uuid: position.uuid
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
  }

  function closeModal() {
    // Reset state before closing (cancel)
    setPerson(position.person)
    onCancel()
  }
}
AssignPersonModal.propTypes = {
  position: PropTypes.instanceOf(Position).isRequired,
  showModal: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
}

export default AssignPersonModal
