import { gqlEntityFieldsMap } from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import RemoveButton from "components/RemoveButton"
import { FastField, Form, Formik } from "formik"
import { Person, Position } from "models"
import React, { useContext, useState } from "react"
import { Button, Col, Container, Modal, Row, Table } from "react-bootstrap"
import POSITIONS_ICON from "resources/positions.png"
import { RECURSE_STRATEGY } from "searchUtils"

const GQL_UPDATE_ASSOCIATED_POSITION = gql`
  mutation ($position: PositionInput!) {
    updateAssociatedPosition(position: $position)
  }
`

interface AssociatedPositionsTableProps {
  onDelete?: (...args: unknown[]) => unknown
  associatedPositions?: any[]
}

const AssociatedPositionsTable = ({
  associatedPositions,
  onDelete
}: AssociatedPositionsTableProps) => (
  <Table striped hover responsive>
    <thead>
      <tr>
        <th>Name</th>
        <th>Position</th>
        <th>Organization</th>
        <th />
      </tr>
    </thead>
    <tbody>
      {Position.map(associatedPositions, relPos => {
        const person = new Person(relPos.person)
        return (
          <tr key={relPos.uuid}>
            <td>
              <LinkTo modelType="Person" model={person} isLink={false} />
            </td>
            <td>
              <LinkTo modelType="Position" model={relPos} isLink={false} />
            </td>
            <td>
              <LinkTo
                modelType="Organization"
                model={relPos.organization}
                isLink={false}
              />
            </td>
            <td>
              <RemoveButton
                title="Unassign person"
                onClick={() => onDelete(relPos)}
              />
            </td>
          </tr>
        )
      })}
    </tbody>
  </Table>
)

interface EditAssociatedPositionsModalProps {
  position: any
  showModal?: boolean
  onCancel: (...args: unknown[]) => unknown
  onSuccess: (...args: unknown[]) => unknown
}

const EditAssociatedPositionsModal = ({
  position,
  showModal,
  onCancel,
  onSuccess
}: EditAssociatedPositionsModalProps) => {
  const { currentUser } = useContext(AppContext)
  const [error, setError] = useState(null)

  const positionSearchQuery = {
    matchPersonName: true
  }
  if (currentUser.isAdmin() === false) {
    // Superusers can only assign a position in their organization!
    positionSearchQuery.organizationUuid =
      currentUser.position.organization.uuid
    positionSearchQuery.orgRecurseStrategy = RECURSE_STRATEGY.CHILDREN
  }
  const positionsFilters = {
    allPositions: {
      label: "All",
      queryVars: positionSearchQuery
    }
  }

  return (
    <Formik enableReinitialize onSubmit={onSubmit} initialValues={position}>
      {({ setFieldValue, values, submitForm }) => (
        <Modal centered show={showModal} onHide={() => close(setFieldValue)}>
          <Modal.Header closeButton>
            <Modal.Title>Modify assigned counterparts</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Messages error={error} />
            <Form className="form-horizontal" method="post">
              <Container fluid>
                <Row>
                  <Col md={12}>
                    <FastField
                      name="associatedPositions"
                      label="Associated positions"
                      component={FieldHelper.SpecialField}
                      onChange={value =>
                        setFieldValue("associatedPositions", value)
                      }
                      vertical
                      widget={
                        <AdvancedMultiSelect
                          fieldName="associatedPositions"
                          placeholder="Search for a counterpart position…"
                          value={values.associatedPositions}
                          renderSelected={
                            <AssociatedPositionsTable
                              associatedPositions={values.associatedPositions}
                            />
                          }
                          overlayColumns={[
                            "Position",
                            "Organization",
                            "Current Occupant"
                          ]}
                          overlayRenderRow={PositionOverlayRow}
                          filterDefs={positionsFilters}
                          objectType={Position}
                          fields={`${gqlEntityFieldsMap.Position} person { ${gqlEntityFieldsMap.Person} } organization { ${gqlEntityFieldsMap.Organization} }`}
                          addon={POSITIONS_ICON}
                        />
                      }
                    />
                  </Col>
                </Row>
              </Container>
            </Form>
          </Modal.Body>
          <Modal.Footer className="justify-content-between">
            <Button
              onClick={() => close(setFieldValue)}
              variant="outline-secondary"
            >
              Cancel
            </Button>
            <Button onClick={submitForm} variant="primary">
              Save
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Formik>
  )

  function close(setFieldValue) {
    // Reset state before closing (cancel)
    setError(null)
    setFieldValue("associatedPositions", position.associatedPositions)
    onCancel()
  }

  function onSubmit(values, form) {
    return save(values, form)
      .then(onSuccess)
      .catch(error => {
        form.setSubmitting(false)
        setError(error)
      })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
  function save(values, form) {
    const newPosition = new Position(values).filterClientSideFields(
      "previousPeople",
      "person",
      "responsibleTasks"
    )
    return API.mutation(GQL_UPDATE_ASSOCIATED_POSITION, {
      position: newPosition
    })
  }
}

export default EditAssociatedPositionsModal
