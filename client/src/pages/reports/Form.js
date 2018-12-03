import PropTypes from 'prop-types'
import React, { Component } from 'react'

import {Checkbox, Button, Collapse, Table} from 'react-bootstrap'
import DatePicker from 'react-16-bootstrap-date-picker'

import { Formik, Form, Field } from 'formik'
import * as FieldHelper from 'components/FieldHelper'

import moment from 'moment'
import pluralize from 'pluralize'
import _isEmpty from 'lodash/isEmpty'

import Settings from 'Settings'

import AppContext from 'components/AppContext'
import NewAutocomplete from 'components/NewAutocomplete'
import Fieldset from 'components/Fieldset'
import ReportTags from 'components/ReportTags'
import MultiSelector from 'components/MultiSelector'
import TaskTable from 'components/TaskTable'
import RichTextEditor from 'components/RichTextEditor'
import Messages from 'components/Messages'
import NavigationWarning from 'components/NavigationWarning'
import LinkTo from 'components/LinkTo'

import CALENDAR_ICON from 'resources/calendar.png'
import LOCATION_ICON from 'resources/locations.png'
import PEOPLE_ICON from 'resources/people.png'
import TASK_ICON from 'resources/tasks.png'
import REMOVE_ICON from 'resources/delete.png'

import {Report, Location, Person, Task, AuthorizationGroup} from 'models'
import * as ReportDefs from 'models/Report'
import * as TaskDefs from 'models/Task'

import API from 'api'
import { jumpToTop } from 'components/Page'
import utils from 'utils'

import { withRouter } from 'react-router-dom'

class AttendeesTable extends Component {
	render() {
		return (
			<Table striped condensed hover responsive id="attendeesTable">
				<thead>
					<tr>
						<th style={{textAlign: 'center'}}>Primary</th>
						<th>Name</th>
						<th>Position</th>
						<th>Location</th>
						<th>Organization</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{Person.map(this.props.attendees.filter(p => p.role === Person.ROLE.ADVISOR),
						person => this.renderAttendeeRow(person)
					)}

					<tr className="attendee-divider-row"><td colSpan={6}><hr /></td></tr>

					{Person.map(this.props.attendees.filter(p => p.role === Person.ROLE.PRINCIPAL),
						person => this.renderAttendeeRow(person)
					)}
				</tbody>
			</Table>
		)
	}

	renderAttendeeRow = (person) => {
		return (
			<tr key={person.uuid}>
				<td className="primary-attendee">
					<Checkbox checked={person.primary} onChange={() => this.setPrimaryAttendee(person)} />
				</td>

				<td>
					<img src={person.iconUrl()} alt={person.role} height={20} className="person-icon" />
					<LinkTo person={person}/>
				</td>
				<td><LinkTo position={person.position} />{person.position && person.position.code ? `, ${person.position.code}`: ``}</td>
				<td><LinkTo whenUnspecified="" anetLocation={person.position && person.position.location} /></td>
				<td><LinkTo whenUnspecified="" organization={person.position && person.position.organization} /> </td>
				<td onClick={() => this.props.onDelete(person)}>
					<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt="Remove attendee" /></span>
				</td>
			</tr>
		)
	}

	setPrimaryAttendee = (person) => {
		this.props.attendees.forEach(attendee => {
			if (Person.isEqual(attendee, person)) {
				attendee.primary = true
			} else if (attendee.role === person.role) {
				attendee.primary = false
			}
		})
		this.props.onChange(this.props.attendees)
	}
}

const AuthorizationGroupTable = (props) => (
	<Table striped condensed hover responsive>
		<thead>
			<tr>
				<th>Name</th>
				<th>Description</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{props.authorizationGroups.map((ag, agIndex) =>
				<tr key={ag.uuid}>
					<td>{ag.name}</td>
					<td>{ag.description}</td>
					<td onClick={() => props.onDelete(ag)}>
						<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt="Remove group" /></span>
					</td>
				</tr>
			)}
		</tbody>
	</Table>
)

