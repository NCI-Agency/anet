import React, {Component} from 'react'
import {Button, Modal} from 'react-bootstrap'
import 'components/ReportApprovals.css'

import Fieldset from 'components/Fieldset'
import moment from 'moment'

const APPROVE = 'APPROVE'
const REJECT = 'REJECT'

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
                return {text: 'Rejected', cssClass: 'btn-danger rejected'}
            default:
                return {text: 'Unknown', cssClass: 'default'}
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
        let step = action.step
        let approvalButton = this.renderApprovalButton(action)
        let approvalModal = this.renderApprovalModal(action)
        let approvalStatus = this.renderApprovalStatus(action)
        let approvalDetails = this.renderApprovalDetails(action)
        return (
            <div className="approval-action" key={step.id}>
                { approvalStatus }
                { approvalButton }
                { approvalDetails }
                { approvalModal }
            </div>
        )
    }

    renderCompactApprovalAction(action) {
        let approvalButton = this.renderApprovalButton(action)
        let approvalModal = this.renderApprovalModal(action)
        return (
            <div className="approval-action" key={action.step.id}>
                { approvalButton }
                { approvalModal }
            </div>
        )
    }

    renderApprovalDetails(action) {
        if(action.type){
            return(
                <div className="approval-details">
                    <span>By {action.person.name}</span><br/>
                    <small>
                        On {moment(action.createdAt).format('D MMM YYYY')}<br/>
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
        let step = action.step
        let buttonColor = (action.type) ? 'btn-success ' : 'btn-pending '
        return (
            <Button className={buttonColor + 'btn-sm'} onClick={this.showApproversModal.bind(this, step)}>
                <span>{step.name}</span>
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
            <Modal show={step.showModal} onHide={this.closeApproversModal.bind(this, step)}>
                <Modal.Header closeButton>
                    <Modal.Title>Approvers for {step.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ul>
                    {step.approvers.map(p =>
                        <li key={p.id}>{p.name} - {p.person && p.person.name}</li>
                    )}
                    </ul>
                </Modal.Body>
                <Modal.Footer>{ approvalStatus }</Modal.Footer>
            </Modal>
        )
    }

    renderApprovalModalStatus(action){
        let pending = <span className="label pending">Pending</span>
        if(action.type){
            let approvalType = this.approvalType(action.type)
            let cssClass = 'label ' + approvalType.cssClass
            return (
                <span className={cssClass}> {approvalType.text} by {action.person.name} on
                    <small> {moment(action.createdAt).format('D MMM YYYY, h:mm a')}</small>
                </span>
            )
        }
        return pending
    }
}
