import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import autobind from 'autobind-decorator'

import Form from 'components/Form'
import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import Messages, {setMessages} from 'components/Messages'
import Leaflet from 'components/Leaflet'
import LinkTo from 'components/LinkTo'
import ReportCollection from 'components/ReportCollection'

import GQL from 'graphqlapi'
import {Location, Person} from 'models'

import AppContext from 'components/AppContext'
import { connect } from 'react-redux'

class BaseLocationShow extends Page {

	static propTypes = {
		...pagePropTypes,
		currentUser: PropTypes.instanceOf(Person),
	}

	static modelName = 'Location'

	constructor(props) {
		super(props)
		this.state = {
			location: new Location(),
			reportsPageNum: 0
		}
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
			locationId: props.match.params.id,
		})

		let locationQuery = new GQL.Part(/* GraphQL */`
			location(id:${props.match.params.id}) {
				id, name, lat, lng, status
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
		let {location, reports} = this.state
		const { currentUser } = this.props
		let markers=[]
		let latlng = 'None'
		if (Location.hasCoordinates(location)) {
			latlng = location.lat + ', ' + location.lng
			markers.push({name: location.name, lat: location.lat, lng: location.lng})
		}

		return (
			<div>
				<Breadcrumbs items={[[location.name || 'Location', Location.pathFor(location)]]} />

				<Messages success={this.state.success} error={this.state.error} />

				<Form static formFor={location} horizontal >
					<Fieldset title={location.name} action={currentUser.isSuperUser() && <LinkTo anetLocation={location} edit button="primary">Edit</LinkTo>} >
						<Form.Field id="status" />

						<Form.Field id="latlng" value={latlng} label="Lat/Lon" />
					</Fieldset>

					<Leaflet markers={markers} />
				</Form>

				<Fieldset title="Reports at this location">
					<ReportCollection paginatedReports={reports} goToPage={this.goToReportsPage} mapId="reports" />
				</Fieldset>
			</div>
		)
	}

	@autobind
	goToReportsPage(pageNum) {
		this.setState({reportsPageNum: pageNum}, () => this.loadData())
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
