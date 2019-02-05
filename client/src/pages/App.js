import React from 'react'
import PropTypes from 'prop-types'
import Page, { mapDispatchToProps, propTypes as pagePropTypes } from 'components/Page'
import ResponsiveLayout from 'components/ResponsiveLayout'

import API from 'api'
import { Person, Organization } from 'models'
import AppContext from 'components/AppContext'
import Routing from 'pages/Routing'
import { connect } from 'react-redux'


class App extends Page {
	static propTypes = {
		...pagePropTypes,
		pageProps: PropTypes.object,
		searchProps: PropTypes.object,
	}

	constructor(props) {
		super(props)

		this.state = {
			pageProps: props.pageProps,
			currentUser: new Person(),
			settings: {},
			organizations: [],
		}

		Object.assign(this.state, this.processData(window.ANET_DATA))
	}

	componentDidUpdate(prevProps, prevState) {
		// TODO: We should decide what to do here, e.g. when to call this.loadData()
		// We do not want the behaviour of our super class Page, as that would
		// mean this.loadData() is called with each change in props or location…
	}

	fetchData(props) {
		return API.query(/* GraphQL */`
			me {
				uuid, name, rank, role, emailAddress, status
				position {
					uuid, name, code, type, status, isApprover
					organization { uuid, shortName , allDescendantOrgs { uuid }}
					location {uuid, name}
				}
			}

			adminSettings {
				key, value
			}

			organizationTopLevelOrgs(type: ADVISOR_ORG) {
				list { uuid, shortName }
			}
		`).then(data => {
			data.me._loaded = true
			this.setState(this.processData(data), () => {
				// if this is a new user, redirect to the create profile page
				if (this.state.currentUser.isNewUser()) {
					this.props.history.replace('/onboarding')
				}
			})
		})
	}

	processData(data) {
		const currentUser = new Person(data.me)
		let organizations = (data.organizationTopLevelOrgs && data.organizationTopLevelOrgs.list) || []
		organizations = Organization.fromArray(organizations)
		organizations.sort((a, b) => a.shortName.localeCompare(b.shortName))

		let settings = this.state.settings
		data.adminSettings.forEach(setting => settings[setting.key] = setting.value)

		return {currentUser, settings, organizations}
	}

	render() {
		const { currentUser, settings, organizations } = this.state
		const { pageProps, history, location } = this.props
		if (currentUser._loaded !== true) { return null }

		return (
			<AppContext.Provider
				value={{
					appSettings: settings,
					currentUser: currentUser,
					loadAppData: this.loadData,
				}}
			>
				<ResponsiveLayout
					pageProps={pageProps}
					pageHistory={history}
					location={location}
					sidebarData={organizations}
				>
					<Routing/>
				</ResponsiveLayout>
			</AppContext.Provider>
		)
	}
}

const mapStateToProps = (state, ownProps) => ({
	pageProps: state.pageProps,
	searchProps: state.searchProps
})

export default connect(mapStateToProps, mapDispatchToProps)(App)
