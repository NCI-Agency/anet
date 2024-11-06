import { gql } from "@apollo/client"
import API from "api"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model, { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import _isEmpty from "lodash/isEmpty"
import _isEqualWith from "lodash/isEqualWith"
import { Position } from "models"
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react"
import {
  Button,
  Col,
  Container,
  FormGroup,
  Modal,
  Row,
  Table
} from "react-bootstrap"
import POSITIONS_ICON from "resources/positions.png"
import { RECURSE_STRATEGY } from "searchUtils"
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

interface AssignPositionModalProps {
  person: any
  showModal?: boolean
  onCancel: (...args: unknown[]) => unknown
  onSuccess: (...args: unknown[]) => unknown
}

const AssignPositionModal = ({
  person,
  showModal,
  onCancel,
  onSuccess
}: AssignPositionModalProps) => {
  const { currentUser } = useContext(AppContext)
  const latestPersonProp = useRef(person)
  const personPropUnchanged = _isEqualWith(
    latestPersonProp.current,
    person,
    utils.treatFunctionsAsEqual
  )

  const [error, setError] = useState(null)
  const [position, setPosition] = useState(person && person.position)
  const [doSave, setDoSave] = useState(false)
  const [removeUser, setRemoveUser] = useState(false)

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
          This position is currently held by{" "}
          <b>
            <LinkTo modelType="Person" model={position.person} isLink={false} />
          </b>
          . By selecting this position, they will be removed.
          {person.position.type !== position.type ? (
            <>
              {" "}
              Permissions of the{" "}
              <b>
                <LinkTo modelType="Position" model={position} isLink={false} />
              </b>{" "}
              position will be converted from{" "}
              <b>{Position.convertType(position.type)}</b> to{" "}
              <b>{Position.convertType(person.position.type)}</b>.
              {person.position.type !== Position.TYPE.REGULAR && (
                <>
                  {" "}
                  Furthermore, permissions of the
                  <b>{person.position.name}</b> position will be converted from{" "}
                  <b>{Position.convertType(person.position.type)}</b> to{" "}
                  <b>{Settings.fields.regular.position.type}</b>.
                </>
              )}
            </>
          ) : (
            person.position.type !== Position.TYPE.REGULAR && (
              <>
                {" "}
                Permissions of the <b>{person.position.name}</b> position will
                be converted from{" "}
                <b>{Position.convertType(person.position.type)}</b> to{" "}
                <b>{Settings.fields.regular.position.type}</b>.
              </>
            )
          )}
        </>
      )
      newError = { message: errorMessage }
    } else if (
      position !== null &&
      position.name !== person.position.name &&
      _isEmpty(position.person) &&
      !_isEmpty(person.position) &&
      person.position.type !== Position.TYPE.REGULAR
    ) {
      const errorMessage = (
        <>
          Permissions of the <b>{person.position.name}</b> position will be
          converted from <b>{Position.convertType(person.position.type)}</b> to{" "}
          <b>{Settings.fields.regular.position.type}</b>
          {person.position.type !== Position.TYPE.REGULAR ? (
            <>
              {" "}
              and permissions of the <b>{position.name}</b> position will be
              converted to <b>{Position.convertType(person.position.type)}</b>.
            </>
          ) : (
            <>.</>
          )}
        </>
      )
      newError = { message: errorMessage }
    } else if (
      !Position.isRegular(latestPersonProp.current.position) &&
      !_isEmpty(person.position) &&
      (removeUser || !position)
    ) {
      const errorMessage = (
        <>
          If you save, permissions of the <b>{person.position.name}</b> position
          will be converted from{" "}
          <b>{Position.convertType(person.position.type)}</b> to{" "}
          <b>{Settings.fields.regular.position.type}</b>.
        </>
      )
      newError = { message: errorMessage }
    }
    setError(newError)
  }, [position, person, removeUser])

  const newPosition = position ? new Position(position) : new Position()

  const positionSearchQuery = {
    status: Model.STATUS.ACTIVE,
    type: [Position.TYPE.REGULAR]
  }
  if (currentUser.isAdmin()) {
    // only admins can put people in admin billets.
    positionSearchQuery.type.push(Position.TYPE.ADMINISTRATOR)
    positionSearchQuery.type.push(Position.TYPE.SUPERUSER)
  } else if (currentUser.isSuperuser()) {
    // Only superusers can put people in superuser billets
    positionSearchQuery.type.push(Position.TYPE.SUPERUSER)
    // Superusers are limited to their organizations
    const administratingOrgUuids =
      currentUser.position.organizationsAdministrated.map(org => org.uuid)
    positionSearchQuery.organizationUuid = [...administratingOrgUuids]
    positionSearchQuery.orgRecurseStrategy = RECURSE_STRATEGY.CHILDREN
  }
  const positionsFilters = {
    allPositions: {
      label: "All",
      queryVars: positionSearchQuery
    }
  }

  return (
    <Modal centered show={showModal} onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>
          Set Position for{" "}
          <LinkTo modelType="Person" model={person} isLink={false} />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {person.position.uuid && (
          <div style={{ textAlign: "center" }}>
            {!removeUser && (
              <>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (Position.isRegular(latestPersonProp.current.position)) {
                      setPosition(null)
                      setDoSave(true)
                    } else {
                      setRemoveUser(true)
                      setPosition(person.position)
                    }
                  }}
                  className="remove-person-from-position"
                >
                  Remove{" "}
                  <LinkTo modelType="Person" model={person} isLink={false} />{" "}
                  from{" "}
                  <LinkTo
                    modelType="Position"
                    model={person.position}
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
                    fields={`uuid name code type organization { uuid shortName longName identificationCode} person { uuid name rank ${GRAPHQL_ENTITY_AVATAR_FIELDS} }`}
                    addon={POSITIONS_ICON}
                    vertical
                  />
                </FormGroup>
              </Col>
            </Row>
            {newPosition.uuid && (
              <Table striped hover responsive>
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
          </Container>
        )}
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        <Button
          onClick={() => {
            removeUser ? setRemoveUser(false) : closeModal()
          }}
          variant="outline-secondary"
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (removeUser || !position) {
              setPosition(null)
              setDoSave(true)
            } else if (
              position.person !== undefined &&
              position.person !== null &&
              position.person !== latestPersonProp.current.name
            ) {
              setDoSave(true)
            } else {
              closeModal()
            }
            setRemoveUser(false)
          }}
          variant="primary"
        >
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  )

  function closeModal() {
    // Reset state before closing (cancel)
    setPosition(person.position)
    setRemoveUser(false)
    onCancel()
  }
}

export default AssignPositionModal
