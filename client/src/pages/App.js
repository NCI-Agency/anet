import React, {PropTypes} from 'react'
import Page from 'components/Page'
import {Grid, Row, Col} from 'react-bootstrap'

import TopBar from 'components/TopBar'
import Nav from 'components/Nav'
import History from 'components/History'
import dict from 'dictionary'

import API from 'api'
import {Person, Organization} from 'models'

import dictionary from 'resources/dictionary.json'

export default class App extends Page {
	static PagePropTypes = {
		useNavigation: PropTypes.bool,
		fluidContainer: PropTypes.bool,
	}

	static propTypes = {
		children: PropTypes.element.isRequired,
	}

	static childContextTypes = {
		app: PropTypes.object,
		currentUser: PropTypes.instanceOf(Person),
//		dictionary: PropTypes.object,
	}

	getChildContext() {
		return {
			app: this,
			currentUser: this.state.currentUser,
//			dictionary: this.state.dictionary,
		}
	}

	constructor(props) {
		super(props)

		this.state = {
			currentUser: new Person(),
			settings: {},
			organizations: [],
//			dictionary: {}
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
					id, name, type, isApprover
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
				if (this.state.currentUser.isNewUser()) {
					History.replace('/onboarding')
				}
			})
		})

		//Fetch the dictionary.
		// @vassil dictionary.json temporarily moved to resouces. Difficulties to load from /dictionary.json when deployed as the files is moved under PUBLIC_URL
//		API.fetch('/dictonary.json').then(dictionary =>
			dict.setDictionary(dictionary)
//		)
	}

	processData(data) {
		let currentUser = new Person(data.person)
		let organizations = (data.organizationList && data.organizationList.list) || []
		organizations = Organization.fromArray(organizations)
		organizations.sort((a, b) => a.shortName.localeCompare(b.shortName))

		let settings = this.state.settings
		data.adminSettings.forEach(setting => settings[setting.key] = setting.value)
		let dictionary = this.state.dictionary

		return {currentUser, settings, organizations, dictionary}
	}

	render() {
		let pageProps = this.props.children.type.pageProps || {}
		return (
			<div className="anet">
				<TopBar
					minimalHeader={pageProps.minimalHeader}
					location={this.props.location} />

				<Grid componentClass="section" bsClass={pageProps.fluidContainer ? 'container-fluid' : 'container'}>
					{pageProps.useNavigation === false
						? <Row><Col xs={12}>{this.props.children}</Col></Row>
						: <Row>
							<Col sm={3} className="hide-for-print">
								<Nav />
							</Col>
							<Col sm={9} className="primary-content">
								{this.props.children}
							</Col>
						</Row>
					}
				</Grid>
			</div>
		)
	}
}
