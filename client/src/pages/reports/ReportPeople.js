import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import PlanningConflictForPerson from "components/PlanningConflictForPerson"
import RemoveButton from "components/RemoveButton"
import { Person } from "models"
import Report from "models/Report"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { Checkbox, Label, Radio, Table } from "react-bootstrap"
import "./ReportPeople.css"

const AttendeeDividerRow = () => (
  <tr className="attendee-divider-row">
    <td colSpan={7}>
      <hr />
    </td>
  </tr>
)

const TableHeader = ({ showDelete, hide }) => (
  <thead>
    <tr>
      <th className="col-xs-1" style={{ textAlign: "center" }}>
        {!hide && "Authors"}
      </th>
      <th className="col-xs-1" style={{ textAlign: "center" }}>
        {!hide && "Primary"}
      </th>
      <th className="col-xs-3">{!hide && "Name"}</th>
      <th className="col-xs-3">{!hide && "Position"}</th>
      <th className="col-xs-1">{!hide && "Location"}</th>
      <th className="col-xs-2">{!hide && "Organization"}</th>
      <th className="col-xs-1" />
      {showDelete && <th className="col-xs-1" />}
    </tr>
  </thead>
)
TableHeader.propTypes = {
  showDelete: PropTypes.bool,
  hide: PropTypes.bool
}

const TableBody = ({
  reportPeople,
  handleAttendeeRow,
  role,
  enableDivider
}) => (
  <tbody>
    {enableDivider && <AttendeeDividerRow />}
    {Person.map(
      reportPeople.filter(p => p.role === role),
      person => handleAttendeeRow(person)
    )}
  </tbody>
)
TableBody.propTypes = {
  reportPeople: PropTypes.array.isRequired,
  handleAttendeeRow: PropTypes.func,
  role: PropTypes.string,
  enableDivider: PropTypes.bool
}
TableBody.defaultProps = {
  reportPeople: []
}

const TableContainer = ({ className, children }) => (
  <Table striped condensed hover responsive className={className}>
    {children}
  </Table>
)
TableContainer.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
}

const PrimaryAttendeeRadioButton = ({ person, disabled, handleOnChange }) => (
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
PrimaryAttendeeRadioButton.propTypes = {
  person: PropTypes.object,
  disabled: PropTypes.bool,
  handleOnChange: PropTypes.func
}
const AuthorAttendeeCheckbox = ({
  person,
  disabled,
  isCurrentEditor,
  handleOnChange
}) => (
  <Checkbox
    name={`authorAttendee${person.role}`}
    className={`primary${isCurrentEditor ? " isCurrentEditor" : ""}`}
    checked={!!person.author}
    disabled={disabled || isCurrentEditor}
    onChange={() => !disabled && handleOnChange(person)}
  >
    {person.author && <Label bsStyle="primary">Author</Label>}
  </Checkbox>
)
AuthorAttendeeCheckbox.propTypes = {
  person: PropTypes.object,
  disabled: PropTypes.bool,
  isCurrentEditor: PropTypes.bool,
  handleOnChange: PropTypes.func
}

const ReportPeople = ({ report, disabled, onChange, showDelete, onDelete }) => {
  const { currentUser } = useContext(AppContext)
  return (
    <div id="reportPeopleContainer">
      <TableContainer className="advisorAttendeesTable">
        <TableHeader showDelete={showDelete} />
        <TableBody
          reportPeople={report.reportPeople}
          role={Person.ROLE.ADVISOR}
          handleAttendeeRow={renderAttendeeRow}
        />
      </TableContainer>
      <TableContainer className="principalAttendeesTable">
        <TableHeader hide showDelete={showDelete} />
        <TableBody
          reportPeople={report.reportPeople}
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
        <td className="author-attendee" style={{ minWidth: "89px" }}>
          {Person.isAdvisor(person) && (
            <AuthorAttendeeCheckbox
              person={person}
              handleOnChange={setAuthorAttendee}
              disabled={disabled}
              isCurrentEditor={Person.isEqual(person, currentUser)}
            />
          )}
        </td>
        <td className="primary-attendee">
          <PrimaryAttendeeRadioButton
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
        <td style={{ verticalAlign: "middle" }}>
          <PlanningConflictForPerson person={person} report={report} />
        </td>
        {showDelete && (
          <td style={{ verticalAlign: "middle" }}>
            <RemoveButton
              title="Remove attendee"
              altText="Remove attendee"
              onClick={() => onDelete(person)}
            />
          </td>
        )}
      </tr>
    )
  }

  function setPrimaryAttendee(person) {
    report.reportPeople.forEach(rp => {
      if (Person.isEqual(rp, person)) {
        rp.primary = true
      } else if (rp.role === person.role) {
        rp.primary = false
      }
    })
    onChange(report.reportPeople)
  }
  // only advisors can be authors
  function setAuthorAttendee(person) {
    report.reportPeople.forEach(rp => {
      if (Person.isEqual(rp, person)) {
        rp.author = !rp.author
      }
    })
    onChange(report.reportPeople)
  }
}

ReportPeople.propTypes = {
  report: PropTypes.instanceOf(Report),
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  showDelete: PropTypes.bool,
  onDelete: PropTypes.func
}

export default ReportPeople