class BaseReportForm extends Component {
	static propTypes = {
		initialValues: PropTypes.object,
		title: PropTypes.string,
		edit: PropTypes.bool,
		showReportText: PropTypes.bool,
		currentUser: PropTypes.instanceOf(Person),
	}

	static defaultProps = {
		initialValues: new Report(),
		title: '',
		edit: false,
		showReportText: false,
	}

	atmosphereButtons = [
		{
			id: 'positiveAtmos',
			value: Report.ATMOSPHERE.POSITIVE,
			label: 'Positive',
		},
		{
			id: 'neutralAtmos',
			value: Report.ATMOSPHERE.NEUTRAL,
			label: 'Neutral',
		},
		{
			id: 'negativeAtmos',
			value: Report.ATMOSPHERE.NEGATIVE,
			label: 'Negative',
		},
	]
	cancelledReasonOptions = [
		{
			value: 'CANCELLED_BY_ADVISOR',
			label: `Cancelled by ${Settings.fields.advisor.person.name}`,
		},
		{
			value: 'CANCELLED_BY_PRINCIPAL',
			label: `Cancelled by ${Settings.fields.principal.person.name}`,
		},
		{
			value: 'CANCELLED_DUE_TO_TRANSPORTATION',
			label: 'Cancelled due to Transportation',
		},
		{
			value: 'CANCELLED_DUE_TO_FORCE_PROTECTION',
			label: 'Cancelled due to Force Protection',
		},
		{
			value: 'CANCELLED_DUE_TO_ROUTES',
			label: 'Cancelled due to Routes',
		},
		{
			value: 'CANCELLED_DUE_TO_THREAT',
			label: 'Cancelled due to Threat',
		},
	]
	state = {
		recents: {
			persons: [],
			locations: [],
			tasks: [],
			authorizationGroups: [],
		},
		tagSuggestions: [],
		showReportText: this.props.showReportText,
	}

	componentDidMount() {
		API.query(/* GraphQL */`
			locationRecents(maxResults:6) {
				list { uuid, name }
			}
			personRecents(maxResults:6) {
				list { uuid, name, rank, role, status, endOfTourDate, position { uuid, name, status, organization {uuid, shortName}, location {uuid, name} } }
			}
			taskRecents(maxResults:6) {
				list { uuid, shortName, longName }
			}
			authorizationGroupRecents(maxResults:6) {
				list { uuid, name, description }
			}
			tags {
				list { uuid, name, description }
			}
		`).then(data => {
			const newState = {
				recents: {
					locations: data.locationRecents.list,
					persons: data.personRecents.list,
					tasks: data.taskRecents.list,
					authorizationGroups: data.authorizationGroupRecents.list,
				},
				//ReactTags expects id and text properties
				tagSuggestions: data.tags.list.map(tag => ({id: tag.uuid, text: tag.name})),
			}
			this.setState(newState)
		})
	}

