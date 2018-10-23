import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import LoadingBar from 'react-redux-loading-bar'
import TopBar from 'components/TopBar'
import Nav from 'components/Nav'
import { Element } from 'react-scroll'


const anetContainer = {
	display: 'flex',
	flexDirection: 'column',
	height:'100vh',
	overflow: 'hidden'
}
const contentContainer = {
	flex:'1 1 auto',
	display:'flex',
	flexDirection:'row',
	minWidth: 0,
	minHeight: 0,
	overflow: 'hidden',
}
const mainViewportContainer = {
	flex:'1 1 auto',
	overflowY: 'auto',
	overflowX: 'hidden',
	paddingTop: 5,
	paddingLeft: 18,
	paddingRight: 18,
}
const sidebarContainer = {
	flex:'0 0 auto',
	overflowY: 'auto',
	overflowX: 'hidden',
	msOverflowStyle: '-ms-autohiding-scrollbar',
	paddingRight: 18,
	paddingLeft: 15,
	paddingBottom: 5,
}
const sidebar = {
	flexGrow: 1,
	minWidth: 200,
	paddingTop: 15,
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
		const sidebarClass = floatingMenu === false ? "hidden-xs" : "nav-overlay"

		return (
			<div style={anetContainer} className="anet" >
				<TopBar
					topbarHeight={this.handleTopbarHeight}
					minimalHeader={pageProps.minimalHeader}
					location={location}
					toggleMenuAction={() => {
						this.showFloatingMenu(!floatingMenu)
					}} />
				<div style={contentContainer}>
					<LoadingBar showFastActions style={loadingBar} />
					<div
						style={floatingMenu === false ? null : glassPane}
						onClick={() => {
							this.showFloatingMenu(false)
						}}
					/>
					{(pageProps.useNavigation === true || floatingMenu === true) &&
						<div
							style={sidebarContainer}
							className={`main-sidebar ${sidebarClass}`}
						>
								<div style={sidebar}>
									{<Nav showFloatingMenu={this.showFloatingMenu} organizations={sidebarData} topbarOffset={topbarHeight} />}
							</div>
						</div>
					}
					<Element
						style={mainViewportContainer}
						name="mainViewport"
						id="main-viewport"
					>
						{children}
					</Element>
				</div>
			</div>
		)
	}
}

export default withRouter(ResponsiveLayout)
