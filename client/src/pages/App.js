import PropTypes from 'prop-types'
import React from 'react'
import Page from 'components/Page'
import {Grid, Row, Col} from 'react-bootstrap'

import TopBar from 'components/TopBar'
import Nav from 'components/Nav'

import API from 'api'
import {Person, Organization} from 'models'

import {Route, Switch} from 'react-router'
import Home from 'pages/Home'
import Search from 'pages/Search'
import RollupShow from 'pages/rollup/Show'
import ReportNew from 'pages/reports/New'
import ReportShow from 'pages/reports/Show'
import ReportEdit from 'pages/reports/Edit'
import ReportMinimal from 'pages/reports/Minimal'
import MyReports from 'pages/reports/MyReports'

export default class App extends Page {
	static PagePropTypes = {
		useNavigation: PropTypes.bool,
		fluidContainer: PropTypes.bool,
	}

	static childContextTypes = {
		app: PropTypes.object,
		currentUser: PropTypes.instanceOf(Person),
	}

	getChildContext() {
		return {
			app: this,
			currentUser: this.state.currentUser,
		}
	}

	constructor(props) {
		super(props)

		this.state = {
			currentUser: new Person(),
			settings: {},
			organizations: [],
		}

		this.state = this.processData(window.ANET_DATA)
	}

	componentWillReceiveProps() {
		// this is just to prevent App from refetching app settings on every
		// single page load. in the future we may wish to do something more
		// intelligent to refetch page settings
	}

	fetchData() {
		API.query(/* GraphQL */`
			person(f:me) {
				id, name, role, emailAddress, rank, status
				position {
					id, name, type, status, isApprover
					organization { id, shortName , allDescendantOrgs { id }}
				}
			}

			adminSettings(f:getAll) {
				key, value
			}

			organizationList(f:getTopLevelOrgs, type: ADVISOR_ORG) {
				list { id, shortName }
			}
		`).then(data => {
			data.person._loaded = true
			this.setState(this.processData(data), () => {
				// if this is a new user, redirect to the create profile page
// FIXME React16
//				if (this.state.currentUser.isNewUser()) {
//					History.replace('/onboarding')
//				}
			})
		})

	}

	processData(data) {
		const currentUser = new Person(data.person)
		let organizations = (data.organizationList && data.organizationList.list) || []
		organizations = Organization.fromArray(organizations)
		organizations.sort((a, b) => a.shortName.localeCompare(b.shortName))

		let settings = this.state.settings
		data.adminSettings.forEach(setting => settings[setting.key] = setting.value)

		return {currentUser, settings, organizations}
	}

	render() {
		const routing = <Switch>
			<Route exact path="/" component={Home} />
			<Route path="/search" component={Search} />
			<Route path="/rollup" component={RollupShow} />
			<Route
				path="/reports"
				render={({ match: { url } }) => (
					<Switch>
						<Route path={`${url}/new`} component={ReportNew} />
						<Route path={`${url}/:id/edit`} component={ReportEdit} />
						<Route path={`${url}/:id/min`} component={ReportMinimal} />
						<Route path={`${url}/mine`} component={MyReports} />
						<Route path={`${url}/:id`} component={ReportShow} />
	      </Switch>
	    )}
	    />
		</Switch>

		let pageProps = {} //FIXME React16: this.props.children.type.pageProps || {}
		return (
			<div className="anet">
				<TopBar
					currentUser={this.state.currentUser}
					settings={this.state.settings}
					minimalHeader={pageProps.minimalHeader}
					location={this.props.location} />

				<Grid componentClass="section" bsClass={pageProps.fluidContainer ? 'container-fluid' : 'container'}>
					{pageProps.useNavigation === false
						? <Row>
								<Col xs={12}>
									{routing}
								</Col>
							</Row>
						: <Row>
								<Col sm={3} className="hide-for-print">
									<Nav />
								</Col>
								<Col sm={9} className="primary-content">
									{routing}
								</Col>
							</Row>
					}
				</Grid>
			</div>
		)
	}
}