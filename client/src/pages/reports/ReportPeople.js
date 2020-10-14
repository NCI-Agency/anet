import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import PlanningConflictForPerson from "components/PlanningConflictForPerson"
import RemoveButton from "components/RemoveButton"
import { Person } from "models"
import Report from "models/Report"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { Checkbox, Label, Radio, Table } from "react-bootstrap"
import { toast } from "react-toastify"
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
        {!hide && "Primary"}
      </th>
      <th className="col-xs-1" style={{ textAlign: "center" }}>
        {!hide && "Attendees"}
      </th>
      <th className="col-xs-1" style={{ textAlign: "center" }}>
        {!hide && "Authors"}
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
  filterCb,
  enableDivider
}) => (
  <tbody>
    {enableDivider && <AttendeeDividerRow />}
    {Person.map(sortReportPeople(reportPeople.filter(filterCb)), person =>
      handleAttendeeRow(person)
    )}
  </tbody>
)
TableBody.propTypes = {
  reportPeople: PropTypes.array.isRequired,
  handleAttendeeRow: PropTypes.func,
  filterCb: PropTypes.func,
  enableDivider: PropTypes.bool
}
TableBody.defaultProps = {
  reportPeople: []
}

function sortReportPeople(reportPeople) {
  return reportPeople.sort((rp1, rp2) => {
    // primary first, then authors, then alphabetical
    if (rp1.primary !== rp2.primary) {
      return rp1.primary ? -1 : 1
    } else if (rp1.author !== rp2.author) {
      return rp1.author ? -1 : 1
    } else {
      return (rp1.name || rp1.uuid).localeCompare(rp2.name || rp2.uuid)
    }
  })
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
    disabled={disabled || !person.attendee}
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
const ReportAuthorCheckbox = ({
  person,
  disabled,
  isCurrentEditor,
  handleOnChange
}) => (
  <Checkbox
    name={`authorAttendee${person.role}`}
    className={`primary${isCurrentEditor ? " isCurrentEditor" : ""}${
      !person.author ? " inActive" : ""
    }`}
    checked={!!person.author}
    disabled={disabled || isCurrentEditor}
    onChange={() => !disabled && handleOnChange(person)}
  >
    <Label bsStyle="primary">Author</Label>
  </Checkbox>
)
ReportAuthorCheckbox.propTypes = {
  person: PropTypes.object,
  disabled: PropTypes.bool,
  isCurrentEditor: PropTypes.bool,
  handleOnChange: PropTypes.func
}
const ReportAttendeeCheckbox = ({
  person,
  disabled,
  isCurrentEditor,
  handleOnChange
}) => (
  <Checkbox
    name={`authorAttendee${person.role}`}
    className={`primary${!person.attendee ? " inActive" : ""}`}
    checked={!!person.attendee}
    disabled={disabled || isCurrentEditor}
    onChange={() => !disabled && handleOnChange(person)}
  >
    <Label bsStyle="primary">Attendee</Label>
  </Checkbox>
)
ReportAttendeeCheckbox.propTypes = {
  person: PropTypes.object,
  disabled: PropTypes.bool,
  isCurrentEditor: PropTypes.bool,
  handleOnChange: PropTypes.func
}

const ReportPeople = ({ report, disabled, onChange, showDelete, onDelete }) => {
  const { currentUser } = useContext(AppContext)
  return (
    <div id="reportPeopleContainer">
      <h3>Attendance</h3>
      <TableContainer className="advisorAttendeesTable">
        <TableHeader showDelete={showDelete} />
        <TableBody
          reportPeople={report.reportPeople}
          filterCb={person =>
            person.role === Person.ROLE.ADVISOR && person.attendee}
          handleAttendeeRow={renderAttendeeRow}
        />
      </TableContainer>
      <TableContainer className="principalAttendeesTable">
        <TableHeader hide showDelete={showDelete} />
        <TableBody
          reportPeople={report.reportPeople}
          filterCb={person =>
            person.role === Person.ROLE.PRINCIPAL && person.attendee}
          handleAttendeeRow={renderAttendeeRow}
          enableDivider
        />
      </TableContainer>
      <h3>Administrative</h3>
      <TableContainer className="reportAdministrative">
        <TableHeader showDelete={showDelete} />
        <TableBody
          reportPeople={report.reportPeople}
          filterCb={person => !person.attendee}
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
          <div style={{ minWidth: "99px" }}>
            <PrimaryAttendeeRadioButton
              person={person}
              handleOnChange={setPrimaryAttendee}
              disabled={disabled}
            />
          </div>
        </td>
        <td className="report-author">
          <div style={{ minWidth: "99px" }}>
            {Person.isAdvisor(person) && (
              <ReportAttendeeCheckbox
                person={person}
                handleOnChange={setReportAttendee}
                disabled={disabled}
                isCurrentEditor={Person.isEqual(person, currentUser)}
              />
            )}
          </div>
        </td>
        <td className="report-attendee">
          <div style={{ minWidth: "99px" }}>
            {Person.isAdvisor(person) && (
              <ReportAuthorCheckbox
                person={person}
                handleOnChange={setReportAuthor}
                disabled={disabled}
                isCurrentEditor={Person.isEqual(person, currentUser)}
              />
            )}
          </div>
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
  function setReportAuthor(person) {
    // FIXME: prevent the removal of the last author
    // const numOfAuthors = report.reportPeople.filter(rp => rp.author).length

    report.reportPeople.forEach(rp => {
      if (Person.isEqual(rp, person)) {
        // if (!numOfAuthors) {
        //   toast("You must provide at least 1 author for the report")
        // }
        rp.author = !rp.author
      }
    })
    onChange(report.reportPeople)
  }
  // only advisors can be authors
  function setReportAttendee(person) {
    report.reportPeople.forEach(rp => {
      if (Person.isEqual(rp, person)) {
        // We can't remove primary attendee without making someone else primary
        if (rp.primary) {
          toast("Select a primary first to remove this person")
        } else {
          rp.attendee = !rp.attendee
        }
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
