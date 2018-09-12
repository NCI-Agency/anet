import React from 'react'
import PropTypes from 'prop-types'
import Page, { mapDispatchToProps, propTypes as pagePropTypes } from 'components/Page'
import autobind from 'autobind-decorator'

import LoadingBar from 'react-redux-loading-bar'
import TopBar from 'components/TopBar'
import Nav from 'components/Nav'
import { Element } from 'react-scroll'

import API from 'api'
import { Person, Organization } from 'models'
import AppContext from 'components/AppContext'
import Routing from 'pages/Routing'
import { withRouter } from 'react-router-dom'
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
			floatingMenu: false
		}

		Object.assign(this.state, this.processData(window.ANET_DATA))
	}

	componentDidMount() {
		super.componentDidMount()
		// We want to hide the floating menu on navigation events
		this.unlistenHistory = this.props.history.listen((location, action) => {
			this.showFloatingMenu(false)
		})
	}

	componentWillUnmount() {
		super.componentWillUnmount()
		this.unlistenHistory()
	}

	componentDidUpdate(prevProps, prevState) {
		// TODO: We should decide what to do here, e.g. when to call this.loadData()
		// We do not want the behaviour of our super class Page, as that would
		// mean this.loadData() is called with each change in props or location…
	}

	fetchData(props) {
		return API.query(/* GraphQL */`
			me {
				id, name, role, emailAddress, rank, status
				position {
					id, name, type, status, isApprover
					organization { id, shortName , allDescendantOrgs { id }}
				}
			}

			adminSettings {
				key, value
			}

			organizationTopLevelOrgs(type: ADVISOR_ORG) {
				list { id, shortName }
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

	@autobind
	showFloatingMenu(floatingMenu) {
		this.setState({floatingMenu: floatingMenu})
	}

	render() {
		const { currentUser, settings, floatingMenu, organizations } = this.state
		const { pageProps, location } = this.props
		const heightTopBar = 125

		const container = {
			height: '100%',
			display: 'flex',
			overflow: 'hidden',
			paddingTop: heightTopBar
		}
		const mainViewportContainer = {
			height: '100%',
			width: '100%',
			display:'flex',
			flexDirection:'column'
		}
		const mainViewport = {
			flexGrow: 1,
			overflowY: 'auto',
			paddingLeft: 15,
			paddingRight: 15
		}
		const sidebarContainer = {
			height: '100%',
			display: 'flex',
			flexDirection: 'column',
			flexShrink: 0
		}
		const sidebar = {
			flexGrow: 1,
			overflowY: 'auto',
			minWidth: 200,
			paddingTop: 10,
			paddingLeft: 8,
			paddingRight: 8
		}
		const glassPane = {
			position: 'absolute',
			backgroundColor: `rgba(0, 0, 0, 0.6)`,
			width: '100%',
			height: '100vh',
			marginTop: -8,
			left: 0,
			zIndex: 99,
		}
		const loadingBar = {
			marginTop: -8,
			backgroundColor: '#29d'
		}

		return (
			<AppContext.Provider
				value={{
					appSettings: settings,
					currentUser: currentUser,
					loadAppData: this.loadData,
					showFloatingMenu: this.showFloatingMenu,
				}}
			>
				<div className="anet">
					<TopBar
						updateTopbarOffset={this.updateTopbarOffset}
						minimalHeader={pageProps.minimalHeader}
						location={location}
						toggleMenuAction={() => {
							this.showFloatingMenu(!floatingMenu)
						}} />

					<div style={container}>
						<LoadingBar showFastActions style={loadingBar} />
						<div
							style={floatingMenu === false ? null : glassPane}
							onClick={() => {
								this.showFloatingMenu(false)
							}}
						/>
						{(pageProps.useNavigation === true || floatingMenu === true) &&
							<div className={ floatingMenu === false ? "hidden-xs" : "nav-overlay"}>
								<div style={sidebarContainer}>
									<div style={sidebar}>
										<Nav organizations={organizations} />
									</div>
								</div>
							</div>
						}
						<div style={mainViewportContainer}>
							<Element
								style={mainViewport}
								name="mainViewport"
								id="main-viewport"
							>
								<Routing/>
							</Element>
						</div>
					</div>
				</div>
			</AppContext.Provider>
		)
	}
}

const mapStateToProps = (state, ownProps) => ({
	pageProps: state.pageProps,
	searchProps: state.searchProps
})

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(App))
