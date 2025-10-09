import { gql } from "@apollo/client"
import API from "api"
import { PersonSimpleOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model, { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import _isEmpty from "lodash/isEmpty"
import _isEqualWith from "lodash/isEqualWith"
import { Person, Position } from "models"
import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Button,
  Col,
  Container,
  FormGroup,
  Modal,
  Row,
  Table
} from "react-bootstrap"
import PEOPLE_ICON from "resources/people.png"
import Settings from "settings"
import utils from "utils"

const GQL_DELETE_PERSON_FROM_POSITION = gql`
  mutation ($uuid: String!) {
    deletePersonFromPosition(uuid: $uuid)
  }
`

const GQL_PUT_PERSON_IN_POSITION = gql`
  mutation ($uuid: String!, $person: PersonInput!) {
    putPersonInPosition(uuid: $uuid, person: $person)
  }
`

interface AssignPersonModalProps {
  position: any
  showModal?: boolean
  onCancel: (...args: unknown[]) => unknown
  onSuccess: (...args: unknown[]) => unknown
}

const AssignPersonModal = ({
  position,
  showModal,
  onCancel,
  onSuccess
}: AssignPersonModalProps) => {
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
    API.mutation(graphql, variables).then(onSuccess).catch(setError)
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
          <b>
            <LinkTo modelType="Person" model={person} isLink={false} />
          </b>{" "}
          is currently assigned to the{" "}
          <b>
            <LinkTo
              modelType="Position"
              model={person.position}
              isLink={false}
            />
          </b>{" "}
          position. By selecting them, their current position will be left
          unfilled
          {person.position.type !== Position.TYPE.REGULAR ? (
            <>
              {" "}
              and the position's permissions will be converted from{" "}
              <b>{Position.convertType(person.position.type)}</b> to{" "}
              <b>{Settings.fields.regular.position.type}</b>.
            </>
          ) : (
            <>.</>
          )}
          {position.type !== person.position.type && (
            <>
              {" "}
              Furthermore, permissions of the <b>{position.name}</b> position
              will be converted from{" "}
              <b>{Position.convertType(position.type)}</b> to{" "}
              <b>{Position.convertType(person.position.type)}</b>.
            </>
          )}
        </>
      )
      newError = { message: errorMessage }
    } else if (
      !Position.isRegular(latestPositionProp.current) &&
      (removeUser || !person)
    ) {
      const errorMessage = (
        <>
          If you save, permissions of the <b>{position.name}</b> position will
          be converted from <b>{Position.convertType(position.type)}</b> to{" "}
          <b>{Settings.fields.regular.position.type}</b>.
        </>
      )
      newError = { message: errorMessage }
    }
    setError(newError)
  }, [person, position, removeUser])

  const personSearchQuery = {
    status: Model.STATUS.ACTIVE,
    pendingVerification: false
  }
  const personFilters = {
    allPersons: {
      label: "All",
      queryVars: personSearchQuery
    }
  }

  return (
    <Modal centered show={showModal} onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>
          Assign person to{" "}
          <LinkTo
            modelType="Position"
            model={position}
            isLink={false}
            showAvatar={false}
            showIcon={false}
          />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {position.person.uuid && (
          <div style={{ textAlign: "center" }}>
            {!removeUser && (
              <>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (Position.isRegular(latestPositionProp.current)) {
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
          <Container fluid>
            <Row>
              <Col md={12}>
                <FormGroup controlId="person" required>
                  <AdvancedSingleSelect
                    fieldName="person"
                    placeholder="Select a person for this position"
                    value={person}
                    overlayColumns={["Name"]}
                    overlayRenderRow={PersonSimpleOverlayRow}
                    filterDefs={personFilters}
                    onChange={value => setPerson(value)}
                    objectType={Person}
                    valueKey="name"
                    fields={`uuid name rank ${GRAPHQL_ENTITY_AVATAR_FIELDS} position { uuid name type organization {uuid} }`}
                    addon={PEOPLE_ICON}
                  />
                </FormGroup>
              </Col>
            </Row>
            {person && person.uuid && (
              <Table striped hover responsive>
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
          </Container>
        )}
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        <Button
          onClick={() => {
            if (removeUser) {
              setRemoveUser(false)
            } else {
              closeModal()
            }
          }}
          variant="outline-secondary"
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (removeUser || !person) {
              setPerson(null)
              setDoSave(true)
            } else if (person.uuid !== latestPositionProp.current.person.uuid) {
              setDoSave(true)
            } else {
              closeModal()
            }
            setRemoveUser(false)
          }}
          variant="primary"
          className="save-button"
          type="submit"
        >
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  )

  function closeModal() {
    // Reset state before closing (cancel)
    setPerson(position.person)
    setRemoveUser(false)
    onCancel()
  }
}

export default AssignPersonModal
