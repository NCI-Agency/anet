import React, {Component, PropTypes} from 'react'
import {Table} from 'react-bootstrap'

import {AuthorizationGroup} from 'models'

export default class AuthorizationGroupTable extends Component {
	static propTypes = {
		authorizationGroups: PropTypes.array.isRequired,
	}

	render() {
		let authorizationGroups = AuthorizationGroup.fromArray(this.props.authorizationGroups)
		return <Table striped>
			<thead>
				<tr>
					<th>Name</th>
					<th>Description</th>
					<th>Positions</th>
					<th>Status</th>
				</tr>
			</thead>

			<tbody>
				{authorizationGroups.map(authorizationGroup =>
					<tr key={authorizationGroup.id}>
						<td>{authorizationGroup.name}</td>
						<td>{authorizationGroup.description}</td>
						<td>{authorizationGroup.positions.map(position => <div key={position.id}>{position.name}</div>)}</td>
						<td>{authorizationGroup.status} </td>
					</tr>
				)}
			</tbody>
		</Table>
	}
}