	render() {
		const { currentUser, edit, title, ...myFormProps } = this.props
		const { recents, tagSuggestions } = this.state

		return (
			<Formik
					enableReinitialize={true}
					onSubmit={this.onSubmit}
					validationSchema={Report.yupSchema}
					isInitialValid={() => Report.yupSchema.isValidSync(this.props.initialValues)}
					{...myFormProps}
			>
			{({
				handleSubmit,
				isSubmitting,
				isValid,
				dirty,
				errors,
				setFieldValue,
				values,
				submitForm,
				resetForm
			}) => {
				// Skip validation on save-as-draft!
				const action = <div>
					<Button key="saveAsDraft" bsStyle="primary" type="button" onClick={() => this.onSubmit(values, {resetForm})} disabled={isSubmitting}>Save as draft</Button>
					<Button key="submit" bsStyle="primary" type="button" onClick={submitForm} disabled={isSubmitting || !isValid}>Submit</Button>
				</div>
				return <div>
					<NavigationWarning isBlocking={dirty} />
					<Messages error={this.state.error} />
					<Form className="form-horizontal" method="post">
						<Fieldset title={title} action={action} />
						<Fieldset>
							<Field
								name="intent"
								label={ReportDefs.fieldLabels.intent}
								component={FieldHelper.renderInputField}
								componentClass="textarea"
								placeholder="What is the engagement supposed to achieve?"
								maxLength={250}
								onKeyUp={(event) => this.countCharsLeft('intentCharsLeft', 250, event)}
								extraColElem={<React.Fragment><span id="intentCharsLeft">{250 - this.props.initialValues.intent.length}</span> characters remaining</React.Fragment>}
								className="meeting-goal"
							/>

							<Field
								name="engagementDate"
								component={FieldHelper.renderSpecialField}
								value={values.engagementDate && moment(values.engagementDate).format()}
								onChange={(value, formattedValue) => setFieldValue('engagementDate', value)}
								addon={CALENDAR_ICON}
								widget={
									<DatePicker
										showTodayButton
										placeholder="When did it happen?"
										dateFormat="DD/MM/YYYY"
										showClearButton={false}
									/>
								}
							/>

							<Field
								name="location"
								component={FieldHelper.renderSpecialField}
								onChange={value => setFieldValue('location', value)}
								addon={LOCATION_ICON}
								extraColElem={recents.locations && recents.locations.length > 0 &&
									<div className="shortcut-list">
										<h5>Recent Locations</h5>
										{recents.locations.map(location => (
											<Button key={location.uuid} bsStyle="link" onClick={() => setFieldValue('location', location)}>Add {location.name}</Button>
										))}
									</div>
								}
								className="location-form-group"
								widget={
									<NewAutocomplete
										objectType={Location}
										valueKey="name"
										fields={Location.autocompleteQuery}
										placeholder="Start typing to search for the location where this happened..."
										queryParams={{status: Location.STATUS.ACTIVE}}
									/>
								}
							/>

							<Field
								name="cancelled"
								component={FieldHelper.renderSpecialField}
								label={ReportDefs.fieldLabels.cancelled}
								className="cancelled-checkbox"
								widget={
									<Checkbox
										inline
										checked={values.cancelled}
										onClick={event => (event.target.checked && !values.cancelledReason &&
											// set a default reason when cancelled has been checked and no reason has been selected
											setFieldValue('cancelledReason', this.cancelledReasonOptions[0].value)
										)}
									>
										This engagement was cancelled
									</Checkbox>
								}
							/>
							{values.cancelled &&
								<Field
									name="cancelledReason"
									label="due to"
									component={FieldHelper.renderSpecialField}
									className="cancelled-reason-form-group"
									widget={
										<Field component="select" className="form-control" >
											{this.cancelledReasonOptions.map(reason =>
												<option key={reason.value} value={reason.value}>{reason.label}</option>
											)}
										</Field>
									}
								/>
							}

							{!values.cancelled &&
								<Field
									name="atmosphere"
									label={ReportDefs.fieldLabels.atmosphere}
									component={FieldHelper.renderButtonToggleGroup}
									buttons={this.atmosphereButtons}
									className="atmosphere-form-group"
								/>
							}
							{!values.cancelled && values.atmosphere &&
								<Field
									name="atmosphereDetails"
									label={ReportDefs.fieldLabels.atmosphereDetails}
									component={FieldHelper.renderInputField}
									placeholder={`Why was this engagement ${values.atmosphere.toLowerCase()}? ${values.atmosphere === 'POSITIVE' ? "(optional)" : ""}`}
									className="atmosphere-details"
								/>
							}

							<Field
								name="reportTags"
								label={ReportDefs.fieldLabels.reportTags}
								component={FieldHelper.renderSpecialField}
								onChange={value => setFieldValue('reportTags', value)}
								widget={
									<ReportTags suggestions={tagSuggestions} />
								}
							/>
						</Fieldset>

						<Fieldset title={!values.cancelled ? "Meeting attendance" : "Planned attendance"} id="attendance-fieldset">
							<MultiSelector
								items={values.attendees}
								objectType={Person}
								queryParams={{status: [Person.STATUS.ACTIVE, Person.STATUS.NEW_USER], matchPositionName: true}}
								placeholder="Start typing to search for people who attended the meeting..."
								fields={Person.autocompleteQuery}
								template={Person.autocompleteTemplate}
								addFieldName='attendees'
								addFieldLabel="Attendees"
								addon={PEOPLE_ICON}
								renderSelected={<AttendeesTable attendees={values.attendees} onChange={value => setFieldValue('attendees', value)} showDelete={true} />}
								onChange={value => this.updateAttendees(setFieldValue, 'attendees', value)}
								shortcutsTitle={`Recent attendees`}
								shortcuts={recents.persons}
								renderExtraCol={true}
							/>
						</Fieldset>

						{!values.cancelled &&
							<Fieldset title={TaskDefs.longLabel} className="tasks-selector">
								<MultiSelector
									items={values.tasks}
									objectType={Task}
									queryParams={{status: Task.STATUS.ACTIVE}}
									placeholder={`Start typing to search for ${TaskDefs.shortLabel}...`}
									fields={Task.autocompleteQuery}
									template={Task.autocompleteTemplate}
									addFieldName='tasks'
									addFieldLabel={TaskDefs.shortLabel}
									addon={TASK_ICON}
									renderSelected={<TaskTable tasks={values.tasks} showDelete={true} />}
									onChange={value => setFieldValue('tasks', value)}
									shortcutsTitle={`Recent ${TaskDefs.shortLabel}`}
									shortcuts={recents.tasks}
									renderExtraCol={true}
								/>
							</Fieldset>
						}

						<Fieldset title={!values.cancelled ? "Meeting discussion" : "Next steps and details"}>
							{!values.cancelled &&
								<Field
									name="keyOutcomes"
									component={FieldHelper.renderInputField}
									componentClass="textarea"
									maxLength={250}
									onKeyUp={(event) => this.countCharsLeft('keyOutcomesCharsLeft', 250, event)}
									extraColElem={<React.Fragment><span id="keyOutcomesCharsLeft">{250 - this.props.initialValues.keyOutcomes.length}</span> characters remaining</React.Fragment>}
								/>
							}

							<Field
								name="nextSteps"
								component={FieldHelper.renderInputField}
								componentClass="textarea"
								maxLength={250}
								onKeyUp={(event) => this.countCharsLeft('nextStepsCharsLeft', 250, event)}
								extraColElem={<React.Fragment><span id="nextStepsCharsLeft">{250 - this.props.initialValues.nextSteps.length}</span> characters remaining</React.Fragment>}
							/>

							<Button className="center-block toggle-section-button" onClick={this.toggleReportText} id="toggleReportDetails" >
								{this.state.showReportText ? 'Hide' : 'Add'} detailed report
							</Button>

							<Collapse in={this.state.showReportText}>
								<div>
									<Field
										name="reportText"
										component={FieldHelper.renderSpecialField}
										onChange={value => setFieldValue('reportText', value)}
										widget={
											<RichTextEditor />
										}
										className="reportTextField"
									/>

									{(values.reportSensitiveInformation || !this.props.edit) &&
										<div>
											<Field
											name="reportSensitiveInformation.text"
												component={FieldHelper.renderSpecialField}
												label="Report sensitive information text"
												onChange={value => setFieldValue('reportSensitiveInformation.text', value)}
												widget={
													<RichTextEditor />
												}
												className="reportSensitiveInformationField"
											/>
											<MultiSelector
												items={values.authorizationGroups}
												objectType={AuthorizationGroup}
												queryParams={{status: AuthorizationGroup.STATUS.ACTIVE}}
												placeholder="Start typing to search for a group..."
												fields={AuthorizationGroup.autocompleteQuery}
												template={AuthorizationGroup.autocompleteTemplate}
												addFieldName='authorizationGroups'
												addFieldLabel='Authorization Groups'
												renderSelected={<AuthorizationGroupTable authorizationGroups={values.authorizationGroups} />}
												onChange={value => setFieldValue('authorizationGroups', value)}
												shortcutsTitle={`Recent Authorization Groups`}
												shortcuts={recents.authorizationGroups}
												renderExtraCol={true}
											/>
										</div>
									}
								</div>
							</Collapse>
						</Fieldset>

						<div className="submit-buttons">
							<div>
								<Button onClick={this.onCancel}>Cancel</Button>
							</div>
							<div>
								{/* Skip validation on save-as-draft! */}
								<Button id="formBottomSaveAsDraft" key="saveAsDraft" bsStyle="primary" type="button" onClick={() => this.onSubmit(values, {resetForm: resetForm})} disabled={isSubmitting}>Save as draft</Button>
								<Button id="formBottomSubmit" key="submit" bsStyle="primary" type="button" onClick={submitForm} disabled={isSubmitting || !isValid}>Submit</Button>
							</div>
						</div>
					</Form>
				</div>
			}}
			</Formik>
		)
	}

