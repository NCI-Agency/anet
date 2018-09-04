import React, {Component} from 'react'
import {Link} from 'react-router-dom'
import {Grid, Row, Col, Image} from 'react-bootstrap'

import SearchBar from 'components/SearchBar'
import CreateButton from 'components/CreateButton'
import {Person} from 'models'

import logo from 'resources/logo.png'

const backgroundCss = {
	background: '#fff',
	paddingTop: '2em',
	height: '100%',
	boxShadow: '0 4px 3px 0 rgba(0,0,0,0.1)',
	zIndex: 100
}

export default class Header extends Component {
	render() {
		return (
			<header style={backgroundCss} className="header">
				<Grid fluid>
					<Row>
						<Col mdHidden lgHidden xs={2} sm={1}>
							{this.props.sidebarButton}
						</Col>
						<Col xs={6} sm={2} md={3} lg={2}>
							{
								this.props.minimalHeader ?
									<span className="logo"><img src={logo} alt="ANET Logo" /></span> :
									<Link to="/" className="logo">
										<Image src={logo} alt="ANET logo" className="img-responsive" />
									</Link>
							}
						</Col>
						{ !this.props.minimalHeader &&
							<Col xs={4} smPush={7} sm={2} mdPush={6} md={3} lgPush={8} lg={2}>
								<div className="pull-right create-button">
									<CreateButton />
								</div>
							</Col>
						}
						{ !this.props.minimalHeader &&
							<Col xs={12} smPull={2} sm={7} mdPull={3} md={6} lgPull={2} lg={8}>
								<SearchBar />
							</Col>
						}


					</Row>
				</Grid>
			</header>
		)
	}
}
