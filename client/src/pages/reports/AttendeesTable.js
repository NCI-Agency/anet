import LinkTo from "components/LinkTo"
import { Person } from "models"
import PropTypes from "prop-types"
import React from "react"
import { Button, Label, Radio, Table, Checkbox } from "react-bootstrap"
import REMOVE_ICON from "resources/delete.png"
import "./AttendeesTable.css"
import { toast } from "react-toastify"

const RemoveIcon = () => (
  <img src={REMOVE_ICON} height={14} alt="Remove attendee" />
)

const RemoveButton = props => {
  const { title, handleOnClick } = props
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

const TableHeader = props => {
  const { showDelete, hide } = props
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
        <th className="col-xs-1" style={{ textAlign: "center" }}>
          {!hide && "Sensitive"}
        </th>
        {showDelete && <th className="col-xs-1" />}
      </tr>
    </thead>
  )
}
TableHeader.propTypes = {
  showDelete: PropTypes.bool,
  hide: PropTypes.bool
}

const TableBody = props => {
  const { attendees, handleAttendeeRow, role, enableDivider } = props
  return (
    <tbody>
      {enableDivider && <AttendeeDividerRow />}
      {Person.map(attendees.filter(p => p.role === role), person =>
        handleAttendeeRow(person)
      )}
    </tbody>
  )
}
TableBody.propTypes = {
  attendees: PropTypes.array,
  handleAttendeeRow: PropTypes.func,
  role: PropTypes.string,
  enableDivider: PropTypes.bool
}

const TableContainer = props => {
  const { className, children } = props
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

const RadioButton = props => {
  const { person, disabled, handleOnChange } = props
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

const SensitiveCheckBox = props => {
  const { person, disabled, handleOnChange } = props
  return (
    <Checkbox
      // inline-block
      className="sensitive-checkbox"
      checked={person.sensitive}
      disabled={disabled}
      onChange={event => {
        !disabled && handleOnChange(person, event.target.checked)
        !disabled &&
          event.target.checked &&
          toast.info(
            "You are restricting the visibility of the attendee to only authorized personnel. This will exclude that information from all reporting capabilities. Please do this only when necessary."
          )
      }}
    >
      {person.sensitive && <Label bsStyle="primary">Sensitive</Label>}
    </Checkbox>
  )
}

SensitiveCheckBox.propTypes = {
  person: PropTypes.object,
  disabled: PropTypes.bool,
  handleOnChange: PropTypes.func
}

const AttendeesTable = props => {
  const {
    attendees,
    disabled,
    onChange,
    showDelete,
    onDelete,
    showSensitive
  } = props

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
    if (person.sensitive && !showSensitive) {
      return
    }
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
          <LinkTo person={person} showIcon={false} />
        </td>
        <td>
          {person.position && person.position.uuid && (
            <LinkTo position={person.position} />
          )}
          {person.position && person.position.code
            ? `, ${person.position.code}`
            : ""}
        </td>
        <td>
          <LinkTo
            whenUnspecified=""
            anetLocation={person.position && person.position.location}
          />
        </td>
        <td>
          <LinkTo
            whenUnspecified=""
            organization={person.position && person.position.organization}
          />
        </td>
        <td className="sensitive-attendee">
          <SensitiveCheckBox
            person={person}
            handleOnChange={setSensitiveAttendee}
            disabled={disabled}
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

  function setSensitiveAttendee(person, isSensitive) {
    attendees.forEach(attendee => {
      if (Person.isEqual(attendee, person)) {
        attendee.sensitive = isSensitive
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
  onDelete: PropTypes.func,
  showSensitive: PropTypes.bool
}

export default AttendeesTable
