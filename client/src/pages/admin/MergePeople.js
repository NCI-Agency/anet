import React from 'react'
import Page, {mapDispatchToProps, jumpToTop, propTypes as pagePropTypes} from 'components/Page'
import autobind from 'autobind-decorator'

import Breadcrumbs from 'components/Breadcrumbs'
import Form from 'components/Form'
import {Grid, Col, Row, Alert, Button, Checkbox} from 'react-bootstrap'
import Autocomplete from 'components/Autocomplete'
import LinkTo from 'components/LinkTo'
import moment from 'moment'
import Messages from 'components/Messages'

import Settings from 'Settings'
import {Person} from 'models'

import API from 'api'

import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'

class MergePeople extends Page {

	static propTypes = {...pagePropTypes}

	constructor(props) {
		super(props)

		this.state = {
			success: null,
			error: null,
			winner: {},
			loser: {},
			copyPosition: false
		}
	}

	render() {
		let {winner, loser, copyPosition} = this.state
		let errors = this.validate()

		let personFields = `id, name, emailAddress, domainUsername, createdAt, role, status, rank,
			position { id, name, organization { id, shortName, longName, identificationCode }},
			authoredReports(pageNum:0,pageSize:1) { totalCount }
			attendedReports(pageNum:0,pageSize:1) { totalCount }`

		return (
			<div>
				<Breadcrumbs items={[['Merge People Tool', '/admin/mergePeople']]} />
				<Messages error={this.state.error} success={this.state.success} />

				<h2 className="form-header">Merge People Tool</h2>
				<Alert bsStyle="warning">
					<p><b>Important</b>: Select the two duplicative people below. The loser account will
					be deleted and all reports will be transferred over to the winner.  </p>
				</Alert>
				<Grid fluid>
					<Row>
						<Col md={6}><h2>Loser</h2></Col>
						<Col md={6}><h2>Winner</h2></Col>
					</Row>
					<Row>
						<Col md={6}>
							<Autocomplete valueKey="name"
								value={loser}
								placeholder="Select the duplicate person"
								objectType={Person}
								fields={personFields}
								template={person =>
									<LinkTo person={person} isLink={false} />
								}
								onChange={this.selectLoser}
							/>
						</Col>
						<Col md={6}>
							<Autocomplete valueKey="name"
								value={winner}
								placeholder="Select the OTHER duplicate person"
								objectType={Person}
								fields={personFields}
								template={person =>
									<LinkTo person={person} isLink={false} />
								}
								onChange={this.selectWinner}
							/>
						</Col>
					</Row>
					<Row>
						<Col md={6}>
							{loser.id &&
								<fieldset>{this.showPersonDetails(new Person(loser))}</fieldset>
							}
						</Col>
						<Col md={6}>
							{winner.id &&
								<fieldset>{this.showPersonDetails(new Person(winner))}</fieldset>
							}
						</Col>
					</Row>
					<Row>
						<Col md={12} >
							{errors.length === 0 && loser.position && !winner.position &&
								<Checkbox value={copyPosition} onChange={this.toggleCopyPosition} >
									Set position on winner to {loser.position.name}
								</Checkbox>
							}
							{loser.position && winner.position &&
								<Alert bsStyle="danger">
									<b>Danger:</b> Position on Loser ({loser.position.name}) will be left unfilled
								</Alert>
							}
						</Col>
					</Row>
					<Row>
						<Col md={12}>
						{errors.length > 0 &&
								<Alert bsStyle="danger">
									<ul>
									{errors.map((error, index) =>
										<li key={index} >{error}</li>
									)}
									</ul>
								</Alert>
							}
							<Button bsStyle="primary" bsSize="large" block onClick={this.submit} disabled={errors.length > 0} >
								Merge People
							</Button>
						</Col>
					</Row>
				</Grid>

			</div>
		)
	}

	@autobind
	selectLoser(loser) {
		this.setState({loser: loser})
	}

	@autobind
	selectWinner(winner) {
		this.setState({winner: winner})
	}

	@autobind
	toggleCopyPosition() {
		this.setState({copyPosition: !this.state.copyPosition})
	}

	@autobind
	validate() {
		let {winner, loser} = this.state
		let errors = []

		if (!winner.id || !loser.id) {
			errors.push("You must select two people")
			return errors
		}
		if (winner.id === loser.id) {
			errors.push("You selected the same person twice!")
		}
		if (winner.role !== loser.role) {
			errors.push(`You can only merge people of the same Role (i.e. ${Settings.fields.advisor.person.name}/${Settings.fields.principal.person.name})`)
		}

		return errors
	}


	@autobind
	showPersonDetails(person) {
		return <Form static formFor={person} >
			<Form.Field id="id" />
			<Form.Field id="name" />
			<Form.Field id="status">{person.humanNameOfStatus()}</Form.Field>
			<Form.Field id="role">{person.humanNameOfRole()}</Form.Field>
			<Form.Field id="rank" />
			<Form.Field id="emailAddress" />
			<Form.Field id="domainUsername" />
			<Form.Field id="createdAt" >
				{person.createdAt && moment(person.createdAt).format("DD MMM YYYY HH:mm:ss")}
			</Form.Field>
			<Form.Field id="position" >
				{person.position && <LinkTo position={person.position} />}
			</Form.Field>
			<Form.Field id="organization" >
				{person.position && <LinkTo organization={person.position.organization} /> }
			</Form.Field>
			<Form.Field id="numReports" label="Number of Reports Written" >
				{person.authoredReports && person.authoredReports.totalCount }
			</Form.Field>
			<Form.Field id="numReportsIn" label="Number of Reports Attended" >
				{person.attendedReports && person.attendedReports.totalCount }
			</Form.Field>
		</Form>
	}

	@autobind
	submit(event) {
		event.stopPropagation()
		event.preventDefault()
		let {winner, loser, copyPosition} = this.state
		let operation = 'mergePeople'
		let graphql = operation + '(winnerId: $winnerId, loserId: $loserId, copyPosition: $copyPosition)'
		const variables = {
				winnerId: winner.id,
				loserId: loser.id,
				copyPosition: copyPosition
		}
		const variableDef = '($winnerId: Int!,$loserId: Int!,$copyPosition: Boolean!,)'
		API.mutation(graphql, variables, variableDef, {disableSubmits: true})
			.then(data => {
				if (data[operation]) {
					this.props.history.push({
						pathname: Person.pathFor(this.state.winner),
						state: {success: 'People merged'}
					})
				}
			}).catch(error => {
				this.setState({success: null, error: error})
				jumpToTop()
				console.error(error)
			})
	}

}

export default connect(null, mapDispatchToProps)(withRouter(MergePeople))
