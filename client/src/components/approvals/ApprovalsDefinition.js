import API from "api"
import { gql } from "apollo-boost"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { ApproverOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import { FastField, FieldArray } from "formik"
import { Position } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal, Table } from "react-bootstrap"
import REMOVE_ICON from "resources/delete.png"
import POSITIONS_ICON from "resources/positions.png"

const GQL_GET_APPROVAL_STEP_IN_USE = gql`
  query($uuid: String!) {
    approvalStepInUse(uuid: $uuid)
  }
`

const ApproverTable = ({ approvers, onDelete }) => (
  <Table striped condensed hover responsive>
    <thead>
      <tr>
        <th>Name</th>
        <th>Position</th>
        <th />
      </tr>
    </thead>
    <tbody>
      {approvers.map((approver, approverIndex) => (
        <tr key={approver.uuid}>
          <td>
            <LinkTo person={approver.person} target="_blank" />
          </td>
          <td>
            <LinkTo position={approver} target="_blank" />
          </td>
          <td onClick={() => onDelete(approver)}>
            <span style={{ cursor: "pointer" }}>
              <img src={REMOVE_ICON} height={14} alt="Remove approver" />
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </Table>
)
ApproverTable.propTypes = {
  approvers: PropTypes.array,
  onDelete: PropTypes.func
}

const ApprovalsDefinition = ({
  fieldName,
  values,
  title,
  addButtonLabel,
  approversFilters,
  setFieldTouched,
  setFieldValue
}) => {
  const [showAddApprovalStepAlert, setShowAddApprovalStepAlert] = useState(
    false
  )
  const [
    showRemoveApprovalStepAlert,
    setShowRemoveApprovalStepAlert
  ] = useState(false)

  return (
    <div>
      <Fieldset title={title}>
        <FieldArray
          name={fieldName}
          render={arrayHelpers => (
            <div>
              <Button
                className="pull-right"
                onClick={() => addApprovalStep(arrayHelpers, values[fieldName])}
                bsStyle="primary"
                id={`add${fieldName}Button`}
              >
                {addButtonLabel}
              </Button>
              <Modal
                show={showAddApprovalStepAlert}
                onHide={hideAddApprovalStepAlert}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Step not added</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  Please complete all approval steps; there already is an
                  approval step that is not completely filled in.
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    className="pull-right"
                    onClick={hideAddApprovalStepAlert}
                    bsStyle="primary"
                  >
                    OK
                  </Button>
                </Modal.Footer>
              </Modal>
              <Modal
                show={showRemoveApprovalStepAlert}
                onHide={hideRemoveApprovalStepAlert}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Step not removed</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  You cannot remove this step; it is being used in a report.
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    className="pull-right"
                    onClick={hideRemoveApprovalStepAlert}
                    bsStyle="primary"
                  >
                    OK
                  </Button>
                </Modal.Footer>
              </Modal>

              {values[fieldName].map((step, index) =>
                renderApprovalStep(
                  fieldName,
                  arrayHelpers,
                  setFieldValue,
                  setFieldTouched,
                  step,
                  index,
                  approversFilters
                )
              )}
            </div>
          )}
        />
      </Fieldset>
    </div>
  )

  function renderApprovalStep(
    fieldName,
    arrayHelpers,
    setFieldValue,
    setFieldTouched,
    step,
    index,
    approversFilters
  ) {
    const approvers = step.approvers

    return (
      <Fieldset title={`Step ${index + 1}`} key={index}>
        <Button
          className="pull-right"
          title="Remove this step"
          onClick={() => removeApprovalStep(arrayHelpers, index, step)}
        >
          <img src={REMOVE_ICON} height={14} alt="Remove this step" />
        </Button>

        <FastField
          name={`${fieldName}.${index}.name`}
          component={FieldHelper.InputField}
          label="Step name"
        />
        <FastField
          name={`${fieldName}.${index}.approvers`}
          label="Add an approver"
          component={FieldHelper.SpecialField}
          onChange={value => {
            // validation will be done by setFieldValue
            setFieldTouched(`${fieldName}.${index}.approvers`, true, false) // onBlur doesn't work when selecting an option
            setFieldValue(`${fieldName}.${index}.approvers`, value)
          }}
          widget={
            <AdvancedMultiSelect
              fieldName={`${fieldName}.${index}.approvers`}
              placeholder="Search for the approver's position..."
              value={approvers}
              renderSelected={<ApproverTable approvers={approvers} />}
              overlayColumns={["Name", "Position"]}
              overlayRenderRow={ApproverOverlayRow}
              filterDefs={approversFilters}
              objectType={Position}
              queryParams={{
                status: Position.STATUS.ACTIVE,
                type: [
                  Position.TYPE.ADVISOR,
                  Position.TYPE.SUPER_USER,
                  Position.TYPE.ADMINISTRATOR
                ],
                matchPersonName: true
              }}
              fields="uuid, name, code, type, person { uuid, name, rank, role, avatar(size: 32) }"
              addon={POSITIONS_ICON}
            />
          }
        />
      </Fieldset>
    )
  }

  function hideAddApprovalStepAlert() {
    setShowAddApprovalStepAlert(false)
  }

  function hideRemoveApprovalStepAlert() {
    setShowRemoveApprovalStepAlert(false)
  }

  function addApprovalStep(arrayHelpers, values) {
    const approvalSteps = values || []
    for (let i = 0; i < approvalSteps.length; i++) {
      const step = approvalSteps[i]
      if (!step.name || !step.approvers || step.approvers.length === 0) {
        setShowAddApprovalStepAlert(true)
        return
      }
    }
    arrayHelpers.push({ name: "", approvers: [] })
  }

  function removeApprovalStep(arrayHelpers, index, step) {
    if (!step.uuid) {
      // New, unsaved step
      arrayHelpers.remove(index)
      return
    }
    return API.query(GQL_GET_APPROVAL_STEP_IN_USE, { uuid: step.uuid }).then(
      data => {
        if (data.approvalStepInUse) {
          setShowRemoveApprovalStepAlert(true)
        } else {
          arrayHelpers.remove(index)
        }
      }
    )
  }
}
ApprovalsDefinition.propTypes = {
  fieldName: PropTypes.string.isRequired,
  title: PropTypes.string,
  addButtonLabel: PropTypes.string,
  values: PropTypes.object,
  approversFilters: PropTypes.object,
  setFieldTouched: PropTypes.func,
  setFieldValue: PropTypes.func
}

export default ApprovalsDefinition
