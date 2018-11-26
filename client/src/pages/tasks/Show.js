import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import autobind from 'autobind-decorator'

import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import Form from 'components/Form'
import LinkTo from 'components/LinkTo'
import Messages, {setMessages} from 'components/Messages'
import ReportCollection from 'components/ReportCollection'
import RelatedObjectNotes, {GRAPHQL_NOTES_FIELDS} from 'components/RelatedObjectNotes'
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

	static modelName = 'Task'

	constructor(props) {
		super(props)

		this.state = {
			task: new Task({
				uuid: props.match.params.uuid,
				shortName: props.match.params.shortName,
				longName: props.match.params.longName,
				responsibleOrg: props.match.params.responsibleOrg
			}),
			reportsPageNum: 0,
		}
		this.TaskCustomFieldRef1 = DictionaryField(Form.Field)
		this.TaskCustomField = DictionaryField(Form.Field)
		this.PlannedCompletionField = DictionaryField(Form.Field)
		this.ProjectedCompletionField = DictionaryField(Form.Field)
		this.TaskCustomFieldEnum1 = DictionaryField(Form.Field)
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
				${GRAPHQL_NOTES_FIELDS}
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
		let {task, reports} = this.state
		// Admins can edit tasks, or super users if this task is assigned to their org.
		const { currentUser } = this.props

		const taskShortLabel = Settings.fields.task.shortLabel

		let canEdit = currentUser.isAdmin()

		return (
			<div>
				<RelatedObjectNotes notes={task.notes} relatedObject={{relatedObjectType: 'tasks', relatedObjectUuid: task.uuid}} />
				<Breadcrumbs items={[[`${taskShortLabel} ${task.shortName}`, Task.pathFor(task)]]} />
				<Messages success={this.state.success} error={this.state.error} />

				<Form static formFor={task} horizontal>
					<Fieldset title={`${taskShortLabel} ${task.shortName}`} action={canEdit && <LinkTo task={task} edit button="primary">Edit</LinkTo>}>
						<Form.Field id="shortName" label={`${taskShortLabel} number`} />
						<Form.Field id="longName" label={`${taskShortLabel} description`} />
						<Form.Field id="status" />

						{task.responsibleOrg && task.responsibleOrg.uuid &&
							this.renderOrg()
						}

						{task.customFieldRef1 && task.customFieldRef1.uuid &&
							<this.TaskCustomFieldRef1 dictProps={Settings.fields.task.customFieldRef1} id="customFieldRef1">
								<LinkTo task={task.customFieldRef1}>{task.customFieldRef1.shortName} {task.customFieldRef1.longName}</LinkTo>
							</this.TaskCustomFieldRef1>
						}

						<this.TaskCustomField dictProps={Settings.fields.task.customField} id="customField"/>
						<this.PlannedCompletionField dictProps={Settings.fields.task.plannedCompletion} id="plannedCompletion" value={task.plannedCompletion && moment(task.plannedCompletion).format('D MMM YYYY')} />
						<this.ProjectedCompletionField dictProps={Settings.fields.task.projectedCompletion} id="projectedCompletion" value={task.projectedCompletion && moment(task.projectedCompletion).format('D MMM YYYY')} />
						<this.TaskCustomFieldEnum1 dictProps={Object.without(Settings.fields.task.customFieldEnum1, 'enum')} id="customFieldEnum1"/>
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

const TaskShow = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseTaskShow currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(TaskShow)
