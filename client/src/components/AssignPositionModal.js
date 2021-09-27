import { gql } from "@apollo/client"
import API from "api"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import _isEqualWith from "lodash/isEqualWith"
import { Person, Position } from "models"
import PropTypes from "prop-types"
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
  mutation($uuid: String!) {
    deletePersonFromPosition(uuid: $uuid)
  }
`

const GQL_PUT_PERSON_IN_POSITION = gql`
  mutation($uuid: String!, $person: PersonInput!) {
    putPersonInPosition(uuid: $uuid, person: $person)
  }
`

const AssignPositionModal = ({ person, showModal, onCancel, onSuccess }) => {
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
          <LinkTo modelType="Person" model={position.person} />. By selecting
          this position, they will be removed.
          {person.position.type !== position.type ? (
            <>
              {" "}
              Permissions of the <b>{position.name}</b> position will be
              converted from <b>{Position.convertType(position.type)}</b> to{" "}
              <b>{Position.convertType(person.position.type)}</b>.
              {person.position.type !== Position.TYPE.ADVISOR && (
                <>
                  {" "}
                  Furthermore, permissions of the
                  <b>{person.position.name}</b> position will be converted from{" "}
                  <b>{Position.convertType(person.position.type)}</b> to{" "}
                  <b>{Settings.fields.advisor.position.type}</b>.
                </>
              )}
            </>
          ) : (
            person.position.type !== Position.TYPE.ADVISOR &&
            person.position.type !== Position.TYPE.PRINCIPAL && (
              <>
                {" "}
                Permissions of the <b>{person.position.name}</b> position will
                be converted from{" "}
                <b>{Position.convertType(person.position.type)}</b> to{" "}
                <b>{Settings.fields.advisor.position.type}</b>.
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
      person.position.type !== Position.TYPE.ADVISOR &&
      person.position.type !== Position.TYPE.PRINCIPAL
    ) {
      const errorMessage = (
        <>
          Permissions of the <b>{person.position.name}</b> position will be
          converted from <b>{Position.convertType(person.position.type)}</b> to{" "}
          <b>{Settings.fields.advisor.position.type}</b>
          {person.position.type !== Position.TYPE.ADVISOR ? (
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
      !Position.isAdvisor(latestPersonProp.current.position) &&
      !Position.isPrincipal(latestPersonProp.current.position) &&
      !_isEmpty(person.position) &&
      (removeUser || !position)
    ) {
      const errorMessage = (
        <>
          If you save, permissions of the <b>{person.position.name}</b> position
          will be converted from{" "}
          <b>{Position.convertType(person.position.type)}</b> to{" "}
          <b>{Settings.fields.advisor.position.type}</b>.
        </>
      )
      newError = { message: errorMessage }
    }
    setError(newError)
  }, [position, person, removeUser])

  const newPosition = position ? new Position(position) : new Position()

  const positionSearchQuery = { status: Model.STATUS.ACTIVE }
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
                    if (
                      Position.isAdvisor(latestPersonProp.current.position) ||
                      Position.isPrincipal(latestPersonProp.current.position)
                    ) {
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
                    fields="uuid name code type organization { uuid shortName longName identificationCode} person { uuid name rank role avatar(size: 32) }"
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
            {<Messages error={error} />}
          </Container>
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
AssignPositionModal.propTypes = {
  person: PropTypes.instanceOf(Person).isRequired,
  showModal: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
}

export default AssignPositionModal