	updateAttendees = (setFieldValue, field, attendees) => {
		attendees.forEach(attendee => {
			if (!attendees.find(a2 => attendee.role === a2.role && a2.primary)) {
				attendee.primary = true
			} else {
				// Make sure field is 'controlled' by defining a value
				attendee.primary = attendee.primary || false
			}
		})
		setFieldValue(field, attendees)
	}

	countCharsLeft = (elemId, maxChars, event) => {
		// update the number of characters left
		const charsLeftElem = document.getElementById(elemId)
		charsLeftElem.innerHTML = maxChars - event.target.value.length
	}

	isEditMode = (values) => {
		// We're in edit mode when the form was started as an edit form, or when the report got an id after autosave
		return values.uuid
	}

	toggleReportText = () => {
		this.setState({showReportText: !this.state.showReportText})
	}

	onCancel = () => {
		this.props.history.goBack()
	}

	onSubmit = (values, form) => {
		return this.save(values, true)
			.then(response => this.onSubmitSuccess(response, values, form.resetForm))
			.catch(error => {
				this.setState({error})
				jumpToTop()
			})
	}

	onSubmitSuccess = (response, values, resetForm) => {
		const edit = this.isEditMode(values)
		const operation = edit ? 'updateReport' : 'createReport'
		const report = new Report({uuid: (response[operation].uuid ? response[operation].uuid : this.props.initialValues.uuid)})
		// After successful submit, reset the form in order to make sure the dirty
		// prop is also reset (otherwise we would get a blocking navigation warning)
		resetForm()
		this.props.history.replace(Report.pathForEdit(report))
		this.props.history.push({
			pathname: Report.pathFor(report),
			state: {
				success: 'Report saved',
			}
		})
	}

