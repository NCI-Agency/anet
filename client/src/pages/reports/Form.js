import PropTypes from 'prop-types'
import React, { Component } from 'react'

import {Checkbox, Button, Collapse, HelpBlock} from 'react-bootstrap'

import { Formik, Form, Field } from 'formik'
import * as FieldHelper from 'components/FieldHelper'

import moment from 'moment'
import _isEmpty from 'lodash/isEmpty'
import _cloneDeep from 'lodash/cloneDeep'
import pluralize from 'pluralize'

import Settings from 'Settings'

import AppContext from 'components/AppContext'
import Autocomplete from 'components/Autocomplete'
import Fieldset from 'components/Fieldset'
import CustomDateInput from 'components/CustomDateInput'
import ConfirmDelete from 'components/ConfirmDelete'
import ReportTags from 'components/ReportTags'
import AdvancedMultiSelect from 'components/AdvancedMultiSelect'
import AdvancedSingleSelect from 'components/AdvancedSingleSelect'
import MultiSelector from 'components/MultiSelector'
import LocationTable from 'components/LocationTable'
import TaskTable from 'components/TaskTable'
import RichTextEditor from 'components/RichTextEditor'
import Messages from 'components/Messages'
import NavigationWarning from 'components/NavigationWarning'
import AttendeesTable from './AttendeesTable'
import AttendeesOverlayTable from './AttendeesOverlayTable'
import AuthorizationGroupTable from './AuthorizationGroupTable'
import LinkTo from 'components/LinkTo'

import LOCATIONS_ICON from 'resources/locations.png'
import PEOPLE_ICON from 'resources/people.png'
import TASKS_ICON from 'resources/tasks.png'

import {Report, Location, Person, Task, AuthorizationGroup} from 'models'

import API from 'api'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import 'components/reactToastify.css'
import { jumpToTop } from 'components/Page'
import utils from 'utils'

import { withRouter } from 'react-router-dom'

class BaseReportForm extends Component {
	static propTypes = {
		initialValues: PropTypes.object,
		title: PropTypes.string,
		edit: PropTypes.bool,
		showSensitiveInfo: PropTypes.bool,
		currentUser: PropTypes.instanceOf(Person),
	}

