import React, { Component } from 'react'
import {Checkbox, Table} from 'react-bootstrap'

import _isEmpty from 'lodash/isEmpty'

import {Person} from 'models'
import LinkTo from 'components/LinkTo'

import REMOVE_ICON from 'resources/delete.png'

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
					{Person.map(this.props.attendees.filter(p => p.role === Person.ROLE.ADVISOR),
						person => this.renderAttendeeRow(person)
					)}

					<tr className="attendee-divider-row"><td colSpan={6}><hr /></td></tr>

					{Person.map(this.props.attendees.filter(p => p.role === Person.ROLE.PRINCIPAL),
						person => this.renderAttendeeRow(person)
					)}
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
				<td><LinkTo person={person} /></td>
				<td><LinkTo position={person.position} />{person.position && person.position.code ? `, ${person.position.code}`: ``}</td>
				<td><LinkTo whenUnspecified="" anetLocation={person.position && person.position.location} /></td>
				<td><LinkTo whenUnspecified="" organization={person.position && person.position.organization} /> </td>
				{this.props.showDelete && <td onClick={() => this.props.onDelete(person)}>
					<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt="Remove attendee" /></span>
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