	save = (values, sendEmail) => {
		const report = Object.without(new Report(values), 'cancelled', 'reportTags', 'showReportText')
		if (!values.cancelled) {
			delete report.cancelledReason
		}
		else {
			//Empty fields which should not be set for cancelled reports.
			//They might have been set before the report has been marked as cancelled.
			report.atmosphere = null
			report.atmosphereDetails = ''
			report.tasks = null
			report.keyOutcomes = ''
		}
		//reportTags contains id's instead of uuid's (as that is what the ReactTags component expects)
		report.tags = values.reportTags.map(tag => ({uuid: tag.id}))
		//strip attendees fields not in data model
		report.attendees = report.attendees.map(a =>
			Object.without(a, 'firstName', 'lastName', 'position', '_loaded')
		)
		report.location = utils.getReference(report.location)
		const edit = this.isEditMode(values)
		const operation = edit ? 'updateReport' : 'createReport'
		let graphql = operation + '(report: $report' + (edit ? ', sendEditEmail: $sendEditEmail' : '') +')'
		graphql += '{ uuid reportSensitiveInformation { uuid text } }'
		const variables = { report: report }
		if (edit) {
			variables.sendEditEmail = sendEmail
		}
		const variableDef = '($report: ReportInput!' + (edit ? ', $sendEditEmail: Boolean!' : '') + ')'
		return API.mutation(graphql, variables, variableDef)
	}

}

const ReportForm = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseReportForm currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default withRouter(ReportForm)
