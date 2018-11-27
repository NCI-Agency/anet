import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import { Formik, Form, Field } from 'formik'
import * as FieldHelper from 'components/FieldHelper'

import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import Messages, {setMessages} from 'components/Messages'
import Leaflet from 'components/Leaflet'
import LinkTo from 'components/LinkTo'
import ReportCollection from 'components/ReportCollection'
import RelatedObjectNotes, {GRAPHQL_NOTES_FIELDS} from 'components/RelatedObjectNotes'

import GQL from 'graphqlapi'
import {Location, Person} from 'models'

import AppContext from 'components/AppContext'
import { connect } from 'react-redux'

class BaseLocationShow extends Page {

	static propTypes = {
		...pagePropTypes,
		currentUser: PropTypes.instanceOf(Person),
	}

	state = {
		location: new Location(),
		reportsPageNum: 0,
		success: null,
		error: null,
	}

	constructor(props) {
		super(props)
		setMessages(props,this.state)
	}

	fetchData(props) {
		const reportsQuery = new GQL.Part(/* GraphQL */`
			reports: reportList(query: $reportsQuery) {
				pageNum, pageSize, totalCount, list {
					${ReportCollection.GQL_REPORT_FIELDS}
				}
			}
		`).addVariable("reportsQuery", "ReportSearchQueryInput", {
			pageSize: 10,
			pageNum: this.state.reportsPageNum,
			locationUuid: props.match.params.uuid,
		})

		const locationQuery = new GQL.Part(/* GraphQL */`
			location(uuid:"${props.match.params.uuid}") {
				uuid, name, lat, lng, status
				${GRAPHQL_NOTES_FIELDS}
			}
		`)

		return GQL.run([reportsQuery, locationQuery]).then(data => {
            this.setState({
                location: new Location(data.location),
				reports: data.reports,
            })
        })
	}

	render() {
		const { location, reports } = this.state
		const { currentUser, ...myFormProps } = this.props

		const canEdit = currentUser.isSuperUser()

		function Coordinate(props) {
			const coord = typeof props.coord === 'number' ? Math.round(props.coord * 1000) / 1000 : '?'
			return <span>{coord}</span>
		}

		return (
			<Formik
				enableReinitialize={true}
				initialValues={location}
				{...myFormProps}
			>
			{({
				values,
			}) => {
				const marker = {
					id: location.uuid || 0,
					name: location.name || '',
				}
				if (Location.hasCoordinates(location)) {
					Object.assign(marker, {
						lat: location.lat,
						lng: location.lng,
					})
				}
				const action = canEdit && <LinkTo anetLocation={location} edit button="primary">Edit</LinkTo>
				return <div>
					<RelatedObjectNotes notes={location.notes} relatedObject={location.uuid && {relatedObjectType: 'locations', relatedObjectUuid: location.uuid}} />
					<Breadcrumbs items={[[`Location ${location.name}`, Location.pathFor(location)]]} />
					<Messages success={this.state.success} error={this.state.error} />
					<Form className="form-horizontal" method="post">
						<Fieldset title={`Location ${location.name}`} action={action} />
						<Fieldset>
							<Field
								name="name"
								component={FieldHelper.renderReadonlyField}
							/>

							<Field
								name="status"
								component={FieldHelper.renderReadonlyField}
								humanValue={Location.humanNameOfStatus}
							/>

							<Field
								name="location"
								component={FieldHelper.renderReadonlyField}
								humanValue={
									<React.Fragment>
										<Coordinate coord={location.lat} />, <Coordinate coord={location.lng} />
									</React.Fragment>
								}
							/>
						</Fieldset>

						<Leaflet markers={[marker]} />
					</Form>

					<Fieldset title={`Reports at this Location`}>
						<ReportCollection paginatedReports={reports} goToPage={this.goToReportsPage} mapId="reports" />
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

const LocationShow = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseLocationShow currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(LocationShow)
