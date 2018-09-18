import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import LoadingBar from 'react-redux-loading-bar'
import TopBar from 'components/TopBar'
import Nav from 'components/Nav'
import { Element } from 'react-scroll'


const container = {
	height: '100%',
	display: 'flex',
	overflow: 'hidden',
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
	marginTop: -5,
	left: 0,
	zIndex: 99,
}
const loadingBar = {
	marginTop: -5,
	backgroundColor: '#29d'
}


class ResponsiveLayout extends Component {
	static propTypes = {
		pageProps: PropTypes.shape({
			minimalHeader: PropTypes.bool,
		}).isRequired,
		pageHistory: PropTypes.object.isRequired,
		location: PropTypes.object.isRequired,
		sidebarData: PropTypes.array,
		children: PropTypes.node
	}

	constructor(props) {
		super(props)

		this.state = {
			floatingMenu: false,
			topbarHeight: 0,
		}
	}

	componentDidMount() {
		// We want to hide the floating menu on navigation events
		this.unlistenHistory = this.props.pageHistory.listen((location, action) => {
			this.showFloatingMenu(false)
		})
	}

	componentWillUnmount() {
		this.unlistenHistory()
	}

	handleTopbarHeight = (topbarHeight) => {
		this.setState({topbarHeight})
	}

	showFloatingMenu = (floatingMenu) => {
		this.setState({floatingMenu: floatingMenu})
	}

	render() {
		const { floatingMenu, topbarHeight } = this.state
		const { pageProps, location, sidebarData, children } = this.props

		return (
			<div className="anet">
				<TopBar
					topbarHeight={this.handleTopbarHeight}
					minimalHeader={pageProps.minimalHeader}
					location={location}
					toggleMenuAction={() => {
						this.showFloatingMenu(!floatingMenu)
					}} />

				<div style={{...container, paddingTop: topbarHeight}}>
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
									{<Nav showFloatingMenu={this.showFloatingMenu} organizations={sidebarData} topbarOffset={topbarHeight} />}
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
							{children}
						</Element>
					</div>
				</div>
			</div>
		)
	}
}

export default withRouter(ResponsiveLayout)
