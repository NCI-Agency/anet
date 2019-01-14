import React from 'react'
import Page, {mapDispatchToProps, jumpToTop, propTypes as pagePropTypes} from 'components/Page'
import * as yup from 'yup'

import { Formik, Form, Field } from 'formik'
import * as FieldHelper from 'components/FieldHelper'

import Breadcrumbs from 'components/Breadcrumbs'
import {Grid, Col, Row, Alert, Button, Checkbox} from 'react-bootstrap'
import Autocomplete from 'components/Autocomplete'
import LinkTo from 'components/LinkTo'
import moment from 'moment'
import Messages from 'components/Messages'

import {Person} from 'models'
import Settings from 'Settings'

import API from 'api'

import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'

class MergePeople extends Page {

	static propTypes = {...pagePropTypes}

	state = {
		success: null,
		error: null,
	}
	yupSchema = yup.object().shape({
		loser: yup.object().nullable().default({})
			// eslint-disable-next-line no-template-curly-in-string
			.test('required-object', 'You must select a ${path}', value => value && value.uuid),
		winner: yup.object().nullable().default({})
			// eslint-disable-next-line no-template-curly-in-string
			.test('required-object', 'You must select a ${path}', value => value && value.uuid)
			.test(
				'not-equals-loser',
				'You selected the same person twice!',
				function(value) {
					const l = this.resolve(yup.ref('loser'))
					return value && value.uuid && l && l.uuid ? (value.uuid !== l.uuid) : true
				}
			)
			.test(
				'equal-roles',
				`You can only merge people of the same Role (i.e. ${Settings.fields.advisor.person.name}/${Settings.fields.principal.person.name})`,
				function(value) {
					const l = this.resolve(yup.ref('loser'))
					return value && value.role && l && l.role ? (value.role === l.role) : true
				}
			)
	})

