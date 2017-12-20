import React, {PropTypes} from 'react'
import {Checkbox, Table, Button, Collapse, HelpBlock} from 'react-bootstrap'
import DatePicker from 'react-bootstrap-date-picker'
import autobind from 'autobind-decorator'
import { WithContext as ReactTags } from 'react-tag-input'
import 'components/reactTags.css'

import Fieldset from 'components/Fieldset'
import Form from 'components/Form'
import TextEditor from 'components/TextEditor'
import Autocomplete from 'components/Autocomplete'
import ButtonToggleGroup from 'components/ButtonToggleGroup'
import PoamsSelector from 'components/PoamsSelector'
import LinkTo from 'components/LinkTo'
import History from 'components/History'
import ValidatableFormWrapper from 'components/ValidatableFormWrapper'
import moment from 'moment'

import API from 'api'
import {Report, Person} from 'models'

import CALENDAR_ICON from 'resources/calendar.png'
import LOCATION_ICON from 'resources/locations.png'
import REMOVE_ICON from 'resources/delete.png'
import WARNING_ICON from 'resources/warning.png'

export default class ReportForm extends ValidatableFormWrapper {
	static propTypes = {
		report: PropTypes.instanceOf(Report).isRequired,
		edit: PropTypes.bool
	}

	static contextTypes = {
		currentUser: PropTypes.object,
	}

	constructor(props) {
		super(props)

		this.state = {
			recents: {
				persons: [],
				locations: [],
				poams: [],
			},
			tagList: [],
			suggestionList: [],

			showReportText: false,
			isCancelled: (props.report.cancelledReason ? true : false),
			errors: {},

			//State for auto-saving reports
			reportChanged: false, //Flag to determine if we need to auto-save.
			timeoutId: null,
			showAutoSaveBanner: false,
		}
		this.handleTagDelete = this.handleTagDelete.bind(this)
		this.handleTagAddition = this.handleTagAddition.bind(this)
	}

	componentDidMount() {
		API.query(/* GraphQL */`
			locationList(f:recents, maxResults:6) {
				list { id, name }
			}
			personList(f:recents, maxResults:6) {
				list { id, name, rank, role, position { id, name, organization {id, shortName}} }
			}
			poamList(f:recents, maxResults:6) {
				list { id, shortName, longName }
			}
			tagList(f:getAll) {
				list { id, name, description }
			}
		`).then(data => {
			let newState = {
				recents: {
					locations: data.locationList.list,
					persons: data.personList.list,
					poams: data.poamList.list,
				},
				tagList: data.tagList.list,
				suggestionList: data.tagList.list.map(function(tag) { return tag.name }),
			}
			this.setState(newState)
		})

		let timeoutId = window.setTimeout(this.autoSave, 30000)
		this.setState({timeoutId})
	}

	componentWillUnmount() {
		window.clearTimeout(this.state.timeoutId)
	}


	componentWillReceiveProps(nextProps) {
		let report = nextProps.report
		if (report.cancelledReason) {
			this.setState({isCancelled: true})
		}
		this.setState({showReportText: !!report.reportText || !!report.reportSensitiveInformation})
	}

    handleTagDelete(i) {
        let {tags} = this.props.report
        tags.splice(i, 1)
    }

    handleTagAddition(tag) {
        let newTag = this.state.tagList.find(function (t) { return t.name === tag })
        let {tags} = this.props.report
        tags.push(newTag)
    }

