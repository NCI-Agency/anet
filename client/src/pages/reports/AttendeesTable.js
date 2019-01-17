import React, { Component } from 'react'
import {Checkbox, Table} from 'react-bootstrap'
import { Classes, Icon } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import classNames from 'classnames'

import _isEmpty from 'lodash/isEmpty'

import {Person} from 'models'
import LinkTo from 'components/LinkTo'

export default class AttendeesTable extends Component {
	render() {
		return (
			<Table striped condensed hover responsive id="attendeesTable">
				<thead>
					<tr>
						<th style={{textAlign: 'center'}}>Primary</th>
						<th>Name</th>
						<th>Position</th>
						<th>Location</th>
						<th>Organization</th>
						{this.props.showDelete && <th></th>}
					</tr>
				</thead>
				<tbody>
					{Person.map(this.props.attendees, person => this.renderAttendeeRow(person))}
				</tbody>
			</Table>
		)
	}

	renderAttendeeRow = (person) => {
		return (
			<tr key={person.uuid}>
				<td className="primary-attendee">
					<Checkbox checked={person.primary} disabled={this.props.disabled} onChange={() => !this.props.disabled && this.setPrimaryAttendee(person)} />
				</td>

				<td>
					<img src={person.iconUrl()} alt={person.role} height={20} className="person-icon" />
					<LinkTo person={person}/>
				</td>
				<td><LinkTo position={person.position} />{person.position && person.position.code ? `, ${person.position.code}`: ``}</td>
				<td><LinkTo whenUnspecified="" anetLocation={person.position && person.position.location} /></td>
				<td><LinkTo whenUnspecified="" organization={person.position && person.position.organization} /> </td>
				{this.props.showDelete && <td>
					<button
						type="button"
						className={classNames(Classes.BUTTON)}
						title="Remove attendee"
						onClick={() => this.props.onDelete(person)}
					>
						<Icon icon={IconNames.REMOVE} />
					</button>
				</td>}
			</tr>
		)
	}

	setPrimaryAttendee = (person) => {
		this.props.attendees.forEach(attendee => {
			if (Person.isEqual(attendee, person)) {
				attendee.primary = true
			} else if (attendee.role === person.role) {
				attendee.primary = false
			}
		})
		this.props.onChange(this.props.attendees)
	}
}
