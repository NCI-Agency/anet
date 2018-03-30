import PropTypes from 'prop-types'
import React from 'react'
import Page from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'

import PositionForm from './Form'

import API from 'api'
import {Position} from 'models'

import { setPageProps, PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class PositionEdit extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

	static modelName = 'Position'

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			position: new Position(),
			originalPosition: new Position(),
		}
	}

	fetchData(props) {
		API.query(/* GraphQL */`
			position(id:${props.match.params.id}) {
				id, name, code, status, type
				location { id, name },
				associatedPositions { id, name, person { id, name, rank } },
				organization {id, shortName, longName, identificationCode, type},
				person { id, name}
			}
		`).then(data => {
			function getPositionFromData() {
				let position = new Position(data.position)
				if (position.type === Position.TYPE.ADVISOR || position.type === Position.TYPE.SUPER_USER || position.type === Position.TYPE.ADMINISTRATOR) {
					// For advisor types of positions, set the type to ADVISOR and add
					// permissions property. The permissions property allows selecting a
					// specific advisor type and is removed in the onSubmit method in the
					// Form.js.
					position.permissions = position.type
					position.type = Position.TYPE.ADVISOR
				}
				return position
			}

			this.setState({position: getPositionFromData(), originalPosition: getPositionFromData()})
		})
	}

	render() {
		let position = this.state.position

		return (
			<div>
				<Breadcrumbs items={[[`Edit ${position.name}`, Position.pathForEdit(position)]]} />

				<PositionForm original={this.state.originalPosition} position={position} edit success={this.state.success} error={this.state.error} />
			</div>
		)
	}
}

const mapDispatchToProps = (dispatch, ownProps) => ({
	setPageProps: pageProps => dispatch(setPageProps(pageProps))
})

export default connect(null, mapDispatchToProps)(PositionEdit)