	render() {
		const { currentUser } = this.context
		let {report, onDelete} = this.props
		const { edit } = this.props
		let {recents, suggestionList, errors, isCancelled, showAutoSaveBanner} = this.state

		let hasErrors = Object.keys(errors).length > 0
		let isFuture = report.engagementDate && moment().endOf("day").isBefore(report.engagementDate)

		const invalidInputWarningMessage = <HelpBlock><b>
			<img src={WARNING_ICON} role="presentation" height="20px" />
			Location not found in database
		</b></HelpBlock>

		const futureMessage = isFuture && <HelpBlock>
			<span className="text-success">This will create an upcoming engagement</span>
		</HelpBlock>

		const {ValidatableForm, RequiredField} = this

		const submitText = currentUser.hasAssignedPosition() ? 'Preview and submit' : 'Save draft'

		return <div className="report-form">
			<Collapse in={showAutoSaveBanner}>
				<div className="banner" style={{top:132, background: '#DFF0D8', color: '#3c763d'}}>
					Your report has been automatically saved
				</div>
			</Collapse>

			<ValidatableForm formFor={report} horizontal onSubmit={this.onSubmit} onChange={this.onChange}
				onDelete={onDelete} deleteText="Delete this report"
				submitDisabled={hasErrors} submitText={submitText}
				bottomAccessory={this.state.autoSavedAt && <div>Last autosaved at {this.state.autoSavedAt.format('hh:mm:ss')}</div>}
			>

				<Fieldset title={this.props.title}>
					<RequiredField id="intent" label="Meeting goal (purpose)"
						canSubmitWithError={true}
						validateBeforeUserTouches={this.props.edit}
						className="meeting-goal"
						placeholder="What happened?" componentClass="textarea" maxCharacters={250}>
						<Form.Field.ExtraCol>{250 - report.intent.length} characters remaining</Form.Field.ExtraCol>
					</RequiredField>

					<Form.Field id="engagementDate" addon={CALENDAR_ICON} postInputGroupChildren={futureMessage} >
						<DatePicker showTodayButton placeholder="When did it happen?" dateFormat="DD/MM/YYYY" showClearButton={false} />
					</Form.Field>

					<Form.Field id="location" addon={LOCATION_ICON} validationState={errors.location} className="location-form-group"
						postInputGroupChildren={errors.location && invalidInputWarningMessage}>
						<Autocomplete valueKey="name" placeholder="Start typing to search for the location where this happened..." url="/api/locations/search" />
						{recents.locations && recents.locations.length > 0 &&
							<Form.Field.ExtraCol className="shortcut-list">
								<h5>Recent locations</h5>
								<Button bsStyle="link"  onClick={this.setLocation.bind(this, recents.locations[0])}>Add {recents.locations[0].name}</Button>
							</Form.Field.ExtraCol>
						}
					</Form.Field>

					<Form.Field id="isCancelled" value={isCancelled} label="">
						<Checkbox inline onChange={this.toggleCancelled} checked={isCancelled} className="cancelled-checkbox">
							This engagement was cancelled
						</Checkbox>
					</Form.Field>

					{!isCancelled &&
						<Form.Field id="atmosphere" className="atmosphere-form-group" label="Atmospherics"> 
							<ButtonToggleGroup>
								<Button value="POSITIVE" id="positiveAtmos">Positive</Button>
								<Button value="NEUTRAL" id="neutralAtmos">Neutral</Button>
								<Button value="NEGATIVE" id="negativeAtmos">Negative</Button>
							</ButtonToggleGroup>
						</Form.Field>
					}

					{!isCancelled && report.atmosphere &&
						<RequiredField id="atmosphereDetails" className="atmosphere-details"
							placeholder={`Why was this engagement ${report.atmosphere.toLowerCase()}? ${report.atmosphere === 'POSITIVE' ? "(optional)" : ""}`}
							required={report.atmosphere !== 'POSITIVE'} />
					}

					{isCancelled &&
						<Form.Field id="cancelledReason" componentClass="select" className="cancelled-reason-form-group">
							<option value="CANCELLED_BY_ADVISOR">Cancelled by Advisor</option>
							<option value="CANCELLED_BY_PRINCIPAL">Cancelled by Principal</option>
							<option value="CANCELLED_DUE_TO_TRANSPORTATION">Cancelled due to Transportation</option>
							<option value="CANCELLED_DUE_TO_FORCE_PROTECTION">Cancelled due to Force Protection</option>
							<option value="CANCELLED_DUE_TO_ROUTES">Cancelled due to Routes</option>
							<option value="CANCELLED_DUE_TO_THREAT">Cancelled due to Threat</option>
						</Form.Field>
					}

					<Form.Field id="tags" label="Tags">
						<ReactTags tags={report.tags}
							suggestions={suggestionList}
							labelField={'name'}
							classNames={{
								tag: 'reportTag label label-info',
								remove: 'reportTagRemove label-info',
							}}
							minQueryLength={1}
							autocomplete={true}
							autofocus={false}
							handleDelete={this.handleTagDelete}
							handleAddition={this.handleTagAddition} />
					</Form.Field>
				</Fieldset>

				<Fieldset title={!isCancelled ? "Meeting attendance" : "Planned attendance"} id="attendance-fieldset">
					<Form.Field id="attendees" validationState={errors.attendees}>
						<Autocomplete objectType={Person}
							onChange={this.addAttendee}
							onErrorChange={this.attendeeError}
							clearOnSelect={true}
							queryParams={{status: ['ACTIVE','NEW_USER'], matchPositionName: true}}
							fields={Person.autocompleteQuery}
							template={Person.autocompleteTemplate}
							placeholder="Start typing to search for people who attended the meeting..."
							valueKey="name" />

						{errors.attendees && <HelpBlock>
							<img src={WARNING_ICON} role="presentation" height="20px" />
							Person not found in ANET Database.
						</HelpBlock>}

						<Table condensed id="attendeesTable" className="borderless">
							<thead>
								<tr>
									<th style={{textAlign: 'center'}}>Primary</th>
									<th>Name</th>
									<th>Position</th>
									<th>Org</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{Person.map(report.attendees.filter(p => p.role === "ADVISOR"), (person, idx) =>
									this.renderAttendeeRow(person, idx)
								)}

								<tr className="attendee-divider-row"><td colSpan={5}><hr /></td></tr>

								{Person.map(report.attendees.filter(p => p.role === "PRINCIPAL"), (person, idx) =>
									this.renderAttendeeRow(person, idx)
								)}
							</tbody>
						</Table>

						{recents.persons.length > 0 &&
							<Form.Field.ExtraCol className="shortcut-list">
								<h5>Recent attendees</h5>
								{Person.map(recents.persons, person =>
									<Button key={person.id} bsStyle="link" onClick={this.addAttendee.bind(this, person)}>Add {person.name}</Button>
								)}
							</Form.Field.ExtraCol>
						}
					</Form.Field>
				</Fieldset>

				{!isCancelled &&
					<PoamsSelector poams={report.poams}
						shortcuts={recents.poams}
						onChange={this.onChange}
						onErrorChange={this.onPoamError}
						validationState={errors.poams}
						optional={true} />
				}

				<Fieldset title={!isCancelled ? "Meeting discussion" : "Next steps and details"}>
					{!isCancelled &&
						<RequiredField id="keyOutcomes" componentClass="textarea" maxCharacters={250} humanName="Key outcome description"
							canSubmitWithError={true}
							validateBeforeUserTouches={this.props.edit}>
							<Form.Field.ExtraCol>{250 - report.keyOutcomes.length} characters remaining</Form.Field.ExtraCol>
						</RequiredField>
					}

					<RequiredField id="nextSteps" componentClass="textarea" maxCharacters={250} humanName="Next steps description"
						canSubmitWithError={true}
						validateBeforeUserTouches={this.props.edit}>
						<Form.Field.ExtraCol>{250 - report.nextSteps.length} characters remaining</Form.Field.ExtraCol>
					</RequiredField>

					<Button className="center-block toggle-section-button" onClick={this.toggleReportText} id="toggleReportDetails" >
						{this.state.showReportText ? 'Hide' : 'Add'} detailed report
					</Button>

					<Collapse in={this.state.showReportText}>
						<div>
							<Form.Field id="reportText" className="reportTextField" componentClass={TextEditor} />

							{(report.reportSensitiveInformation || !edit) &&
								<Form.Field id="reportSensitiveInformationText" className="reportSensitiveInformationField" componentClass={TextEditor}
									value={report.reportSensitiveInformation && report.reportSensitiveInformation.text}
									onChange={this.updateReportSensitiveInformation} />
							}
						</div>
					</Collapse>
				</Fieldset>
			</ValidatableForm>
		</div>
	}

