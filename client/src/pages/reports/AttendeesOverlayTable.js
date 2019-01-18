import React, { Component } from 'react'
import { Table } from 'react-bootstrap'
import { Classes, Icon } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import classNames from 'classnames'

import {Person} from 'models'
import LinkTo from 'components/LinkTo'

const AttendeesOverlayTable = (props) => {
	const { items, selectedItems, addItem, removeItem } = props
	const selectedItemsUuids = selectedItems.map(a => a.uuid)
	return (
		<Table responsive hover striped>
			<thead>
				<tr>
					<th />
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
						<td>
						{isSelected ?
							<button
								type="button"
								className={classNames(Classes.BUTTON)}
								title="Remove attendee"
								onClick={() => removeItem(person)}
							>
								<Icon icon={IconNames.REMOVE} />
							</button>
						:
						<button
							type="button"
							className={classNames(Classes.BUTTON)}
							title="Add attendee"
							onClick={() => addItem(person)}
							>
								<Icon icon={IconNames.ADD} />
							</button>
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
