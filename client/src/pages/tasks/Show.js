import React, {PropTypes} from 'react'
import Page from 'components/Page'
import autobind from 'autobind-decorator'

import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import Form from 'components/Form'
import LinkTo from 'components/LinkTo'
import Messages, {setMessages} from 'components/Messages'
import ReportCollection from 'components/ReportCollection'
import DictionaryField from '../../HOC/DictionaryField'

import Settings from 'Settings'
import GQL from 'graphqlapi'
import {Task} from 'models'

import moment from 'moment'

export default class TaskShow extends Page {
	static contextTypes = {
		currentUser: PropTypes.object.isRequired,
		app: PropTypes.object.isRequired,
	}

	static modelName = 'Task'

	constructor(props) {
		super(props)

		this.state = {
			task: new Task({
				id: props.params.id,
				shortName: props.params.shorName,
				longName: props.params.longName,
				responsibleOrg: props.params.responsibleOrg
			}),
			reportsPageNum: 0,
		}
		this.TaskCustomField = DictionaryField(Form.Field)
		this.PlannedCompletionField = DictionaryField(Form.Field)
		this.ProjectedCompletionField = DictionaryField(Form.Field)
		this.TaskCustomFieldEnum = DictionaryField(Form.Field)
		this.TaskCustomFieldEnum2 = DictionaryField(Form.Field)

		setMessages(props,this.state)
	}

	fetchData(props) {
		let reportsQuery = new GQL.Part(/* GraphQL */`
			reports: reportList(query: $reportsQuery) {
				pageNum, pageSize, totalCount, list {
					${ReportCollection.GQL_REPORT_FIELDS}
				}
			}
		`).addVariable("reportsQuery", "ReportSearchQuery", {
			pageSize: 10,
			pageNum: this.state.reportsPageNum,
			taskId: props.params.id,
		})

		let taskQuery = new GQL.Part(/* GraphQL */`
			task(id:${props.params.id}) {
				id, shortName, longName, status,
				customField, customFieldEnum, customFieldEnum2,
				plannedCompletion, projectedCompletion,
				responsibleOrg {id, shortName, longName, identificationCode}
			}
		`)

		GQL.run([reportsQuery, taskQuery]).then(data => {
            this.setState({
                task: new Task(data.task),
				reports: data.reports,
            })
        })
	}

	render() {
		let {task, reports} = this.state
		// Admins can edit tasks, or super users if this task is assigned to their org.
		let currentUser = this.context.currentUser

		const taskShortLabel = Settings.fields.task.shortLabel

		let canEdit = currentUser.isAdmin()

		return (
			<div>
				<Breadcrumbs items={[[`${taskShortLabel} ${task.shortName}`, Task.pathFor(task)]]} />
				<Messages success={this.state.success} error={this.state.error} />

				<Form static formFor={task} horizontal>
					<Fieldset title={`${taskShortLabel} ${task.shortName}`} action={canEdit && <LinkTo task={task} edit button="primary">Edit</LinkTo>}>
						<Form.Field id="shortName" label={`${taskShortLabel} number`} />
						<Form.Field id="longName" label={`${taskShortLabel} description`} />
						<Form.Field id="status" />

						{task.responsibleOrg && task.responsibleOrg.id && 
							this.renderOrg()
						}

						<this.TaskCustomField dictProps={Settings.fields.task.customField} id="customField"/>
						<this.PlannedCompletionField dictProps={Settings.fields.task.plannedCompletion} id="plannedCompletion" value={task.plannedCompletion && moment(task.plannedCompletion).format('D MMM YYYY')} />
						<this.ProjectedCompletionField dictProps={Settings.fields.task.projectedCompletion} id="projectedCompletion" value={task.projectedCompletion && moment(task.projectedCompletion).format('D MMM YYYY')} />
						<this.TaskCustomFieldEnum dictProps={Object.without(Settings.fields.task.customFieldEnum, 'enum')} id="customFieldEnum"/>
						<this.TaskCustomFieldEnum2 dictProps={Object.without(Settings.fields.task.customFieldEnum2, 'enum')} id="customFieldEnum2"/>

					</Fieldset>
				</Form>

				<Fieldset title={`Reports for this ${taskShortLabel}`}>
					<ReportCollection paginatedReports={reports} goToPage={this.goToReportsPage} />
				</Fieldset>
			</div>
		)
	}

    @autobind
    renderOrg() {
		let responsibleOrg = this.state.task.responsibleOrg
		return (
			<Form.Field id="responsibleOrg" label="Responsible Organization" >
				<LinkTo organization={responsibleOrg}>
					{responsibleOrg.shortName} {responsibleOrg.longName} {responsibleOrg.identificationCode}
				</LinkTo>
			</Form.Field>
		)
	}

	@autobind
	goToReportsPage(pageNum) {
		this.setState({reportsPageNum: pageNum}, () => this.loadData())
	}
}
