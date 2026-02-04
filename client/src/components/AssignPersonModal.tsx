import { gqlEntityFieldsMap } from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import { PersonSimpleOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
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
  mutation ($uuid: String!, $person: PersonInput!, $primary: Boolean) {
    putPersonInPosition(uuid: $uuid, person: $person, primary: $primary)
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
  const [person, setPerson] = useState(position?.person)
  const [removeUser, setRemoveUser] = useState(false)

  const save = useCallback(
    (person = null, primary = false) => {
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
          person: { uuid: person.uuid },
          primary
        }
      }
      API.mutation(graphql, variables).then(onSuccess).catch(setError)
    },
    [position, onSuccess]
  )

  useEffect(() => {
    if (!positionPropUnchanged) {
      latestPositionProp.current = position
      setPerson(position?.person)
    }
  }, [positionPropUnchanged, position])

  useEffect(() => {
    const personWillBeRemoved = (
      <>
        <b>
          <LinkTo modelType="Person" model={person} isLink={false} />
        </b>{" "}
        is currently assigned to the{" "}
        <b>
          <LinkTo
            modelType="Position"
            model={person?.position}
            isLink={false}
          />
        </b>{" "}
        position. By saving them as primary, their primary position will be left
        unfilled
      </>
    )
    const permissionsWillBeConvertedToRegularType = (
      <>
        and the position's permissions will be converted from{" "}
        <b>{Position.convertType(person?.position?.type)}</b> to{" "}
        <b>{Settings.fields.regular.position.type}</b>.
      </>
    )
    const permissionsWillBeConvertedFromOldTypeToCurrentType = (
      <>
        Furthermore, permissions of the <b>{position?.name}</b> position will be
        converted from <b>{Position.convertType(position?.type)}</b> to{" "}
        <b>{Position.convertType(person?.position?.type)}</b>.
      </>
    )
    const positionPermissionsWillBeConvertedToRegularType = (
      <>
        If you save, permissions of the <b>{position.name}</b> position will be
        converted from <b>{Position.convertType(position.type)}</b> to{" "}
        <b>{Settings.fields.regular.position.type}</b>.
      </>
    )

    let errorMessage
    if (
      !_isEmpty(person) &&
      !_isEmpty(person.position) &&
      person.position.uuid !== position.uuid
    ) {
      errorMessage = (
        <>
          {personWillBeRemoved}
          {!Position.isRegular(person.position) ? (
            <>
              {" "}
              {permissionsWillBeConvertedToRegularType}
              {position.type !== person.position.type && (
                <> {permissionsWillBeConvertedFromOldTypeToCurrentType}</>
              )}{" "}
              <b>You can also save as an additional position.</b>
            </>
          ) : (
            <>.</>
          )}
        </>
      )
    } else if (
      !Position.isRegular(latestPositionProp.current) &&
      (removeUser || !person)
    ) {
      errorMessage = positionPermissionsWillBeConvertedToRegularType
    }

    setError(errorMessage ? { message: errorMessage } : null)
  }, [person, position, removeUser])

  const personFilters = {
    allPersons: {
      label: "All",
      queryVars: {
        pendingVerification: false
      }
    }
  }

  return (
    <Modal backdrop="static" centered show={showModal} onHide={closeModal}>
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
                      save()
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
                    fields={`${gqlEntityFieldsMap.Person} position { ${gqlEntityFieldsMap.Position} type organization { uuid } }`}
                    addon={PEOPLE_ICON}
                  />
                </FormGroup>
              </Col>
            </Row>
            {person?.uuid && (
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Current Primary Position</th>
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
        {!_isEmpty(person?.position) && (
          <Button
            onClick={() => {
              if (removeUser || !person) {
                setPerson(null)
                save()
              } else if (
                person.uuid !== latestPositionProp.current.person.uuid
              ) {
                save(person, false)
              } else {
                closeModal()
              }
              setRemoveUser(false)
            }}
            variant="primary"
            className="save-button"
            type="submit"
          >
            Assign as secondary position
          </Button>
        )}
        <Button
          onClick={() => {
            if (removeUser || !person) {
              setPerson(null)
              save(null, false)
            } else if (person.uuid !== latestPositionProp.current.person.uuid) {
              save(person, true)
            } else {
              closeModal()
            }
            setRemoveUser(false)
          }}
          variant="primary"
          className="save-button"
          type="submit"
        >
          {!_isEmpty(person?.position) ? "Assign as primary position" : "Save"}
        </Button>
      </Modal.Footer>
    </Modal>
  )

  function closeModal() {
    // Reset state before closing (cancel)
    setPerson(position.person)
    setRemoveUser(false)
    setError(null)
    onCancel()
  }
}

export default AssignPersonModal
