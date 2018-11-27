import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'
import RelatedObjectNotes, {GRAPHQL_NOTES_FIELDS} from 'components/RelatedObjectNotes'

import PositionForm from './Form'

import API from 'api'
import {Position} from 'models'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class PositionEdit extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	state = {
		position: new Position(),
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)
	}

	fetchData(props) {
		return API.query(/* GraphQL */`
			position(uuid:"${props.match.params.uuid}") {
				uuid, name, code, status, type
				location { uuid, name },
				associatedPositions { uuid, name, person { uuid, name, rank } },
				organization {uuid, shortName, longName, identificationCode, type},
				person { uuid, name, rank}
				${GRAPHQL_NOTES_FIELDS}
			}
		`).then(data => {
			function getPositionFromData() {
				const position = new Position(data.position)
				if ([Position.TYPE.ADVISOR, Position.TYPE.SUPER_USER, Position.TYPE.ADMINISTRATOR].includes(position.type)) {
					// For advisor types of positions, set the type to ADVISOR.
					position.type = Position.TYPE.ADVISOR
				}
				return position
			}

			this.setState({position: getPositionFromData()})
		})
	}

	render() {
		const { position } = this.state
		return (
			<div>
				<RelatedObjectNotes notes={position.notes} relatedObject={position.uuid && {relatedObjectType: 'positions', relatedObjectUuid: position.uuid}} />
				<Breadcrumbs items={[[`Position ${position.name}`, Position.pathFor(position)], ["Edit", Position.pathForEdit(position)]]} />
				<PositionForm edit initialValues={position} title={`Position ${position.name}`} />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(PositionEdit)
