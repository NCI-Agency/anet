import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import { Formik, Form, Field } from 'formik'
import * as FieldHelper from 'components/FieldHelper'

import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import LinkTo from 'components/LinkTo'
import Messages, {setMessages} from 'components/Messages'
import ReportCollection from 'components/ReportCollection'
import DictionaryField from '../../HOC/DictionaryField'

import Settings from 'Settings'
import GQL from 'graphqlapi'
import {Person, Task} from 'models'

import moment from 'moment'

import AppContext from 'components/AppContext'
import { connect } from 'react-redux'

class BaseTaskShow extends Page {
	static propTypes = {
		...pagePropTypes,
		currentUser: PropTypes.instanceOf(Person),
	}

	TaskCustomFieldRef1 = DictionaryField(Field)
	TaskCustomField = DictionaryField(Field)
	PlannedCompletionField = DictionaryField(Field)
	ProjectedCompletionField = DictionaryField(Field)
	TaskCustomFieldEnum1 = DictionaryField(Field)
	TaskCustomFieldEnum2 = DictionaryField(Field)
	state = {
		task: new Task(),
		reportsPageNum: 0,
		success: null,
		error: null,
	}

	constructor(props) {
		super(props)
		setMessages(props, this.state)
	}

	fetchData(props) {
		let reportsQuery = new GQL.Part(/* GraphQL */`
			reports: reportList(query: $reportsQuery) {
				pageNum, pageSize, totalCount, list {
					${ReportCollection.GQL_REPORT_FIELDS}
				}
			}
		`).addVariable("reportsQuery", "ReportSearchQueryInput", {
			pageSize: 10,
			pageNum: this.state.reportsPageNum,
			taskUuid: props.match.params.uuid,
		})

		let taskQuery = new GQL.Part(/* GraphQL */`
			task(uuid:"${props.match.params.uuid}") {
				uuid, shortName, longName, status,
				customField, customFieldEnum1, customFieldEnum2,
				plannedCompletion, projectedCompletion,
				responsibleOrg { uuid, shortName, longName, identificationCode },
				customFieldRef1 { uuid, shortName, longName }
			}
		`)

		return GQL.run([reportsQuery, taskQuery]).then(data => {
            this.setState({
                task: new Task(data.task),
				reports: data.reports,
            })
        })
	}

	render() {
		const { task, reports } = this.state
		const { currentUser, ...myFormProps } = this.props

		const taskShortLabel = Settings.fields.task.shortLabel
		const customFieldRef1 = Settings.fields.task.customFieldRef1
		const customFieldEnum1 = Settings.fields.task.customFieldEnum1
		const customFieldEnum2 = Settings.fields.task.customFieldEnum2
		const plannedCompletion = Settings.fields.task.plannedCompletion
		const projectedCompletion = Settings.fields.task.projectedCompletion

		// Admins can edit tasks, or super users if this task is assigned to their org.
		const canEdit = currentUser.isAdmin()

		return (
			<Formik
				enableReinitialize={true}
				initialValues={task}
				{...myFormProps}
			>
			{({
				values,
			}) => {
				const action = canEdit && <LinkTo task={task} edit button="primary">Edit</LinkTo>
				return <div>
					<Breadcrumbs items={[[`${taskShortLabel} ${task.shortName}`, Task.pathFor(task)]]} />
					<Messages success={this.state.success} error={this.state.error} />
					<Form className="form-horizontal" method="post">
						<Fieldset title={`${taskShortLabel} ${task.shortName}`} action={action} />
						<Fieldset>
							<Field
								name="shortName"
								label={`${taskShortLabel} number`}
								component={FieldHelper.renderReadonlyField}
							/>

							<Field
								name="longName"
								label={`${taskShortLabel} description`}
								component={FieldHelper.renderReadonlyField}
							/>

							<Field
								name="status"
								component={FieldHelper.renderReadonlyField}
							/>

							<Field
								name="responsibleOrg"
								label="Responsible organization"
								component={FieldHelper.renderReadonlyField}
								humanValue={values.responsibleOrg &&
									<LinkTo organization={values.responsibleOrg}>
										{values.responsibleOrg.shortName} {values.responsibleOrg.longName} {values.responsibleOrg.identificationCode}
									</LinkTo>
								}
							/>

							{customFieldRef1 &&
								<this.TaskCustomFieldRef1
									dictProps={customFieldRef1}
									name="customFieldRef1"
									component={FieldHelper.renderReadonlyField}
									humanValue={values.customFieldRef1 &&
										<LinkTo task={values.customFieldRef1}>
											{values.customFieldRef1.shortName} {values.customFieldRef1.longName}
										</LinkTo>
									}
								/>
							}

							<this.TaskCustomField
								dictProps={Settings.fields.task.customField}
								name="customField"
								component={FieldHelper.renderReadonlyField}
							/>

							{plannedCompletion &&
								<this.PlannedCompletionField
									dictProps={plannedCompletion}
									name="plannedCompletion"
									component={FieldHelper.renderReadonlyField}
									humanValue={values.plannedCompletion && moment(values.plannedCompletion).format('D MMM YYYY')}
								/>
							}

							{projectedCompletion &&
								<this.ProjectedCompletionField
									dictProps={projectedCompletion}
									name="projectedCompletion"
									component={FieldHelper.renderReadonlyField}
									humanValue={values.projectedCompletion && moment(values.projectedCompletion).format('D MMM YYYY')}
								/>
							}

							{customFieldEnum1 &&
								<this.TaskCustomFieldEnum1
									dictProps={Object.without(customFieldEnum1, 'enum')}
									name="customFieldEnum1"
									component={FieldHelper.renderReadonlyField}
								/>
							}

							{customFieldEnum2 &&
								<this.TaskCustomFieldEnum2
									dictProps={Object.without(customFieldEnum2, 'enum')}
									name="customFieldEnum2"
									component={FieldHelper.renderReadonlyField}
								/>
							}
						</Fieldset>
					</Form>

					<Fieldset title={`Reports for this ${taskShortLabel}`}>
						<ReportCollection paginatedReports={reports} goToPage={this.goToReportsPage} />
					</Fieldset>
				</div>
			}}
			</Formik>
		)
	}

	goToReportsPage = (pageNum) => {
		this.setState({reportsPageNum: pageNum}, this.loadData)
	}
}

const TaskShow = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseTaskShow currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(TaskShow)
