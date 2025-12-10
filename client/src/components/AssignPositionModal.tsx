import { gqlEntityFieldsMap } from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
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
  mutation (
    $uuid: String!
    $person: PersonInput!
    $primary: Boolean
    $previousPositionUuid: String
  ) {
    putPersonInPosition(
      uuid: $uuid
      person: $person
      primary: $primary
      previousPositionUuid: $previousPositionUuid
    )
  }
`

interface AssignPositionModalProps {
  person: any
  currentPosition: any
  primary?: boolean
  showModal?: boolean
  onCancel: (...args: unknown[]) => unknown
  onSuccess: (...args: unknown[]) => unknown
}

const AssignPositionModal = ({
  person,
  currentPosition,
  primary = true,
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
  const [position, setPosition] = useState(currentPosition)
  useEffect(() => {
    setPosition(currentPosition)
  }, [currentPosition])

  const [removeUser, setRemoveUser] = useState(false)

  const save = useCallback(
    (position = null, primary = false) => {
      let graphql, variables
      if (position === null) {
        graphql = GQL_DELETE_PERSON_FROM_POSITION
        variables = {
          uuid: currentPosition?.uuid
        }
      } else {
        graphql = GQL_PUT_PERSON_IN_POSITION
        variables = {
          uuid: position.uuid,
          person: { uuid: latestPersonProp.current.uuid },
          primary,
          previousPositionUuid: currentPosition?.uuid
        }
      }
      API.mutation(graphql, variables).then(onSuccess).catch(setError)
    },
    [currentPosition, onSuccess]
  )

  useEffect(() => {
    if (!personPropUnchanged) {
      latestPersonProp.current = person
      setPosition(currentPosition)
    }
  }, [personPropUnchanged, person, currentPosition])

  useEffect(() => {
    const personWillBeRemoved = (
      <li>
        This position is currently held by{" "}
        <b>
          <LinkTo modelType="Person" model={position?.person} isLink={false} />
        </b>
        . By selecting this position, they will be removed.
      </li>
    )
    const permissionsWillBeConvertedToRegularType = (
      <li>
        Permissions of the <b>{currentPosition?.name}</b> position will be
        converted from <b>{Position.convertType(currentPosition?.type)}</b> to{" "}
        <b>{Settings.fields.regular.position.type}</b>.
      </li>
    )
    const permissionsWillBeConvertedFromOldTypeToCurrentType = (
      <li>
        Permissions of the{" "}
        <b>
          <LinkTo modelType="Position" model={position} isLink={false} />
        </b>{" "}
        position will be converted from{" "}
        <b>{Position.convertType(position?.type)}</b> to{" "}
        <b>{Position.convertType(currentPosition?.type)}</b>.{" "}
      </li>
    )
    const permissionsWillBeConvertedToCurrentPositionType = (
      <li>
        Permissions of the <b>{position?.name}</b> position will be converted to{" "}
        <b>{Position.convertType(currentPosition?.type)}</b>.
      </li>
    )

    let errorMessage
    const positionOccupiedByDifferentPerson =
      !_isEmpty(position?.person) &&
      position.person.uuid !== latestPersonProp.current.uuid
    if (positionOccupiedByDifferentPerson) {
      errorMessage = personWillBeRemoved
    }

    if (primary && !_isEmpty(currentPosition)) {
      if (positionOccupiedByDifferentPerson) {
        if (!Position.isRegular(currentPosition)) {
          errorMessage = (
            <>
              {errorMessage}
              {permissionsWillBeConvertedToRegularType}
            </>
          )
        }
        if (currentPosition.type !== position.type) {
          errorMessage = (
            <>
              {errorMessage}
              {permissionsWillBeConvertedFromOldTypeToCurrentType}
            </>
          )
        }
      } else if (
        !!position &&
        position.uuid !== currentPosition?.uuid &&
        _isEmpty(position.person) &&
        !Position.isRegular(currentPosition)
      ) {
        errorMessage = permissionsWillBeConvertedToRegularType
        if (!Position.isRegular(currentPosition)) {
          errorMessage = (
            <>
              {errorMessage}
              {permissionsWillBeConvertedToCurrentPositionType}
            </>
          )
        }
      } else if (
        !Position.isRegular(currentPosition) &&
        (removeUser || !position)
      ) {
        errorMessage = <>{permissionsWillBeConvertedToRegularType}</>
      }
    }

    setError(errorMessage ? { message: <ul>{errorMessage}</ul> } : null)
  }, [position, currentPosition, primary, removeUser])

  const newPosition = position ? new Position(position) : new Position()

  const positionSearchQuery = {
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
    <Modal backdrop="static" centered show={showModal} onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>
          Set position for{" "}
          <LinkTo
            modelType="Person"
            model={person}
            isLink={false}
            showAvatar={false}
            showIcon={false}
          />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {currentPosition?.uuid && (
          <div style={{ textAlign: "center" }}>
            {!removeUser && (
              <>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (!primary || Position.isRegular(currentPosition)) {
                      setPosition(null)
                      save()
                    } else {
                      setRemoveUser(true)
                      setPosition(currentPosition)
                    }
                  }}
                  className="remove-person-from-position"
                >
                  Remove{" "}
                  <LinkTo modelType="Person" model={person} isLink={false} />{" "}
                  from{" "}
                  <LinkTo
                    modelType="Position"
                    model={currentPosition}
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
                    fields={`${gqlEntityFieldsMap.Position} type organization { ${gqlEntityFieldsMap.Organization} } person { ${gqlEntityFieldsMap.Person} }`}
                    addon={POSITIONS_ICON}
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
                      ) : newPosition.uuid === currentPosition?.uuid ? (
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
            if (removeUser || !position) {
              setPosition(null)
              save()
            } else {
              save(position, primary)
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
    setPosition(currentPosition)
    setRemoveUser(false)
    setError(null)
    onCancel()
  }
}

export default AssignPositionModal
