import React, {Component} from 'react'
import {Button, Modal} from 'react-bootstrap'
import './ReportWorkflow.css'
import Settings from 'Settings'
import LinkTo from 'components/LinkTo'

import Fieldset from 'components/Fieldset'
import moment from 'moment'

const APPROVE = 'APPROVE'
const REJECT = 'REJECT'
const SUBMIT = 'SUBMIT'
const PUBLISH = 'PUBLISH'


export default class ReportWorkflow extends Component {

    constructor(props) {
        super(props)
        this.state = { }
        this.renderReportAction = this.renderReportAction.bind(this)
        this.showApproversModal = this.showApproversModal.bind(this)
        this.closeApproversModal = this.closeApproversModal.bind(this)
    }

    render() {
        let report = this.props.report
        let title = "Workflow"
        let fieldset = null
        if(this.props.fullReport) {
            fieldset = this.renderFullWorkflowView(report, title)
        } else {
            fieldset = this.renderCompactWorkflowView(report, title)
        }
        return fieldset
    }

    actionType(type) {
        switch(type) {
            case APPROVE:
                return {text: 'Approved', cssClass: 'btn-success approved'}
            case REJECT:
                return {text: 'Changes requested', cssClass: 'btn-danger rejected'}
            case SUBMIT:
              return {text: 'Submitted', cssClass: 'btn-pending submitted'}
            case PUBLISH:
              return {text: 'Published', cssClass: 'btn-success published'}
            default:
                return {text: 'Unknown', cssClass: 'btn-pending default'}
        }
    }

    renderFullWorkflowView(report, title){
        return (
            <Fieldset id="workflow" className="workflow-fieldset" title={title}>
                { report.workflow.map(action =>
                    this.renderReportAction(action)
                )}
            </Fieldset>
        )
    }

    renderCompactWorkflowView(report, title){
        return (
            <Fieldset className="workflow-fieldset compact" title={title}>
                { report.workflow.map(action =>
                    this.renderCompactReportAction(action)
                )}
            </Fieldset>
        )
    }

    renderReportAction(action) {
        let actionStatus = this.renderActionStatus(action)
        let actionButton = this.renderActionButton(action)
        let actionDetails = this.renderActionDetails(action)
        const key = action.step ? `${action.createdAt}-${action.step.uuid}` : action.createdAt
        return (
            <div className="workflow-action" key={key}>
                { actionStatus }
                { actionButton }
                { actionDetails }
            </div>
        )
    }

    renderCompactReportAction(action) {
        let actionButton = this.renderActionButton(action)
        const key = action.step ? `${action.createdAt}-${action.step.uuid}` : action.createdAt
        return (
            <div className="workflow-action" key={key}>
                { actionButton }
            </div>
        )
    }

    renderActionDetails(action) {
        if(action.type){
            return(
                <div>
                    <span>By <LinkTo person={action.person} /></span><br/>
                    <small>
                        On {moment(action.createdAt).format(Settings.dateFormats.forms.short)}<br/>
                        At {moment(action.createdAt).format('h:mm a')}
                    </small>
                </div>
            )
        }
    }

    getActionStatus(action) {
      return (action.type) ? this.actionType(action.type).text : 'Pending'
    }

    renderActionStatus(action) {
        return <div className="action-status">{this.getActionStatus(action)}</div>
    }

    renderActionButton(action) {
        const step = action.step
        const actionModal = this.renderActionModal(action)
        const actionTypeCss =  this.actionType(action.type).cssClass
        return (
          step ?
            <React.Fragment>
              <Button className={actionTypeCss + ' btn-sm'} onClick={this.showApproversModal.bind(this, step)}>
                  <span>{step.name}</span>
              </Button>
              { actionModal }
            </React.Fragment>
           :
           <Button className={actionTypeCss + ' btn-sm'}>
             <span>{this.getActionStatus(action)}</span>
           </Button>
        )
    }

    showApproversModal(step) {
        step.showModal = true
        this.setState(this.state)
    }

    closeApproversModal(step) {
        step.showModal = false
        this.setState(this.state)
    }

    renderActionModal(action) {
        let step = action.step
        let actionStatus = this.renderActionModalStatus(action)
        return (
          step ?
          <Modal show={step.showModal} onHide={this.closeApproversModal.bind(this, step)}>
              <Modal.Header closeButton>
                  <Modal.Title>Approvers for {step.name}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                  <ul>
                  {step.approvers.map(position =>
                      <li key={position.uuid}>
                          <LinkTo position={position} /> - <LinkTo person={position.person} />
                      </li>
                  )}
                  </ul>
              </Modal.Body>
              <Modal.Footer>{ actionStatus }</Modal.Footer>
          </Modal>
          :
          null
        )
    }

    renderActionModalStatus(action){
        let pending = <span className="label pending">Pending</span>
        if(action.type){
            let actionType = this.actionType(action.type)
            let cssClass = 'label ' + actionType.cssClass
            return (
                <span className={cssClass}> {actionType.text} by <LinkTo person={action.person} isLink= {false}/> on
                    <small> {moment(action.createdAt).format(Settings.dateFormats.forms.withTime)}</small>
                </span>
            )
        }
        return pending
    }
}