	static defaultProps = {
		initialValues: new Report(),
		title: '',
		edit: false,
		showSensitiveInfo: false,
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
	// some autosave settings
	defaultTimeout = moment.duration(30, 'seconds')
	autoSaveSettings = {
		autoSaveTimeout: this.defaultTimeout.clone(),
		timeoutId: null,
		dirty: false,
		values: {},
	}
	state = {
		recents: {
			persons: [],
			locations: [],
			tasks: [],
			authorizationGroups: [],
		},
		tagSuggestions: [],
		showSensitiveInfo: this.props.showSensitiveInfo,
	}

	componentDidMount() {
		API.query(/* GraphQL */`
			locationRecents(maxResults:6) {
				list { uuid, name }
			}
			personRecents(maxResults:6) {
				list { uuid, name, rank, role, status, endOfTourDate, position { uuid, name, type, status, organization {uuid, shortName}, location {uuid, name} } }
			}
			taskRecents(maxResults:6) {
				list { uuid, shortName, longName, responsibleOrg { uuid, shortName} }
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

	componentWillUnmount() {
		window.clearTimeout(this.autoSaveSettings.timeoutId)
	}

	render() {
		const { currentUser, edit, title, ...myFormProps } = this.props
		const { recents, tagSuggestions } = this.state
		const submitText = currentUser.hasActivePosition() ? 'Preview and submit' : 'Save draft'
		const showAssignedPositionWarning = !currentUser.hasAssignedPosition()
		const showActivePositionWarning = currentUser.hasAssignedPosition() && !currentUser.hasActivePosition()
		const alertStyle = {top:132, marginBottom: '1rem', textAlign: 'center'}
		const supportEmail = Settings.SUPPORT_EMAIL_ADDR
		const supportEmailMessage = supportEmail ? `at ${supportEmail}` : ''
		const advisorPositionSingular = Settings.fields.advisor.position.name

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
				setFieldTouched,
				values,
				touched,
				submitForm,
				resetForm
			}) => {
				const locationFilters = {
					recentLocations: {
						label: 'Recent locations',
						searchQuery: false,
						listName: 'locationRecents',
						listArgs: 'maxResults:6',
					},
					activeLocations: {
						label: 'All',
						searchQuery: true,
						queryVars: {status: Location.STATUS.ACTIVE},
					},
				}
				const attendeesFilters = {
					recentContacts: {
						label: 'Recent contacts',
						searchQuery: false,
						listName: 'personRecents',
						listArgs: 'maxResults:6',
					},
					myColleagues: {
						label: 'My colleagues',
						searchQuery: true,
						queryVars: {role: Person.ROLE.ADVISOR, matchPositionName: true, orgUuid: this.props.currentUser.position.organization.uuid},
					},
					myCounterparts: {
						label: 'My counterparts',
						searchQuery: false,
						list: this.props.currentUser.position.associatedPositions.filter(ap => ap.person).map(ap => ap.person),
					},
					atLocation: {
						label: 'At location',
						searchQuery: true,
						doNotDisplay: !(values.location && values.location.uuid),
						queryVars: {locationUuid: (values.location && values.location.uuid ? values.location.uuid : null)},
					},
					activeAdvisors: {
						label: 'All advisors',
						searchQuery: true,
						queryVars: {role: Person.ROLE.ADVISOR, matchPositionName: true},
					},
					activePrincipals: {
						label: 'All principals',
						searchQuery: true,
						queryVars: {role: Person.ROLE.PRINCIPAL},
					},
				}
				const tasksFilters = {
						recentTasks: {
							label: 'Recent tasks',
							searchQuery: false,
							listName: 'taskRecents',
							listArgs: 'maxResults:6',
						},
						allTasks: {
							label: 'All tasks',
							searchQuery: true,
						},
						assignedToMyOrg: {
							label: 'Assigned to my organization',
							searchQuery: true,
							queryVars: {responsibleOrgUuid: this.props.currentUser.position.organization.uuid},
						},
					}
				const authorizationGroupsFilters = {
					recentAuthorizationGroups: {
						label: 'Recent authorization groups',
						searchQuery: false,
						listName: 'authorizationGroupRecents',
						listArgs: 'maxResults:6',
					},
					allAuthorizationGroups: {
						label: 'All authorization groups',
						searchQuery: true,
					},
				}
				// need up-to-date copies of these in the autosave handler
				this.autoSaveSettings.dirty = dirty
				this.autoSaveSettings.values = values
				this.autoSaveSettings.touched = touched
				if (!this.autoSaveSettings.timeoutId) {
					// Schedule the auto-save timer
					const autosaveHandler = () => this.autoSave({setFieldValue, setFieldTouched, resetForm})
					this.autoSaveSettings.timeoutId = window.setTimeout(autosaveHandler, this.autoSaveSettings.autoSaveTimeout.asMilliseconds())
				}
				//Only the author can delete a report, and only in DRAFT.
				const canDelete = !!values.uuid && (Report.isDraft(values.state) || Report.isRejected(values.state)) && Person.isEqual(currentUser, values.author)
				// Skip validation on save!
				const action = <div>
					<Button bsStyle="primary" type="button" onClick={() => this.onSubmit(values, {resetForm})} disabled={isSubmitting}>{submitText}</Button>
				</div>
				const locationAsList= values.location && values.location.uuid ? [values.location] : []
				return <div className="report-form">
					<NavigationWarning isBlocking={dirty} />
					<ToastContainer />
					<Messages error={this.state.error} />

					{showAssignedPositionWarning &&
						<div className="alert alert-warning" style={alertStyle}>
							You cannot submit a report: you are not assigned to a {advisorPositionSingular} position.<br/>
							Please contact your organization's super user(s) and request to be assigned to a {advisorPositionSingular} position.<br/>
							If you are unsure, you can also contact the support team {supportEmailMessage}.
						</div>
					}

					{showActivePositionWarning &&
						<div className="alert alert-warning" style={alertStyle}>
							You cannot submit a report: your assigned {advisorPositionSingular} position has an inactive status.<br/>
							Please contact your organization's super users and request them to assign you to an active {advisorPositionSingular} position.<br/>
							If you are unsure, you can also contact the support team {supportEmailMessage}.
						</div>
					}

					<Form className="form-horizontal" method="post">
						<Fieldset title={title} action={action} />
						<Fieldset>
							<Field
								name="intent"
								label={Settings.fields.report.intent}
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
								value={values.engagementDate}
								onChange={(value, formattedValue) => setFieldValue('engagementDate', value)}
								onBlur={() => setFieldTouched('engagementDate', true)}
								widget={<CustomDateInput id="engagementDate" />}
							>
								{values.engagementDate && moment().endOf("day").isBefore(values.engagementDate) &&
									<HelpBlock>
										<span className="text-success">This will create an upcoming engagement</span>
									</HelpBlock>
								}
							</Field>

							<AdvancedSingleSelect
								fieldName='location'
								fieldLabel='Location'
								placeholder="Search for the location where this happened..."
								selectedItems={locationAsList}
								renderSelected={<LocationTable items={locationAsList} showDelete={true} />}
								overlayColumns={['Location', 'Name']}
								overlayRenderRow={this.renderLocationOverlayRow}
								filterDefs={locationFilters}
								onChange={value => setFieldValue('location', value)}
								objectType={Location}
								fields={Location.autocompleteQuery}
								valueKey="name"
								addon={LOCATIONS_ICON}
								shortcutsTitle="Recent Locations"
								shortcuts={recents.locations}
								renderExtraCol={true}
							/>

							<Field
								name="cancelled"
								component={FieldHelper.renderSpecialField}
								label={Settings.fields.report.cancelled}
								widget={
									<Checkbox
										inline
										className="cancelled-checkbox"
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
									widget={
										<Field component="select" className="cancelled-reason-form-group form-control" >
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
									label={Settings.fields.report.atmosphere}
									component={FieldHelper.renderButtonToggleGroup}
									buttons={this.atmosphereButtons}
									className="atmosphere-form-group"
								/>
							}
							{!values.cancelled && values.atmosphere &&
								<Field
									name="atmosphereDetails"
									label={Settings.fields.report.atmosphereDetails}
									component={FieldHelper.renderInputField}
									placeholder={`Why was this engagement ${values.atmosphere.toLowerCase()}? ${values.atmosphere === 'POSITIVE' ? "(optional)" : ""}`}
									className="atmosphere-details"
								/>
							}

							<Field
								name="reportTags"
								label={Settings.fields.report.reportTags}
								component={FieldHelper.renderSpecialField}
								onChange={value => setFieldValue('reportTags', value)}
								widget={
									<ReportTags suggestions={tagSuggestions} />
								}
							/>
						</Fieldset>

						<Fieldset title={!values.cancelled ? "Meeting attendance" : "Planned attendance"} id="attendance-fieldset">
							<AdvancedMultiSelect
								fieldName='attendees'
								fieldLabel="Attendees"
								placeholder="Search for attendees who attended the meeting..."
								selectedItems={values.attendees}
								renderSelected={<AttendeesTable attendees={values.attendees} onChange={value => setFieldValue('attendees', value)} showDelete={true} />}
								overlayColumns={['Attendee', 'Name', 'Position', 'Location', 'Organization']}
								overlayRenderRow={this.renderAttendeeOverlayRow}
								filterDefs={attendeesFilters}
								onChange={value => this.updateAttendees(setFieldValue, 'attendees', value)}
								objectType={Person}
								queryParams={{status: [Person.STATUS.ACTIVE, Person.STATUS.NEW_USER]}}
								fields={Person.autocompleteQuery}
								addon={PEOPLE_ICON}
								shortcutsTitle="Recent Attendees"
								shortcuts={recents.persons}
								renderExtraCol={true}
							/>
						</Fieldset>

						<Fieldset title={Settings.fields.task.longLabel} className="tasks-selector">
							<AdvancedMultiSelect
								fieldName='tasks'
								fieldLabel={Settings.fields.task.shortLabel}
								placeholder={`Search for ${pluralize(Settings.fields.task.shortLabel)}...`}
								selectedItems={values.tasks}
								renderSelected={<TaskTable tasks={values.tasks} onChange={value => setFieldValue('tasks', value)} showDelete={true} showOrganization={true} />}
								overlayColumns={['Task', 'Name', 'Organization']}
								overlayRenderRow={this.renderTaskOverlayRow}
								filterDefs={tasksFilters}
								onChange={value => {
									setFieldValue('tasks', value)
									setFieldTouched('tasks', true)
								}}
								objectType={Task}
								queryParams={{status: Task.STATUS.ACTIVE}}
								fields={Task.autocompleteQuery}
								addon={TASKS_ICON}
								shortcutsTitle={`Recent ${pluralize(Settings.fields.task.shortLabel)}`}
								shortcuts={recents.tasks}
								renderExtraCol={true}
							/>
						</Fieldset>

						<Fieldset title={!values.cancelled ? "Meeting discussion" : "Next steps and details"} id="meeting-details">
							{!values.cancelled &&
								<Field
									name="keyOutcomes"
									label={Settings.fields.report.keyOutcomes}
									component={FieldHelper.renderInputField}
									componentClass="textarea"
									maxLength={250}
									onKeyUp={(event) => this.countCharsLeft('keyOutcomesCharsLeft', 250, event)}
									extraColElem={<React.Fragment><span id="keyOutcomesCharsLeft">{250 - this.props.initialValues.keyOutcomes.length}</span> characters remaining</React.Fragment>}
								/>
							}

							<Field
								name="nextSteps"
								label={Settings.fields.report.nextSteps}
								component={FieldHelper.renderInputField}
								componentClass="textarea"
								maxLength={250}
								onKeyUp={(event) => this.countCharsLeft('nextStepsCharsLeft', 250, event)}
								extraColElem={<React.Fragment><span id="nextStepsCharsLeft">{250 - this.props.initialValues.nextSteps.length}</span> characters remaining</React.Fragment>}
							/>

							<Field
								name="reportText"
								label={Settings.fields.report.reportText}
								component={FieldHelper.renderSpecialField}
								onChange={value => setFieldValue('reportText', value)}
								widget={
									<RichTextEditor
										className="reportTextField"
										onHandleBlur={() => setFieldTouched('reportText', true)}
									/>
								}
							/>

							<Button className="center-block toggle-section-button" onClick={this.toggleReportText} id="toggleSensitiveInfo" >
								{this.state.showSensitiveInfo ? 'Hide' : 'Add'} sensitive information
							</Button>

							<Collapse in={this.state.showSensitiveInfo}>
								{(values.reportSensitiveInformation || !this.props.edit) &&
									<div>
										<Field
											name="reportSensitiveInformation.text"
											component={FieldHelper.renderSpecialField}
											label="Report sensitive information text"
											onChange={value => setFieldValue('reportSensitiveInformation.text', value)}
											widget={
												<RichTextEditor className="reportSensitiveInformationField" />
											}
										/>
										<AdvancedMultiSelect
											fieldName='authorizationGroups'
											fieldLabel="Authorization Groups"
											placeholder="Search for authorization groups..."
											selectedItems={values.authorizationGroups}
											renderSelected={<AuthorizationGroupTable authorizationGroups={values.authorizationGroups} onChange={value => setFieldValue('authorizationGroups', value)} showDelete={true} />}
											overlayColumns={['Authorization Group', 'Name', 'Description']}
											overlayRenderRow={this.renderAuthorizationGroupOverlayRow}
											filterDefs={authorizationGroupsFilters}
											onChange={value => setFieldValue('authorizationGroups', value)}
											objectType={AuthorizationGroup}
											queryParams={{status: AuthorizationGroup.STATUS.ACTIVE}}
											fields={AuthorizationGroup.autocompleteQuery}
											shortcutsTitle="Recent Authorization Groups"
											shortcuts={recents.authorizationGroups}
											renderExtraCol={true}
										/>
									</div>
								}
							</Collapse>
						</Fieldset>

						<div className="submit-buttons">
							<div>
								<Button onClick={this.onCancel}>Cancel</Button>
							</div>
							<div>
								{this.state.autoSavedAt && <div>Last autosaved at {this.state.autoSavedAt.format(Settings.dateFormats.forms.withTime)}</div>}
								{canDelete &&
									<ConfirmDelete
										onConfirmDelete={() => this.onConfirmDelete(values.uuid, resetForm)}
										objectType="report"
										objectDisplay={values.uuid}
										bsStyle="warning"
										buttonLabel="Delete this report"
									/>
								}
								{/* Skip validation on save! */}
								<Button id="formBottomSubmit" bsStyle="primary" type="button" onClick={() => this.onSubmit(values, {resetForm: resetForm})} disabled={isSubmitting}>{submitText}</Button>
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
		return !!values.uuid
	}

	toggleReportText = () => {
		this.setState({showSensitiveInfo: !this.state.showSensitiveInfo})
	}

	autoSave = (form) => {
		const autosaveHandler = () => this.autoSave(form)
		// Only auto-save if the report has changed
		if (!this.autoSaveSettings.dirty) {
			// Just re-schedule the auto-save timer
			this.autoSaveSettings.timeoutId = window.setTimeout(autosaveHandler, this.autoSaveSettings.autoSaveTimeout.asMilliseconds())
		} else {
			const edit = this.isEditMode(this.autoSaveSettings.values)
			const operation = edit ? 'updateReport' : 'createReport'
			this.save(this.autoSaveSettings.values, false)
				.then(response => {
					const newValues = _cloneDeep(this.autoSaveSettings.values)
					Object.assign(newValues, response[operation])
					if (newValues.reportSensitiveInformation === null) {
						newValues.reportSensitiveInformation = {} // object must exist for Collapse children
					}
					// After successful autosave, reset the form with the new values in order to make sure the dirty
					// prop is also reset (otherwise we would get a blocking navigation warning)
					const touched = _cloneDeep(this.autoSaveSettings.touched) // save previous touched
					form.resetForm(newValues)
					Object.entries(touched).forEach(([field, value]) =>
						// re-set touched so we keep messages
						form.setFieldTouched(field, value)
					)
					this.autoSaveSettings.autoSaveTimeout = this.defaultTimeout.clone() // reset to default
					this.setState({autoSavedAt: moment()})
					toast.success('Your report has been automatically saved')
					// And re-schedule the auto-save timer
					this.autoSaveSettings.timeoutId = window.setTimeout(autosaveHandler, this.autoSaveSettings.autoSaveTimeout.asMilliseconds())
				}).catch(error => {
					// Show an error message
					this.autoSaveSettings.autoSaveTimeout.add(this.autoSaveSettings.autoSaveTimeout) // exponential back-off
					toast.error("There was an error autosaving your report; we'll try again in " + this.autoSaveSettings.autoSaveTimeout.humanize())
					// And re-schedule the auto-save timer
					this.autoSaveSettings.timeoutId = window.setTimeout(autosaveHandler, this.autoSaveSettings.autoSaveTimeout.asMilliseconds())
				})
		}
	}

	onConfirmDelete = (uuid, resetForm) => {
		const operation = 'deleteReport'
		let graphql = operation + '(uuid: $uuid)'
		const variables = { uuid: uuid }
		const variableDef = '($uuid: String!)'
		API.mutation(graphql, variables, variableDef)
			.then(data => {
				// After successful delete, reset the form in order to make sure the dirty
				// prop is also reset (otherwise we would get a blocking navigation warning)
				resetForm()
				this.props.history.push({
					pathname: '/',
					state: {success: 'Report deleted'}
				})
			}).catch(error => {
				this.setState({success: null, error: error})
				jumpToTop()
			})
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
		let report = new Report(values)
		const attendees = report.attendees
		report = Object.without(report, 'cancelled', 'reportTags', 'showSensitiveInfo', 'attendees')
		if (!values.cancelled) {
			delete report.cancelledReason
		}
		else {
			//Empty fields which should not be set for cancelled reports.
			//They might have been set before the report has been marked as cancelled.
			report.atmosphere = null
			report.atmosphereDetails = ''
			report.keyOutcomes = ''
		}
		//reportTags contains id's instead of uuid's (as that is what the ReactTags component expects)
		report.tags = values.reportTags.map(tag => ({uuid: tag.id}))
		//strip attendees fields not in data model
		report.attendees = attendees.map(a =>
			Object.without(a, 'firstName', 'lastName', 'position', '_loaded')
		)
		report.location = utils.getReference(report.location)
		const edit = this.isEditMode(values)
		const operation = edit ? 'updateReport' : 'createReport'
		let graphql = operation + '(report: $report' + (edit ? ', sendEditEmail: $sendEditEmail' : '') +')'
		graphql += '{ uuid state author { uuid } reportSensitiveInformation { uuid text } }'
		const variables = { report: report }
		if (edit) {
			variables.sendEditEmail = sendEmail
		}
		const variableDef = '($report: ReportInput!' + (edit ? ', $sendEditEmail: Boolean!' : '') + ')'
		return API.mutation(graphql, variables, variableDef)
	}

	renderLocationOverlayRow = (item) => {
		return (
			<React.Fragment key={item.uuid}>
				<td><LinkTo anetLocation={item} /></td>
			</React.Fragment>
		)
	}

	renderAttendeeOverlayRow = (item) => {
		return (
			<React.Fragment key={item.uuid}>
				<td>
					<LinkTo person={item}/>
				</td>
				<td><LinkTo position={item.position} />{item.position && item.position.code ? `, ${item.position.code}`: ``}</td>
				<td><LinkTo whenUnspecified="" anetLocation={item.position && item.position.location} /></td>
				<td>{item.position && item.position.organization && <LinkTo organization={item.position.organization} />}</td>
			</React.Fragment>
		)
	}

	renderTaskOverlayRow = (item) => {
		return (
			<React.Fragment key={item.uuid}>
				<td className="taskName"><LinkTo task={item}>{item.shortName} - {item.longName}</LinkTo></td>
				<td className="taskOrg" ><LinkTo organization={item.responsibleOrg} /></td>
			</React.Fragment>
		)
	}

	renderAuthorizationGroupOverlayRow = (item) => {
		return (
			<React.Fragment key={item.uuid}>
				<td>{item.name}</td>
				<td>{item.description}</td>
			</React.Fragment>
		)
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
