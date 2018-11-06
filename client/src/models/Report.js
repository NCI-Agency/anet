import Model from 'components/Model'
import moment from 'moment'
import {Organization, Person, Position} from 'models'

export default class Report extends Model {
	static resourceName = 'Report'
	static listName = 'reportList'
	static getInstanceName = 'report'
	static searchObjectType= 'Reports'

	static STATE = {
		DRAFT: 'DRAFT',
		PENDING_APPROVAL: 'PENDING_APPROVAL',
		RELEASED: 'RELEASED',
		REJECTED: 'REJECTED',
		CANCELLED: 'CANCELLED',
		FUTURE: 'FUTURE'
	}

	static CANCELLATION_REASON = {
		CANCELLED_BY_ADVISOR: 'CANCELLED_BY_ADVISOR',
		CANCELLED_BY_PRINCIPAL: 'CANCELLED_BY_PRINCIPAL',
		CANCELLED_DUE_TO_TRANSPORTATION: 'CANCELLED_DUE_TO_TRANSPORTATION',
		CANCELLED_DUE_TO_FORCE_PROTECTION: 'CANCELLED_DUE_TO_FORCE_PROTECTION',
		CANCELLED_DUE_TO_ROUTES: 'CANCELLED_DUE_TO_ROUTES',
		CANCELLED_DUE_TO_THREAT: 'CANCELLED_DUE_TO_THREAT',
	}

	static schema = {
		intent: '',
		engagementDate: null,
		cancelledReason: null,
		atmosphere: null,
		atmosphereDetails: '',
		location: {},
		attendees: [],
		tasks: [],
		comments: [],
		reportText: '',
		nextSteps: '',
		keyOutcomes: '',
		tags: [],
		reportSensitiveInformation: null,
		authorizationGroups: [],
	}

	isDraft() {
		return this.state === Report.STATE.DRAFT
	}

	isPending() {
		return this.state === Report.STATE.PENDING_APPROVAL
	}

	isReleased() {
		return this.state === Report.STATE.RELEASED
	}

	isRejected() {
		return this.state === Report.STATE.REJECTED
	}

	isFuture() {
		return this.state === Report.STATE.FUTURE
	}

	showApprovals() {
		return this.state && !this.isDraft() && !this.isFuture()
	}

	toString() {
		return this.intent || 'None'
	}

	validateForSubmit() {
		let errors = []

		let isCancelled = this.cancelledReason ? true : false
		if (!isCancelled) {
			if (!this.atmosphere) {
				errors.push('You must provide the overall atmospherics of the engagement')
			} else {
				if (this.atmosphere !== 'POSITIVE' && !this.atmosphereDetails) {
					errors.push('You must provide atmospherics details if the engagement was not Positive')
				}
			}
		}
		if (!this.engagementDate) {
			errors.push('You must provide the Date of Engagement')
		} else if (!isCancelled && moment(this.engagementDate).isAfter(moment().endOf('day'))) {
			errors.push('You cannot submit reports for future dates, except for cancelled engagements')
		}

		this.checkPrimaryAttendee(this.getPrimaryPrincipal(), this.principalOrg, Person.ROLE.PRINCIPAL, Organization.TYPE.PRINCIPAL_ORG, errors)
		this.checkPrimaryAttendee(this.getPrimaryAdvisor(), this.advisorOrg, Person.ROLE.ADVISOR, Organization.TYPE.ADVISOR_ORG, errors)

		if (!this.intent) {
			errors.push("You must provide the Meeting Goal (purpose)")
		}

		if (!this.nextSteps) {
			errors.push('You must provide a brief summary of the Next Steps')
		}

		if (!isCancelled && !this.keyOutcomes) {
			errors.push('You must provide a brief summary of the Key Outcomes')
		}
		return errors
	}

	checkPrimaryAttendee(primaryAttendee, primaryOrg, role, orgType, errors) {
		const roleName = Person.humanNameOfRole(role)
		if (!primaryAttendee) {
			errors.push(`You must provide the primary ${roleName} for the Engagement`)
		} else if (primaryAttendee.status !== Person.STATUS.ACTIVE) {
			errors.push(`The primary ${roleName} - ${primaryAttendee.name} - needs to have an active profile`)
		} else if (primaryAttendee.endOfTourDate && moment(primaryAttendee.endOfTourDate).isBefore(moment().startOf('day'))) {
			errors.push(`The primary ${roleName}'s - ${primaryAttendee.name} - end of tour date has passed`)
		} else if (!primaryAttendee.position) {
			errors.push(`The primary ${roleName} - ${primaryAttendee.name} - needs to be assigned to a position`)
		} else if (primaryAttendee.position.status !== Position.STATUS.ACTIVE) {
			errors.push(`The primary ${roleName} - ${primaryAttendee.name} - needs to be in an active position`)
		} else if (primaryOrg && (primaryOrg.type !== orgType)) {
			errors.push(`The primary ${roleName}'s - ${primaryAttendee.name} - organization should be ${Organization.humanNameOfType(orgType)}`)
		}
	}

	getPrimaryPrincipal() {
		return this.attendees.find( el =>
			el.role === Person.ROLE.PRINCIPAL && el.primary
		)
	}

	getPrimaryAdvisor() {
		return this.attendees.find( el =>
			el.role === Person.ROLE.ADVISOR && el.primary
		)
	}

	getReportReleasedAt() {
		if (this.approvalStatus) {
			const approvalSteps = Object.assign([], this.approvalStatus)
			const lastApprovalStep = approvalSteps.pop()
			return !lastApprovalStep ? '' : lastApprovalStep.createdAt
		} else {
			return
		}
	}

	addAttendee(newAttendee) {
		if (!newAttendee || !newAttendee.uuid) {
			return
		}

		let attendees = this.attendees

		if (attendees.find(attendee => attendee.uuid === newAttendee.uuid)) {
			return
		}

		let person = new Person(newAttendee)
		person.primary = false

		if (!attendees.find(attendee => attendee.role === person.role && attendee.primary)) {
			person.primary = true
		}

		this.attendees.push(person)
		return true
	}

}