	updateReportSensitiveInformation = (value) => {
		if (!this.props.report.reportSensitiveInformation) {
			this.props.report.reportSensitiveInformation = {}
		}
		this.props.report.reportSensitiveInformation.text = value
		this.onChange()
	}

	@autobind
	toggleReportText() {
		this.setState({showReportText: !this.state.showReportText})
	}

	@autobind
	toggleCancelled() {
		//Toggle the isCancelled state. And set a default reason if necessary
		let cancelled = !this.state.isCancelled
		this.props.report.cancelledReason = (cancelled) ? 'CANCELLED_BY_ADVISOR' : null
		this.setState({isCancelled: cancelled})
	}

	@autobind
	setLocation(location) {
		this.props.report.location = location
		this.onChange()
	}

	@autobind
	addAttendee(newAttendee) {
		this.props.report.addAttendee(newAttendee)
		this.onChange()
	}

	@autobind
	attendeeError(isError, message) {
		let errors = this.state.errors
		if (isError) {
			errors.attendees = 'error'
		} else {
			delete errors.attendees
		}
		this.setState({errors})
	}

	@autobind
	renderAttendeeRow(person, idx) {
		return <tr key={person.id}>
			<td className="primary-attendee">
				<Checkbox checked={person.primary} onChange={this.setPrimaryAttendee.bind(this, person)} id={'attendeePrimary_' + person.role + "_" + idx}/>
			</td>

			<td id={"attendeeName_" + person.role + "_" + idx} >
				<img src={person.iconUrl()} alt={person.role} height={20} className="person-icon" />
				{person.name} {person.rank && person.rank.toUpperCase()}
			</td>
			<td><LinkTo position={person.position} /></td>
			<td>{person.position && person.position.organization && person.position.organization.shortName}</td>

			<td onClick={this.removeAttendee.bind(this, person)} id={'attendeeDelete_' + person.role + "_" + idx} >
				<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt="Remove attendee" /></span>
			</td>
		</tr>
	}


