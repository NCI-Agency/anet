import React from 'react'
import { Table } from 'react-bootstrap'

import { Person } from 'models'
import LinkTo from 'components/LinkTo'
import Checkbox from 'components/Checkbox'

import _isEmpty from 'lodash/isEmpty'

const AttendeesOverlayTable = (props) => {
	const { items, selectedItems, addItem, removeItem } = props
	const selectedItemsUuids = selectedItems.map(a => a.uuid)
	return (
		<Table responsive hover striped className="attendeesOverlayTable">
			<thead>
				<tr>
					<th>Attendee</th>
					<th>Name</th>
					<th>Position</th>
					<th>Location</th>
					<th>Organization</th>
				</tr>
			</thead>
			<tbody>
				{Person.map(items, person => {
					const isSelected = selectedItemsUuids.includes(person.uuid)
					return <tr key={person.uuid}>
						<td style={{ textAlign: "center" }} onClick={isSelected ? () => removeItem(person) : () => addItem(person)}>
						{isSelected ?
							<Checkbox checked={isSelected} onChange={() => removeItem(person)} />
						:
							<Checkbox checked={isSelected} onChange={() => addItem(person)} />
						}
						</td>
						<td>
							<img src={person.iconUrl()} alt={person.role} height={20} className="person-icon" />
							<LinkTo person={person}/>
						</td>
						<td><LinkTo position={person.position} />{person.position && person.position.code ? `, ${person.position.code}`: ``}</td>
						<td><LinkTo whenUnspecified="" anetLocation={person.position && person.position.location} /></td>
						<td>{person.position && person.position.organization && <LinkTo organization={person.position.organization} />}</td>
					</tr>
				})}
			</tbody>
		</Table>
	)
}

export default AttendeesOverlayTable
