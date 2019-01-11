import React, {Component} from 'react'
import {Link} from 'react-router-dom'
import {Grid, Row, Col} from 'react-bootstrap'

import SearchBar from 'components/SearchBar'
import CreateButton from 'components/CreateButton'
import {Person} from 'models'

import logo from 'resources/logo.png'
import menuLogo from 'resources/anet-menu.png'

const backgroundCss = {
	background: '#fff',
	paddingTop: '2em',
	paddingBottom: '1em',
	zIndex: 100,
	boxShadow: '0 4px 6px hsla(0, 0%, 0%, 0.2)',
}

export default class Header extends Component {
	render() {
		return (
			<header style={backgroundCss} className="header">
				<Grid fluid>
					<Row>
						<Col xs={3} sm={3} md={2} lg={2}>
								{
									this.props.minimalHeader ?
										<span className="logo hidden-xs"><img src={logo} alt="ANET Logo" /></span> :
										<Link to="/" onClick={this.props.onHomeClick} className="logo hidden-xs">
											<img src={logo} alt="ANET logo" />
										</Link>
								}
								<span className="logo visible-xs"><img src={menuLogo} alt="ANET Menu" onClick={this.props.toggleMenuAction}/></span>
						</Col>

						{ !this.props.minimalHeader &&
							<Col xs={6} sm={7} md={8} lg={9} className="middle-header">
								<SearchBar />
							</Col>
						}

						{ !this.props.minimalHeader &&
							<Col xs={3} sm={2} md={2} lg={1}>
								<div style={{paddingRight: 5}} className="pull-right">
									<CreateButton />
								</div>
							</Col>
						}
					</Row>
				</Grid>
			</header>
		)
	}
}