	@autobind
	onPoamError(isError, message) {
		let errors = this.state.errors
		if (isError) {
			errors.poams = 'error'
		} else {
			delete errors.poams
		}
		this.setState({errors})
	}

	@autobind
	removeAttendee(oldAttendee) {
		let report = this.props.report
		let attendees = report.attendees
		let index = attendees.findIndex(attendee => Person.isEqual(attendee, oldAttendee))

		if (index !== -1) {
			let person = attendees[index]
			attendees.splice(index, 1)

			if (person.primary) {
				let nextPerson = attendees.find(nextPerson => nextPerson.role === person.role)
				if (nextPerson)
					nextPerson.primary = true
			}

			this.onChange()
		}
	}

	@autobind
	setPrimaryAttendee(person) {
		let report = this.props.report
		let attendees = report.attendees

		attendees.forEach(nextPerson => {
			if (nextPerson.role === person.role)
				nextPerson.primary = false
			if (Person.isEqual(nextPerson, person))
				nextPerson.primary = true
		})

		this.onChange()
	}

	@autobind
	onChange() {
		this.setState({errors : this.validateReport(), reportChanged: true})
		this.forceUpdate()
	}

	@autobind
	validateReport() {
		let report = this.props.report
		let errors = this.state.errors
		if (report.location && (typeof report.location !== 'object')) {
			errors.location = 'error'
		} else {
			delete errors.location
		}

		return errors
	}

	@autobind
	saveReport(disableSubmits) {
		let report = new Report(Object.without(this.props.report, 'reportSensitiveInformationText'))
		let isCancelled = this.state.isCancelled
		let edit = !!report.id
		if(report.primaryAdvisor) { report.attendees.find(a => a.id === report.primaryAdvisor.id).isPrimary = true }
		if(report.primaryPrincipal) { report.attendees.find(a => a.id === report.primaryPrincipal.id).isPrimary = true }

		delete report.primaryPrincipal
		delete report.primaryAdvisor
		report.attendees = report.attendees.map(a =>
			Object.without(a, 'position')
		)

		if (!isCancelled) {
			delete report.cancelledReason
		}

		let url = `/api/reports/${edit ? 'update' : 'new'}?sendEditEmail=${disableSubmits}`
		return API.send(url, report, {disableSubmits: disableSubmits})
	}

	@autobind
	onSubmit(event) {
		this.saveReport(true)
			.then(response => {
				if (response.id) {
					this.props.report.id = response.id
				}

				// this updates the current page URL on model/new to be the edit page,
				// so that if you press back after saving a new model, it takes you
				// back to editing the model you just saved
				History.replace(Report.pathForEdit(this.props.report), false)

				// then after, we redirect you to the to page
				History.push(Report.pathFor(this.props.report), {
					success: 'Report saved successfully',
					skipPageLeaveWarning: true
				})
			})
			.catch(response => {
				this.setState({error: {message: response.message || response.error}})
				window.scrollTo(0, 0)
			})
	}

	@autobind
	autoSave() {
		let timeoutId = window.setTimeout(this.autoSave, 30000)
		this.setState({timeoutId})

		//If the report hasn't changed, don't save it.
		if (this.state.reportChanged === false) { return }

		this.saveReport(false)
			.then(response => {
				if (response.id) {
					this.props.report.id = response.id
				}
				if (response.reportSensitiveInformation) {
					this.props.report.reportSensitiveInformation = response.reportSensitiveInformation
				}

				//Reset the reportchanged state, yes this could drop a few keystrokes that
				// the user made while we were saving, but that's not a huge deal.
				this.setState({autoSavedAt: moment(), reportChanged: false, showAutoSaveBanner: true})
				window.setTimeout(this.hideAutoSaveBanner, 5000)
			}).catch(response =>
				this.setState({error: "There was an error autosaving your report. We'll try again in a few seconds"})
			)
	}

	@autobind
	hideAutoSaveBanner() {
		this.setState({showAutoSaveBanner: false})
	}
}
