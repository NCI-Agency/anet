import { Settings } from "api"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import moment from "moment"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Button, Modal } from "react-bootstrap"
import "./ReportWorkflow.css"

const ACTION_TYPE_DETAILS = {
  APPROVE: { text: "Approved", cssClass: "btn-success approved" },
  REJECT: { text: "Changes requested", cssClass: "btn-danger rejected" },
  SUBMIT: { text: "Submitted", cssClass: "btn-pending submitted" },
  PUBLISH: { text: "Published", cssClass: "btn-success published" },
  null: { text: "Pending", cssClass: "btn-pending default" }
}

const ApprovalStepModalStatus = ({ action }) => {
  if (action.type) {
    const actionType = ACTION_TYPE_DETAILS[action.type]
    const cssClass = "label " + actionType.cssClass
    return (
      <span className={cssClass}>
        {actionType.text} by{" "}
        <LinkTo person={action.person} isLink={false} showIcon={false} /> on
        <small>
          {" "}
          {moment(action.createdAt).format(
            Settings.dateFormats.forms.displayShort.withTime
          )}
        </small>
      </span>
    )
  }
  return <span className="label pending">Pending</span>
}

class ApprovalStepModal extends Component {
  static propTypes = {
    action: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      showModal: false
    }
  }

  closeModal = () => {
    this.setState({ showModal: false })
  }

  openModal = () => {
    this.setState({ showModal: true })
  }

  render() {
    const { action } = this.props
    const step = action.step
    const actionTypeCss = ACTION_TYPE_DETAILS[action.type].cssClass
    return step ? (
      <React.Fragment>
        <Button className={actionTypeCss + " btn-sm"} onClick={this.openModal}>
          <span>{step.name}</span>
        </Button>
        <Modal show={this.state.showModal} onHide={this.closeModal}>
          <Modal.Header closeButton>
            <Modal.Title>Approvers for {step.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ul>
              {step.approvers.map(position => (
                <li key={position.uuid}>
                  <LinkTo position={position} /> -{" "}
                  <LinkTo person={position.person} />
                </li>
              ))}
            </ul>
          </Modal.Body>
          <Modal.Footer>
            <ApprovalStepModalStatus action={action} />
          </Modal.Footer>
        </Modal>
      </React.Fragment>
    ) : null
  }
}

const ActionStatus = ({ action }) => {
  return (
    <div className="action-status">{ACTION_TYPE_DETAILS[action.type].text}</div>
  )
}

const ActionButton = ({ action }) => {
  const step = action.step
  const actionType = ACTION_TYPE_DETAILS[action.type]
  return step ? (
    <ApprovalStepModal action={action} />
  ) : (
    <Button className={actionType.cssClass + " btn-sm"}>
      <span>
        <LinkTo person={action.person} isLink={false} />
      </span>
    </Button>
  )
}

const ActionDetails = ({ action }) => {
  if (action.type) {
    return (
      <div>
        <span>
          By <LinkTo person={action.person} />
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

const ReportAction = ({ action }) => {
  return (
    <div className="workflow-action">
      <ActionStatus action={action} />
      <ActionButton action={action} />
      <ActionDetails action={action} />
    </div>
  )
}

const CompactReportAction = ({ action }) => {
  return (
    <div className="workflow-action">
      <ActionButton action={action} />
    </div>
  )
}

export const ReportFullWorkflow = ({ report }) => {
  return (
    <Fieldset id="workflow" className="workflow-fieldset" title="Workflow">
      {report.workflow.map(action => {
        const key = action.step
          ? `${action.createdAt}-${action.step.uuid}`
          : action.createdAt
        return <ReportAction action={action} key={key} />
      })}
    </Fieldset>
  )
}

export const ReportCompactWorkflow = ({ report }) => {
  return (
    <Fieldset className="workflow-fieldset compact" title="Workflow">
      {report.workflow.map(action => {
        const key = action.step
          ? `${action.createdAt}-${action.step.uuid}`
          : action.createdAt
        return <CompactReportAction action={action} key={key} />
      })}
    </Fieldset>
  )
}