	render() {
		const personFields = `uuid, name, emailAddress, domainUsername, createdAt, role, status, rank,
			position { uuid, name, type, organization { uuid, shortName, longName, identificationCode }},
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
				<Formik
					enableReinitialize={true}
					onSubmit={this.onSubmit}
					validationSchema={this.yupSchema}
					isInitialValid={() => this.yupSchema.isValidSync({})}
					initialValues={{loser: {}, winner: {}, copyPosition: false}}
				>
				{({
					isSubmitting,
					isValid,
					setFieldValue,
					setFieldTouched,
					values,
					submitForm
				}) => {
					const { loser, winner } = values
					return <Form>
						<Grid fluid>
							<Row>
								<Col md={6}>
									<Row>
										<Field
											name="loser"
											component={FieldHelper.renderSpecialField}
											vertical={true}
											onChange={value => {
												setFieldValue('loser', value)
												setFieldTouched('loser')  //onBlur doesn't work when selecting an option
												}
											}
											widget={
												<Autocomplete
													valueKey="name"
													placeholder="Select the duplicate person"
													objectType={Person}
													fields={personFields}
													template={person =>
														<LinkTo person={person} isLink={false} />
													}
												/>
											}
										/>
									</Row>
									<Row>
										{loser.uuid &&
											<fieldset>{this.showPersonDetails(new Person(loser))}</fieldset>
										}
									</Row>
								</Col>
								<Col md={6}>
									<Row>
										<Field
											name="winner"
											component={FieldHelper.renderSpecialField}
											vertical={true}
											onChange={value => {
												setFieldValue('winner', value)
												setFieldTouched('winner')  //onBlur doesn't work when selecting an option
												}
											}
											widget={
												<Autocomplete
													valueKey="name"
													placeholder="Select the OTHER duplicate person"
													objectType={Person}
													fields={personFields}
													template={person =>
														<LinkTo person={person} isLink={false} />
													}
												/>
											}
										/>
									</Row>
									<Row>
										{winner.uuid &&
											<fieldset>{this.showPersonDetails(new Person(winner))}</fieldset>
										}
									</Row>
								</Col>
							</Row>
							<Row>
								<Col md={12} >
									{loser.position && !winner.position &&
										<Field
											name="copyPosition"
											component={FieldHelper.renderSpecialField}
											label={null}
											widget={
												<Checkbox
													inline
													checked={values.copyPosition}
												>
												Set position on winner to {loser.position.name}
												</Checkbox>
											}
										/>
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
									<Button bsStyle="primary" bsSize="large" block onClick={submitForm} disabled={isSubmitting || !isValid}>
										Merge People
									</Button>
								</Col>
							</Row>
						</Grid>
					</Form>
				}}
				</Formik>
			</div>
		)
	}

	showPersonDetails = (person) => {
		return <React.Fragment>
			<Field
				name="uuid"
				component={FieldHelper.renderReadonlyField}
				humanValue={person.uuid}
				vertical={true}
			/>
			<Field
				name="name"
				component={FieldHelper.renderReadonlyField}
				humanValue={person.name}
				vertical={true}
			/>
			<Field
				name="status"
				component={FieldHelper.renderReadonlyField}
				humanValue={person.humanNameOfStatus()}
				vertical={true}
			/>
			<Field
				name="role"
				component={FieldHelper.renderReadonlyField}
				humanValue={person.humanNameOfRole()}
				vertical={true}
			/>
			<Field
				name="rank"
				component={FieldHelper.renderReadonlyField}
				humanValue={person.rank}
				vertical={true}
			/>
			<Field
				name="emailAddress"
				component={FieldHelper.renderReadonlyField}
				humanValue={person.emailAddress}
				vertical={true}
			/>
			<Field
				name="domainUsername"
				component={FieldHelper.renderReadonlyField}
				humanValue={person.domainUsername}
				vertical={true}
			/>
			<Field
				name="createdAt"
				component={FieldHelper.renderReadonlyField}
				humanValue={person.createdAt && moment(person.createdAt).format(Settings.dateFormats.forms.withTime)}
				vertical={true}
			/>
			<Field
				name="position"
				component={FieldHelper.renderReadonlyField}
				humanValue={person.position && <LinkTo position={person.position} />}
				vertical={true}
			/>
			<Field
				name="organization"
				component={FieldHelper.renderReadonlyField}
				humanValue={person.position && <LinkTo organization={person.position.organization} />}
				vertical={true}
			/>
			<Field
				name="numReports"
				label="Number of Reports Written"
				component={FieldHelper.renderReadonlyField}
				humanValue={person.authoredReports && person.authoredReports.totalCount}
				vertical={true}
			/>
			<Field
				name="numReportsIn"
				label="Number of Reports Attended"
				component={FieldHelper.renderReadonlyField}
				humanValue={person.attendedReports && person.attendedReports.totalCount}
				vertical={true}
			/>
		</React.Fragment>
	}

	onSubmit = (values, form) => {
		return this.save(values, form)
			.then(response => this.onSubmitSuccess(response, values, form))
			.catch(error => {
				this.setState({success: null, error: error})
				jumpToTop()
				console.error(error)
			})
	}

	onSubmitSuccess = (response, values, form) => {
		if (response.mergePeople) {
			this.props.history.push({
				pathname: Person.pathFor(values.winner),
				state: {success: 'People merged'}
			})
		}
	}

	save = (values, form) => {
		const { winner, loser, copyPosition } = values
		const operation = 'mergePeople'
		const graphql = operation + '(winnerUuid: $winnerUuid, loserUuid: $loserUuid, copyPosition: $copyPosition)'
		const variables = {
				winnerUuid: winner.uuid,
				loserUuid: loser.uuid,
				copyPosition: copyPosition
		}
		const variableDef = '($winnerUuid: String!, $loserUuid: String!, $copyPosition: Boolean!)'
		return API.mutation(graphql, variables, variableDef)
	}

}

export default connect(null, mapDispatchToProps)(withRouter(MergePeople))
