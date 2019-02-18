import React, {Component} from 'react'
import {Button, Modal} from 'react-bootstrap'
import './ReportApprovals.css'
import Settings from 'Settings'
import LinkTo from 'components/LinkTo'

import Fieldset from 'components/Fieldset'
import moment from 'moment'

const APPROVE = 'APPROVE'
const REJECT = 'REJECT'
const SUBMIT = 'SUBMIT'
const PUBLISH = 'PUBLISH'


export default class ReportApprovals extends Component {

    constructor(props) {
        super(props)
        this.state = { }
        this.renderApprovalAction = this.renderApprovalAction.bind(this)
        this.showApproversModal = this.showApproversModal.bind(this)
        this.closeApproversModal = this.closeApproversModal.bind(this)
    }

    render() {
        let report = this.props.report
        let title = "Approval State"
        let fieldset = null
        if(this.props.fullReport) {
            fieldset = this.renderFullApprovalView(report, title)
        } else {
            fieldset = this.renderCompactApprovalView(report, title)
        }
        return fieldset
    }

    approvalType(type) {
        switch(type) {
            case APPROVE:
                return {text: 'Approved', cssClass: 'btn-success approved'}
            case REJECT:
                return {text: 'Changes requested', cssClass: 'btn-danger rejected'}
            case SUBMIT:
              return {text: 'Submitted', cssClass: 'btn-pending submitted'}
            case PUBLISH:
              return {text: 'Published', cssClass: 'btn-danger published'}
            default:
                return {text: 'Unknown', cssClass: 'btn-pending default'}
        }
    }

    renderFullApprovalView(report, title){
        return (
            <Fieldset id="approvals" className="approval-fieldset" title={title}>
                { report.approvalStatus.map(action =>
                    this.renderApprovalAction(action)
                )}
            </Fieldset>
        )
    }

    renderCompactApprovalView(report, title){
        return (
            <Fieldset className="approval-fieldset compact" title={title}>
                { report.approvalStatus.map(action =>
                    this.renderCompactApprovalAction(action)
                )}
            </Fieldset>
        )
    }

    renderApprovalAction(action) {
        let approvalButton = this.renderApprovalButton(action)
        let approvalStatus = this.renderApprovalStatus(action)
        let approvalDetails = this.renderApprovalDetails(action)
        const key = action.step ? `${action.createdAt}-${action.step.uuid}` : action.createdAt
        return (
            <div className="approval-action" key={key}>
                { approvalStatus }
                { approvalButton }
                { approvalDetails }
            </div>
        )
    }

    renderCompactApprovalAction(action) {
        let approvalButton = this.renderApprovalButton(action)
        const key = action.step ? `${action.createdAt}-${action.step.uuid}` : action.createdAt
        return (
            <div className="approval-action" key={key}>
                { approvalButton }
            </div>
        )
    }

    renderApprovalDetails(action) {
        if(action.type){
            return(
                <div className="approval-details">
                    <span>By <LinkTo person={action.person} /></span><br/>
                    <small>
                        On {moment(action.createdAt).format(Settings.dateFormats.forms.short)}<br/>
                        At {moment(action.createdAt).format('h:mm a')}
                    </small>
                </div>
            )
        }
    }

    renderApprovalStatus(action) {
        let status = (action.type) ? this.approvalType(action.type).text : 'Pending'
        return <div className="approval-status">{status}</div>
    }

    renderApprovalButton(action) {
        const step = action.step
        const approvalModal = this.renderApprovalModal(action)
        const approvalTypeCss =  this.approvalType(action.type).cssClass
        return (
          step ?
            <React.Fragment>
              <Button className={approvalTypeCss + ' btn-sm'} onClick={this.showApproversModal.bind(this, step)}>
                  <span>{step.name}</span>
              </Button>
              { approvalModal }
            </React.Fragment>
           :
           <Button className={approvalTypeCss + ' btn-sm'}>
             <span>{action.type}</span>
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

    renderApprovalModal(action) {
        let step = action.step
        let approvalStatus = this.renderApprovalModalStatus(action)
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
              <Modal.Footer>{ approvalStatus }</Modal.Footer>
          </Modal>
          :
          null
        )
    }

    renderApprovalModalStatus(action){
        let pending = <span className="label pending">Pending</span>
        if(action.type){
            let approvalType = this.approvalType(action.type)
            let cssClass = 'label ' + approvalType.cssClass
            return (
                <span className={cssClass}> {approvalType.text} by <LinkTo person={action.person} isLink= {false}/> on
                    <small> {moment(action.createdAt).format(Settings.dateFormats.forms.withTime)}</small>
                </span>
            )
        }
        return pending
    }
}
