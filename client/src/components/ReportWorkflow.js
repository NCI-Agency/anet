import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"
import Settings from "settings"
import "./ReportWorkflow.css"

const ACTION_TYPE_DETAILS = {
  APPROVE: { text: "Approved", cssClass: "btn-success approved" },
  REJECT: { text: "Changes requested", cssClass: "btn-danger rejected" },
  SUBMIT: { text: "Submitted", cssClass: "btn-pending submitted" },
  PUBLISH: { text: "Published", cssClass: "btn-success published" },
  UNPUBLISH: { text: "Unpublished", cssClass: "btn-danger unpublished" },
  null: { text: "Pending", cssClass: "btn-pending default" }
}
const SYSTEM_USER = "system"

const ApprovalStepModalStatus = ({ action }) => {
  if (action.type) {
    const actionType = ACTION_TYPE_DETAILS[action.type]
    const cssClass = "badge " + actionType.cssClass
    return (
      <span className={cssClass}>
        {actionType.text} by{" "}
        <LinkTo
          modelType="Person"
          model={action.person}
          whenUnspecified={SYSTEM_USER}
          isLink={false}
        />{" "}
        on
        <small>
          {" "}
          {moment(action.createdAt).format(
            Settings.dateFormats.forms.displayShort.withTime
          )}
        </small>
      </span>
    )
  }
  return <span className="badge badge-pill pending">Pending</span>
}
ApprovalStepModalStatus.propTypes = {
  action: PropTypes.object.isRequired
}

const ApprovalStepModal = ({ action }) => {
  const [showModal, setShowModal] = useState(false)

  const step = action.step
  const noApprovers = _isEmpty(step.approvers)
  const actionTypeCss = noApprovers
    ? "btn-warning default"
    : ACTION_TYPE_DETAILS[action.type].cssClass

  return step ? (
    <>
      <Button
        className={actionTypeCss + " btn-sm"}
        onClick={() => setShowModal(true)}
        variant="default"
      >
        <span>{step.name}</span>
      </Button>
      <Modal centered show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Approvers for {step.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ul>
            {(noApprovers && "This step has no approvers!") ||
              step.approvers.map(position => (
                <li key={position.uuid}>
                  <LinkTo modelType="Position" model={position} /> -{" "}
                  <LinkTo modelType="Person" model={position.person} />
                </li>
              ))}
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <ApprovalStepModalStatus action={action} />
        </Modal.Footer>
      </Modal>
    </>
  ) : null
}
ApprovalStepModal.propTypes = {
  action: PropTypes.object.isRequired
}

export const ActionStatus = ({ action }) => (
  <div className="action-status">{ACTION_TYPE_DETAILS[action.type].text}</div>
)
ActionStatus.propTypes = {
  action: PropTypes.object.isRequired
}

export const ActionButton = ({ action }) => {
  const step = action.step
  const actionType = ACTION_TYPE_DETAILS[action.type]
  return step ? (
    <ApprovalStepModal action={action} />
  ) : (
    <Button
      className={actionType.cssClass + " btn-sm"}
      variant="outline-secondary"
      disabled
    >
      <span>
        <LinkTo
          modelType="Person"
          model={action.person}
          whenUnspecified={SYSTEM_USER}
          isLink={false}
        />
      </span>
    </Button>
  )
}
ActionButton.propTypes = {
  action: PropTypes.object.isRequired
}

const ActionDetails = ({ action }) => {
  if (action.type) {
    return (
      <div>
        <span>
          By{" "}
          <LinkTo
            modelType="Person"
            model={action.person}
            whenUnspecified={SYSTEM_USER}
          />
        </span>
        <br />
        <small>
          On{" "}
          {moment(action.createdAt).format(
            Settings.dateFormats.forms.displayShort.withTime
          )}
        </small>
      </div>
    )
  }
  return null
}
ActionDetails.propTypes = {
  action: PropTypes.object.isRequired
}

const ReportAction = ({ action }) => (
  <div className="workflow-action">
    <ActionStatus action={action} />
    <ActionButton action={action} />
    <ActionDetails action={action} />
  </div>
)
ReportAction.propTypes = {
  action: PropTypes.object.isRequired
}

const CompactReportAction = ({ action }) => (
  <div className="workflow-action">
    <ActionButton action={action} />
  </div>
)
CompactReportAction.propTypes = {
  action: PropTypes.object.isRequired
}

export const ReportFullWorkflow = ({ workflow }) => (
  <Fieldset id="workflow" className="workflow-fieldset" title="Workflow">
    {workflow.map(action => {
      const key = action.step
        ? `${action.createdAt}-${action.step.uuid}`
        : action.createdAt
      return <ReportAction action={action} key={key} />
    })}
  </Fieldset>
)
ReportFullWorkflow.propTypes = {
  workflow: PropTypes.array.isRequired
}

export const ReportCompactWorkflow = ({ workflow }) => (
  <Fieldset className="workflow-fieldset compact" title="Workflow">
    {workflow.map(action => {
      const key = action.step
        ? `${action.createdAt}-${action.step.uuid}`
        : action.createdAt
      return <CompactReportAction action={action} key={key} />
    })}
  </Fieldset>
)
ReportCompactWorkflow.propTypes = {
  workflow: PropTypes.array.isRequired
}
