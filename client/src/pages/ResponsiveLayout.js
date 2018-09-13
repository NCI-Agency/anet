import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { withStyles } from '@material-ui/core/styles'
import Drawer from '@material-ui/core/Drawer'
import IconButton from '@material-ui/core/IconButton'
import Hidden from '@material-ui/core/Hidden'
import CssBaseline from '@material-ui/core/CssBaseline'
import MenuIcon from '@material-ui/icons/Menu'
import Divider from '@material-ui/core/Divider'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'

import LoadingBar from 'react-redux-loading-bar'
import Nav from 'components/Nav'

import TopBar from 'components/TopBar'
import Header from 'components/Header'

const drawerWidth = 240
const appBarHeight = 118

const styles = theme => ({
	root: {
		flexGrow: 1,
		height: '100vh',
		zIndex: 1,
		overflow: 'auto',
		position: 'relative',
		display: 'flex',
	},
	appBar: {
		zIndex: theme.zIndex.drawer + 1,
	},
	navIconHide: {
		height: 38,
		color: '#337ab7',
		[theme.breakpoints.up('md')]: {
			display: 'none',
		},
	},
	drawerPaper: {
		width: drawerWidth,
		backgroundColor: '#f5f5f5',
		borderColor: '#eee',
		padding: theme.spacing.unit,
		[theme.breakpoints.up('md')]: {
			position: 'fixed',
			top: appBarHeight,
		},
	},
	drawerHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'flex-end',
		padding: '0 8px',
		...theme.mixins.toolbar,
	},
	content: {
		position: 'relative',
		flexGrow: 1,
		backgroundColor: '#f2f2f2',
		padding: theme.spacing.unit * 3,
	},
	contentDrawer: {
		[theme.breakpoints.up('md')]: {
			marginLeft: drawerWidth,
		},
	}
})

class ResponsiveLayout extends React.Component {
	state = {
		mobileOpen: false,
	};

	handleDrawerToggle = () => {
		this.setState(state => ({ mobileOpen: !state.mobileOpen }))
	};

	render() {
		const { classes, drawerContent, theme, topbarOffset } = this.props
		const sidebarButton =
			<IconButton
				color="inherit"
				aria-label="Open drawer"
				onClick={this.handleDrawerToggle}
				className={classes.navIconHide}
			>
				<MenuIcon />
			</IconButton>

		const topbar =
			<TopBar
				updateTopbarOffset={this.props.updateTopbarOffset}
				minimalHeader={this.props.minimalHeader}
				location={this.props.location}
				className={classes.appBar}
			>
				<Header sidebarButton={sidebarButton} minimalHeader={false} />
				<LoadingBar showFastActions style={{ backgroundColor: '#29d', marginTop: '1px' }} />
			</TopBar>

		const navigation =
			<Nav
				organizations={drawerContent}
				topbarOffset={topbarOffset}
			/>

		return (
			<React.Fragment>
				<CssBaseline />
				<div className={classes.root}>
					{topbar}
					<Hidden mdUp>
						<Drawer
							variant="temporary"
							anchor={theme.direction === 'rtl' ? 'right' : 'left'}
							open={this.state.mobileOpen}
							onClose={this.handleDrawerToggle}
							classes={{
								paper: classes.drawerPaper,
							}}
							ModalProps={{
								keepMounted: true, // Better open performance on mobile.
							}}
						>
						<div className={classes.drawerHeader}>
							<IconButton onClick={this.handleDrawerToggle}>
								{theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
							</IconButton>
						</div>
						<Divider />
							{navigation}
						</Drawer>
					</Hidden>
					{this.props.useNavigation &&
						<Hidden smDown implementation="css">
							<Drawer
								variant="permanent"
								open
								classes={{
									paper: classes.drawerPaper,
								}}
							>
								{navigation}
							</Drawer>
					</Hidden>
					}
					<main className={classNames(classes.content, this.props.useNavigation && classes.contentDrawer)}>
						<div className={classes.toolbar} />
						{this.props.children}
					</main>
				</div>
			</React.Fragment>
		)
	}
}

ResponsiveLayout.propTypes = {
	classes: PropTypes.object.isRequired,
}

export default withStyles(styles, { withTheme: true })(ResponsiveLayout)
