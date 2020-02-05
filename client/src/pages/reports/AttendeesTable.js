import LinkTo from "components/LinkTo"
import { Person } from "models"
import PropTypes from "prop-types"
import React from "react"
import { Button, Label, Radio, Table } from "react-bootstrap"
import REMOVE_ICON from "resources/delete.png"
import "./AttendeesTable.css"

const RemoveIcon = () => (
  <img src={REMOVE_ICON} height={14} alt="Remove attendee" />
)

const RemoveButton = ({ title, handleOnClick }) => {
  return (
    <Button bsStyle="link" title={title} onClick={handleOnClick}>
      <RemoveIcon />
    </Button>
  )
}
RemoveButton.propTypes = {
  title: PropTypes.string,
  handleOnClick: PropTypes.func
}

const AttendeeDividerRow = () => (
  <tr className="attendee-divider-row">
    <td colSpan={6}>
      <hr />
    </td>
  </tr>
)

const TableHeader = ({ showDelete, hide }) => {
  return (
    <thead>
      <tr>
        <th className="col-xs-1" style={{ textAlign: "center" }}>
          {!hide && "Primary"}
        </th>
        <th className="col-xs-3">{!hide && "Name"}</th>
        <th className="col-xs-3">{!hide && "Position"}</th>
        <th className="col-xs-2">{!hide && "Location"}</th>
        <th className="col-xs-2">{!hide && "Organization"}</th>
        {showDelete && <th className="col-xs-1" />}
      </tr>
    </thead>
  )
}
TableHeader.propTypes = {
  showDelete: PropTypes.bool,
  hide: PropTypes.bool
}

const TableBody = ({ attendees, handleAttendeeRow, role, enableDivider }) => {
  return (
    <tbody>
      {enableDivider && <AttendeeDividerRow />}
      {Person.map(
        attendees.filter(p => p.role === role),
        person => handleAttendeeRow(person)
      )}
    </tbody>
  )
}
TableBody.propTypes = {
  attendees: PropTypes.array.isRequired,
  handleAttendeeRow: PropTypes.func,
  role: PropTypes.string,
  enableDivider: PropTypes.bool
}
TableBody.defaultProps = {
  attendees: []
}

const TableContainer = ({ className, children }) => {
  return (
    <Table striped condensed hover responsive className={className}>
      {children}
    </Table>
  )
}
TableContainer.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
}

const RadioButton = ({ person, disabled, handleOnChange }) => {
  return (
    <Radio
      name={`primaryAttendee${person.role}`}
      className="primary"
      checked={person.primary}
      disabled={disabled}
      onChange={() => !disabled && handleOnChange(person)}
    >
      {person.primary && <Label bsStyle="primary">Primary</Label>}
    </Radio>
  )
}
RadioButton.propTypes = {
  person: PropTypes.object,
  disabled: PropTypes.bool,
  handleOnChange: PropTypes.func
}

const AttendeesTable = ({
  attendees,
  disabled,
  onChange,
  showDelete,
  onDelete
}) => {
  return (
    <div id="attendeesContainer">
      <TableContainer className="advisorAttendeesTable">
        <TableHeader showDelete={showDelete} />
        <TableBody
          attendees={attendees}
          role={Person.ROLE.ADVISOR}
          handleAttendeeRow={renderAttendeeRow}
        />
      </TableContainer>
      <TableContainer className="principalAttendeesTable">
        <TableHeader hide />
        <TableBody
          attendees={attendees}
          role={Person.ROLE.PRINCIPAL}
          handleAttendeeRow={renderAttendeeRow}
          enableDivider
        />
      </TableContainer>
    </div>
  )

  function renderAttendeeRow(person) {
    return (
      <tr key={person.uuid}>
        <td className="primary-attendee">
          <RadioButton
            person={person}
            handleOnChange={setPrimaryAttendee}
            disabled={disabled}
          />
        </td>
        <td>
          <LinkTo modelType="Person" model={person} showIcon={false} />
        </td>
        <td>
          {person.position && person.position.uuid && (
            <LinkTo modelType="Position" model={person.position} />
          )}
          {person.position && person.position.code
            ? `, ${person.position.code}`
            : ""}
        </td>
        <td>
          <LinkTo
            modelType="Location"
            model={person.position && person.position.location}
            whenUnspecified=""
          />
        </td>
        <td>
          <LinkTo
            modelType="Organization"
            model={person.position && person.position.organization}
            whenUnspecified=""
          />
        </td>
        {showDelete && (
          <td>
            <RemoveButton
              title="Remove attendee"
              handleOnClick={() => onDelete(person)}
            />
          </td>
        )}
      </tr>
    )
  }

  function setPrimaryAttendee(person) {
    attendees.forEach(attendee => {
      if (Person.isEqual(attendee, person)) {
        attendee.primary = true
      } else if (attendee.role === person.role) {
        attendee.primary = false
      }
    })
    onChange(attendees)
  }
}

AttendeesTable.propTypes = {
  attendees: PropTypes.array,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  showDelete: PropTypes.bool,
  onDelete: PropTypes.func
}

export default AttendeesTable
