import React from 'react'
import Page from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'
import NavigationWarning from 'components/NavigationWarning'

import PositionForm from './Form'

import API from 'api'
import {Position} from 'models'

export default class PositionEdit extends Page {
	static pageProps = {
		useNavigation: false
	}

	static modelName = 'Position'

	constructor(props) {
		super(props)

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

				<NavigationWarning original={this.state.originalPosition} current={position} />
				<PositionForm position={position} edit success={this.state.success} error={this.state.error} />
			</div>
		)
	}
}
