import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"
import Settings from "settings"
import "./ReportWorkflow.css"

const ACTION_TYPE_DETAILS = {
  APPROVE: { text: "Approved", cssClass: "btn-success approved" },
  REJECT: { text: "Changes requested", cssClass: "btn-danger rejected" },
  SUBMIT: { text: "Submitted", cssClass: "btn-success submitted" },
  PUBLISH: { text: "Published", cssClass: "btn-success published" },
  UNPUBLISH: { text: "Unpublished", cssClass: "btn-danger unpublished" },
  null: { text: "Pending", cssClass: "btn-pending default" }
}
const SYSTEM_USER = "system"

interface ApprovalStepModalStatusProps {
  action: any
}

const ApprovalStepModalStatus = ({ action }: ApprovalStepModalStatusProps) => {
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

interface ApprovalStepModalProps {
  action: any
}

const ApprovalStepModal = ({ action }: ApprovalStepModalProps) => {
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
        <div className="workflow-step-name">{step.name}</div>
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

interface ActionStatusProps {
  action: any
}

export const ActionStatus = ({ action }: ActionStatusProps) => (
  <div className="action-status">{ACTION_TYPE_DETAILS[action.type].text}</div>
)

interface ActionButtonProps {
  action: any
  isCompact?: boolean
}

export const ActionButton = ({ action, isCompact }: ActionButtonProps) => {
  const step = action.step
  const actionType = ACTION_TYPE_DETAILS[action.type]
  return step ? (
    <ApprovalStepModal action={action} />
  ) : (
    <Button
      className={actionType.cssClass + " btn-sm"}
      variant="outline-secondary"
      disabled={!isCompact}
      style={{ paddingBottom: isCompact ? 8 : 0 }}
    >
      <span>
        <LinkTo
          modelType="Person"
          model={action.person}
          whenUnspecified={SYSTEM_USER}
          isLink={!!isCompact}
          showAvatar={!isCompact}
          showIcon={!!isCompact}
        />
      </span>
    </Button>
  )
}

interface ActionDetailsProps {
  action: any
}

const ActionDetails = ({ action }: ActionDetailsProps) => {
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

interface ReportActionProps {
  action: any
}

const ReportAction = ({ action }: ReportActionProps) => (
  <div className="workflow-action">
    <ActionStatus action={action} />
    <ActionButton action={action} />
    <ActionDetails action={action} />
  </div>
)

interface CompactReportActionProps {
  action: any
}

const CompactReportAction = ({ action }: CompactReportActionProps) => (
  <div className="workflow-action">
    <ActionButton action={action} />
  </div>
)

interface ReportFullWorkflowProps {
  workflow: any[]
}

export const ReportFullWorkflow = ({ workflow }: ReportFullWorkflowProps) => (
  <Fieldset id="workflow" className="workflow-fieldset" title="Workflow">
    {workflow.map(action => {
      const key = action.step
        ? `${action.createdAt}-${action.step.uuid}`
        : action.createdAt
      return <ReportAction action={action} key={key} />
    })}
  </Fieldset>
)

interface ReportCompactWorkflowProps {
  workflow: any[]
}

export const ReportCompactWorkflow = ({
  workflow
}: ReportCompactWorkflowProps) => (
  <Fieldset className="workflow-fieldset compact" title="Workflow">
    {workflow.map(action => {
      const key = action.step
        ? `${action.createdAt}-${action.step.uuid}`
        : action.createdAt
      return <CompactReportAction action={action} key={key} />
    })}
  </Fieldset>
)
