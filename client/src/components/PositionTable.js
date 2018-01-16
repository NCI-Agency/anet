import React, {Component, PropTypes} from 'react'
import {Table} from 'react-bootstrap'

import LinkTo from 'components/LinkTo'
import {Position} from 'models'

import utils from 'utils'

import REMOVE_ICON from 'resources/delete.png'

export default class PositionTable extends Component {
	static propTypes = {
		positions: PropTypes.array.isRequired,
		showDelete: PropTypes.bool,
		onDelete: PropTypes.func
	}

	render() {
		let positions = Position.fromArray(this.props.positions)

		return <Table responsive hover striped>
			<thead>
				<tr>
					<th>Name</th>
					<th>Org</th>
					<th>Current Occupant</th>
					<th>Status</th>
					<th />
				</tr>
			</thead>
			<tbody>
				{Position.map(positions, pos => {
					let nameComponents =  []
					pos.name && nameComponents.push(pos.name)
					pos.code && nameComponents.push(pos.code)
					return <tr key={pos.id}>
							<td>
								<img src={pos.iconUrl()} alt={pos.type} height={20} className="person-icon" />
								<LinkTo position={pos} >{nameComponents.join(' - ')}</LinkTo>
							</td>
							<td>{pos.organization && <LinkTo organization={pos.organization} />}</td>
							<td>{pos.person && <LinkTo person={pos.person} />}</td>
							<td>{utils.sentenceCase(pos.status)}</td>
							{this.props.showDelete && <td onClick={this.props.onDelete.bind(this, pos)} id={'positionDelete_' + pos.id} >
								<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt="Remove position" /></span>
							</td>}
						</tr>
					}
				)}
			</tbody>
		</Table>

	}
}
