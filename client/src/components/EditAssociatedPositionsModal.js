import API, { Settings } from "api";
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect";
import AppContext from "components/AppContext";
import LinkTo from "components/LinkTo";
import Messages from "components/Messages";
import RemoveButton from "components/RemoveButton";
import { Form, Formik } from "formik";
import { Person, Position } from "models";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { Button, Col, Grid, Modal, Row, Table } from "react-bootstrap";
import POSITIONS_ICON from "resources/positions.png";

const PositionTable = ({associatedPositions, onDelete}) => (
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
              <td><LinkTo person={person} isLink={false} /></td>
              <td><LinkTo person={relPos} isLink={false} /></td>
              <td><LinkTo organization={relPos.organization} isLink={false} /></td>
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
)

class BaseEditAssociatedPositionsModal extends Component {
  static propTypes = {
    position: PropTypes.object.isRequired,
    showModal: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    currentUser: PropTypes.instanceOf(Person)
  }

  constructor(props) {
    super(props)
    this.state = {
      error: null
    }
  }

  render() {
    const { position, currentUser } = this.props
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
        positionSearchQuery.includeChildrenOrgs = true
      }
    } else {
      positionSearchQuery.type = [Position.TYPE.PRINCIPAL]
    }
    const positionsFilters = {
      allAdvisorPositions: {
        label: "All",
        searchQuery: true,
        queryVars: positionSearchQuery
      }
    }

    return (
      <Formik
        enableReinitialize
        onSubmit={this.onSubmit}
        initialValues={position}
      >
        {({ setFieldValue, values, submitForm }) => {
          return (
            <Modal show={this.props.showModal} onHide={this.close}>
              <Modal.Header closeButton>
                <Modal.Title>Modify assigned {assignedRole}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Messages error={this.state.error} />
                <Form className="form-horizontal" method="post">
                  <Grid fluid>
                    <Row>
                      <Col md={12}>
                        <AdvancedMultiSelect
                          fieldName="associatedPositions"
                          fieldLabel={null}
                          placeholder={`Search for a ${assignedRole} position...`}
                          value={values.associatedPositions}
                          renderSelected={
                            <PositionTable
                              associatedPositions={values.associatedPositions}
                            />
                          }
                          overlayColumns={["", "Person", "Position"]}
                          overlayRenderRow={this.renderPositionOverlayRow}
                          filterDefs={positionsFilters}
                          onChange={value =>
                            setFieldValue("associatedPositions", value)
                          }
                          objectType={Position}
                          fields="uuid, name, code, type, person { uuid, name, rank, role }, organization { uuid, shortName, longName, identificationCode }"
                          addon={POSITIONS_ICON}
                          vertical
                        />
                      </Col>
                    </Row>
                  </Grid>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button className="pull-left" onClick={this.close}>
                  Cancel
                </Button>
                <Button onClick={submitForm} bsStyle={"primary"}>
                  Save
                </Button>
              </Modal.Footer>
            </Modal>
          )
        }}
      </Formik>
    )
  }

  close = () => {
    // Reset state before closing (cancel)
    this.setState({
      error: null
    })
    this.props.onCancel()
  }

  onSubmit = (values, form) => {
    return this.save(values, form)
      .then(response => this.props.onSuccess())
      .catch(error => {
        this.setState({ error }, () => {
          form.setSubmitting(false)
        })
      })
  }

  save = (values, form) => {
    const position = new Position(this.props.position)
    position.associatedPositions = values.associatedPositions
    delete position.previousPeople
    delete position.person // prevent any changes to person.
    const graphql = "updateAssociatedPosition(position: $position)"
    const variables = { position: position }
    const variableDef = "($position: PositionInput!)"
    return API.mutation(graphql, variables, variableDef)
  }

  renderPositionOverlayRow = item => {
    return (
      <React.Fragment key={item.uuid}>
        <td>
          <LinkTo person={item.person} isLink={false} />
        </td>
        <td>
          <LinkTo position={item} isLink={false} />
        </td>
      </React.Fragment>
    )
  }
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
