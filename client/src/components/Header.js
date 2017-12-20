import React, {Component} from 'react'
import {Link} from 'react-router'
import {Grid, Row, Col} from 'react-bootstrap'

import SearchBar from 'components/SearchBar'
import CreateButton from 'components/CreateButton'

import logo from 'resources/logo.png'

const backgroundCss = {
	background: '#fff',
	paddingTop: '58px',
	height: '132px',
	boxShadow: '0 4px 3px 0 rgba(0,0,0,0.1)',
	zIndex: 100
}

export default class Header extends Component {
	render() {
		return (
			<header style={backgroundCss} className="header">
				<Grid>
					<Row>
						<Col xs={3}>
							{
								this.props.minimalHeader ?
									<span className="logo"><img src={logo} alt="ANET Logo" /></span> :
									<Link to="/" className="logo">
										<img src={logo} alt="ANET logo" />
									</Link>
							}
						</Col>

						{ !this.props.minimalHeader &&
							<Col xs={7} className="middle-header">
								<SearchBar />
							</Col>
						}

						{ !this.props.minimalHeader &&
							<Col xs={2}>
								<div className="pull-right">
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
