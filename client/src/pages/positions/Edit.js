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
			position(id:${props.params.id}) {
				id, name, code, status, type
				location { id, name },
				associatedPositions { id, name, person { id, name, rank } },
				organization {id, shortName, longName, type},
				person { id, name}
			}
		`).then(data => {
			function getPositionFromData() {
				let position = new Position(data.position)
				//need to set type to either ADVISOR or PRINCIPAL and add permissions property.
				//This is undone in the onSubmit method in the Form.
				position.permissions = position.type
				if (position.type === Position.TYPE.SUPER_USER || position.type === Position.TYPE.ADMINISTRATOR) {
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
