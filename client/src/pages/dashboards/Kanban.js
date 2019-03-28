import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import {Settings} from 'api'

import {Task} from 'models'

import {Panel} from 'react-bootstrap'
import LinkTo from 'components/LinkTo'

import GQL from 'graphqlapi'
import moment from 'moment'

import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'


class Kanban extends Page {

	static propTypes = {...pagePropTypes}

	constructor(props) {
		super(props)
		this.state = {
			tasks: []
		}
	}

	fetchData(props) {
		const taskQuery = {
			pageNum: 0,
			pageSize: 0,
			status: Task.STATUS.ACTIVE
		}
		const tasksPart = new GQL.Part(/* GraphQL */`
			taskList(query: $taskQuery) {
				list {
					uuid, longName, shortName, customFieldEnum1, createdAt, updatedAt
					responsibleOrg { uuid, shortName}
					allReports: reports {
						totalCount
					}
				}
			}`)
			.addVariable("taskQuery", "TaskSearchQueryInput", taskQuery)
		GQL.run([tasksPart]).then(data => {
			const tasks = data.taskList.list
			this.setState({
				tasks: tasks
			})
		})
	}

	render() {
		return (
			<div style={{
				display: 'flex',
				flexDirection: 'row'
			}}>
			{Settings.dashboards.kanban.columns.map((column) => {
				return (
					<Column
						name={ column.name }
						taskUUIDs={ column.tasks }
						key={ column.name }
						tasks={this.state.tasks}
					/>
				)
			})}
			</div>
		)
	}
}

class Column extends React.Component {
	render() {
		const tasks = this.props.tasks.filter(task => this.props.taskUUIDs.indexOf(task.uuid) > -1)
		const counters = tasks.reduce((counter,task) => {
			counter[task.customFieldEnum1] = ++counter[task.customFieldEnum1] || 1
			return counter
		},{})

		return  (
			<Panel style={{flex: '1 1 0%', margin: '4px'}}>
				<Panel.Heading>
			   		<strong>
						<em>{this.props.name} </em>
						{Object.entries(Settings.fields.task.customFieldEnum1.enum).map((entry,index) => {
							return (
							<React.Fragment>
								{index!=0 && "/" }
								<span key={entry[1].label} style={{backgroundColor: entry[1].color}}>{counters[entry[0]]||0}</span>
							</React.Fragment>	)
						})}
			   		</strong>
				</Panel.Heading>
				<Panel.Body style={{padding: '4px'}}>
					{tasks.map((task) =>
						<Card task={task} key={task.uuid}/>)}
				</Panel.Body>
			</Panel >
		)
	}
}

class Card extends React.Component {
	constructor(props, context) {
		super(props, context)

		this.state = {open: false}
	}

	render() {
		const { open } = this.state
		return (
			<Panel
				onClick={() => this.setState({ open: !open })}
				style={{
					backgroundColor: this.props.task.customFieldEnum1 && // TODO: use optional chaining
									Settings.fields.task.customFieldEnum1.enum[this.props.task.customFieldEnum1] &&
									(Settings.fields.task.customFieldEnum1.enum[this.props.task.customFieldEnum1].color || '#f9f7f7'),
					margin: '3px'
				}}>
				<div>
					<LinkTo task={this.props.task} ><strong>{this.props.task.shortName}</strong></LinkTo>
					{' '}
					<em><small>
						(<strong>{this.props.task.allReports.totalCount}</strong> engagements)
					</small></em><br/>
					{/* TODO make a single line when collapsed <div style={this.state.open ? {} : {textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}}> */}
					<div>
						<small>{ this.props.task.longName }</small>
					</div>
				</div>

				{this.state.open &&
				<Panel.Body>
					<small>
						<table cellPadding="4">
							<tbody>
								<tr>
									<td>created at:</td>
									<td> {moment(this.props.task.createdAt).format(Settings.dateFormats.forms.withTime)}</td>
								</tr>
								<tr>
									<td>updated at:</td>
									<td> {moment(this.props.task.updatedAt).format(Settings.dateFormats.forms.withTime)}</td>
								</tr>
								<tr>
									<td>responsible org:</td>
									<td> <LinkTo organization={this.props.task.responsibleOrg}/></td>
								</tr>
							</tbody>
						</table>
					</small>
				</Panel.Body>
				}
			</Panel>)
	}
}

export default connect(null, mapDispatchToProps)(withRouter(Kanban))
