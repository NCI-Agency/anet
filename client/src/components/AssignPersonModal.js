import API from "api"
import { gql } from "apollo-boost"
import { PersonSimpleOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model from "components/Model"
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

const AssignPersonModal = ({ position, showModal, onCancel, onSuccess }) => {
  const latestPositionProp = useRef(position)
  const positionPropUnchanged = _isEqualWith(
    latestPositionProp.current,
    position,
    utils.treatFunctionsAsEqual
  )

  const [error, setError] = useState(null)
  const [person, setPerson] = useState(position && position.person)
  const [doSave, setDoSave] = useState(false)
  const [removeUser, setRemoveUser] = useState(false)

  const save = useCallback(() => {
    let graphql, variables
    if (person === null) {
      !isAdvisor() && Position.downgradePermission(latestPositionProp.current)
      graphql = GQL_DELETE_PERSON_FROM_POSITION
      variables = {
        uuid: position.uuid
      }
    } else {
      Position.carryPermission(latestPositionProp.current, person)
      Position.downgradePermission(person.position)
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
    if (!positionPropUnchanged) {
      latestPositionProp.current = position
      setPerson(position && position.person)
    }
  }, [positionPropUnchanged, position])

  useEffect(() => {
    if (doSave) {
      setDoSave(false)
      save()
    }
  }, [doSave, save])

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
    } else if (!isAdvisor() && (removeUser || !person)) {
      const errorMessage = (
        <>
          If you save, type of the <b>{position.name}</b> position is going to
          be converted to <b>{Position.TYPE.ADVISOR}</b>.
        </>
      )
      newError = { message: errorMessage }
    }
    setError(newError)
  }, [person, position.uuid, position.name, removeUser])

  const personSearchQuery = {
    status: Model.STATUS.ACTIVE,
    pendingVerification: false,
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
          Set Person for{" "}
          <LinkTo modelType="Position" model={position} isLink={false} />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {position.person.uuid && (
          <div style={{ textAlign: "center" }}>
            {!removeUser && (
              <>
                <Button
                  bsStyle="danger"
                  onClick={() => {
                    if (isAdvisor()) {
                      setPerson(null)
                      setDoSave(true)
                    } else {
                      setRemoveUser(true)
                      setPerson(position.person)
                    }
                  }}
                >
                  Remove{" "}
                  <LinkTo
                    modelType="Person"
                    model={position.person}
                    isLink={false}
                  />{" "}
                  from{" "}
                  <LinkTo
                    modelType="Position"
                    model={position}
                    isLink={false}
                  />
                </Button>
                <hr className="assignModalSplit" />
              </>
            )}
            {removeUser && <Messages error={error} />}
          </div>
        )}
        {!removeUser && (
          <Grid fluid>
            <Row>
              <Col md={12}>
                <FormGroup controlId="person" required>
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
                    fields="uuid, name, rank, role, avatar(size: 32), position { uuid, name, type, organization {uuid} }"
                    addon={PEOPLE_ICON}
                    vertical
                  />
                </FormGroup>
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
            {<Messages error={error} />}
          </Grid>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          className="pull-left"
          onClick={() => {
            removeUser ? setRemoveUser(false) : closeModal()
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (removeUser) {
              setPerson(null)
              setDoSave(true)
              setRemoveUser(false)
            } else if (!person) {
              setPerson(null)
              setDoSave(true)
              setRemoveUser(false)
            } else {
              save()
              setRemoveUser(false)
            }
          }}
          bsStyle="primary"
          className="save-button"
          type="submit"
        >
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  )

  function isAdvisor() {
    return latestPositionProp.current.type === Position.TYPE.ADVISOR
  }

  function closeModal() {
    // Reset state before closing (cancel)
    setPerson(position.person)
    setRemoveUser(false)
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
