import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import RemoveButton from "components/RemoveButton"
import { FastField, Form, Formik } from "formik"
import { Person, Position } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Col, Grid, Modal, Row, Table } from "react-bootstrap"
import POSITIONS_ICON from "resources/positions.png"
import RECURSE_STRATEGY from "components/SearchFilters"

const GQL_UPDATE_ASSOCIATED_POSITION = gql`
  mutation($position: PositionInput!) {
    updateAssociatedPosition(position: $position)
  }
`

const AssociatedPositionsTable = ({ associatedPositions, onDelete }) => (
  <Table striped condensed hover responsive>
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
              <LinkTo person={person} isLink={false} />
            </td>
            <td>
              <LinkTo person={relPos} isLink={false} />
            </td>
            <td>
              <LinkTo organization={relPos.organization} isLink={false} />
            </td>
            <td>
              <RemoveButton
                title="Unassign person"
                handleOnClick={() => onDelete(relPos)}
              />
            </td>
          </tr>
        )
      })}
    </tbody>
  </Table>
)
AssociatedPositionsTable.propTypes = {
  onDelete: PropTypes.func,
  associatedPositions: PropTypes.array
}

const BaseEditAssociatedPositionsModal = ({
  position,
  showModal,
  onCancel,
  onSuccess,
  currentUser
}) => {
  const [error, setError] = useState(null)
  const assignedRole =
    position.type === Position.TYPE.PRINCIPAL
      ? Settings.fields.advisor.person.name
      : Settings.fields.principal.person.name
  const positionSearchQuery = {
    status: Position.STATUS.ACTIVE,
    matchPersonName: true
  }
  if (position.type === Position.TYPE.PRINCIPAL) {
    positionSearchQuery.type = [
      Position.TYPE.ADVISOR,
      Position.TYPE.SUPER_USER,
      Position.TYPE.ADMINISTRATOR
    ]
    if (currentUser.isAdmin() === false) {
      // Super Users can only assign a position in their organization!
      positionSearchQuery.organizationUuid =
        currentUser.position.organization.uuid
      positionSearchQuery.orgRecurseStrategy = RECURSE_STRATEGY.CHILDREN
    }
  } else {
    positionSearchQuery.type = [Position.TYPE.PRINCIPAL]
  }
  const positionsFilters = {
    allAdvisorPositions: {
      label: "All",
      queryVars: positionSearchQuery
    }
  }

  return (
    <Formik enableReinitialize onSubmit={onSubmit} initialValues={position}>
      {({ setFieldValue, values, submitForm }) => {
        return (
          <Modal show={showModal} onHide={close}>
            <Modal.Header closeButton>
              <Modal.Title>Modify assigned {assignedRole}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Messages error={error} />
              <Form className="form-horizontal" method="post">
                <Grid fluid>
                  <Row>
                    <Col md={12}>
                      <FastField
                        name="associatedPositions"
                        label="Associated positions"
                        component={FieldHelper.SpecialField}
                        onChange={value =>
                          setFieldValue("associatedPositions", value)}
                        vertical
                        widget={
                          <AdvancedMultiSelect
                            fieldName="associatedPositions"
                            placeholder={`Search for a ${assignedRole} position...`}
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
                            fields="uuid, name, code, type, person { uuid, name, rank, role, avatar(size: 32) }, organization { uuid, shortName, longName, identificationCode }"
                            addon={POSITIONS_ICON}
                          />
                        }
                      />
                    </Col>
                  </Row>
                </Grid>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button className="pull-left" onClick={close}>
                Cancel
              </Button>
              <Button onClick={submitForm} bsStyle="primary">
                Save
              </Button>
            </Modal.Footer>
          </Modal>
        )
      }}
    </Formik>
  )

  function close() {
    // Reset state before closing (cancel)
    setError(null)
    onCancel()
  }

  function onSubmit(values, form) {
    return save(values, form)
      .then(response => onSuccess())
      .catch(error => {
        form.setSubmitting(false)
        setError(error)
      })
  }

  function save(values, form) {
    const newPosition = new Position(position)
    newPosition.associatedPositions = values.associatedPositions
    delete newPosition.previousPeople
    delete newPosition.person // prevent any changes to person.
    return API.mutation(GQL_UPDATE_ASSOCIATED_POSITION, {
      position: newPosition
    })
  }
}
BaseEditAssociatedPositionsModal.propTypes = {
  position: PropTypes.object.isRequired,
  showModal: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  currentUser: PropTypes.instanceOf(Person)
}

const EditAssociatedPositionsModal = props => (
  <AppContext.Consumer>
    {context => (
      <BaseEditAssociatedPositionsModal
        currentUser={context.currentUser}
        {...props}
      />
    )}
  </AppContext.Consumer>
)

export default EditAssociatedPositionsModal
