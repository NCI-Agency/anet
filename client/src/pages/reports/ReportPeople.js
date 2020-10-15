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

const AttendeeDividerRow = ({ showDelete }) => (
  <tr className="attendee-divider-row">
    <td colSpan={showDelete ? 9 : 8}>
      <hr />
    </td>
  </tr>
)
AttendeeDividerRow.propTypes = {
  showDelete: PropTypes.bool
}

const Th = ({ hide, text, ...otherProps }) => {
  return (
    <th {...otherProps}>
      <div style={{ minWidth: "89px" }}>{!hide && text}</div>
    </th>
  )
}
Th.propTypes = {
  text: PropTypes.string,
  hide: PropTypes.bool
}

const TableHeader = ({ showDelete, hide }) => (
  <thead>
    <tr>
      <Th
        text="Primary"
        hide={hide}
        className="col-xs-1"
        style={{ textAlign: "center" }}
      />
      <Th
        text="Attendees"
        hide={hide}
        className="col-xs-1"
        style={{ textAlign: "center" }}
      />
      <Th
        text="Authors"
        hide={hide}
        className="col-xs-1"
        style={{ textAlign: "center" }}
      />
      <Th
        text="Name"
        hide={hide}
        className="col-xs-3"
        style={{ textAlign: "center" }}
      />
      <Th
        text="Position"
        hide={hide}
        className="col-xs-3"
        style={{ textAlign: "center" }}
      />
      <Th
        text="Location"
        hide={hide}
        className="col-xs-1"
        style={{ textAlign: "center" }}
      />
      <Th
        text="Organization"
        hide={hide}
        className="col-xs-2"
        style={{ textAlign: "center" }}
      />
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
  enableDivider,
  showDelete
}) => (
  <tbody>
    {enableDivider && <AttendeeDividerRow showDelete={showDelete} />}
    {Person.map(sortReportPeople(reportPeople.filter(filterCb)), person =>
      handleAttendeeRow(person)
    )}
  </tbody>
)
TableBody.propTypes = {
  reportPeople: PropTypes.array.isRequired,
  handleAttendeeRow: PropTypes.func,
  filterCb: PropTypes.func,
  enableDivider: PropTypes.bool,
  showDelete: PropTypes.bool
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
    }
    return (rp1.name || rp1.uuid).localeCompare(rp2.name || rp2.uuid)
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

const PrimaryAttendeeRadioButton = ({ person, disabled, handleOnChange }) =>
  person.attendee ? (
    <Radio
      name={`primaryAttendee${person.role}`}
      className={`primary${!person.primary ? " inActive" : ""}`}
      checked={person.primary}
      disabled={disabled || !person.attendee}
      onChange={() => !disabled && handleOnChange(person)}
    >
      <Label bsStyle="primary">Primary</Label>
    </Radio>
  ) : null

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
const ReportAttendeeCheckbox = ({ person, disabled, handleOnChange }) => (
  <Checkbox
    name={`authorAttendee${person.role}`}
    className={`primary${!person.attendee ? " inActive" : ""}`}
    checked={!!person.attendee}
    disabled={disabled}
    onChange={() => !disabled && handleOnChange(person)}
  >
    <Label bsStyle="primary">Attendee</Label>
  </Checkbox>
)
ReportAttendeeCheckbox.propTypes = {
  person: PropTypes.object,
  disabled: PropTypes.bool,
  handleOnChange: PropTypes.func
}

const ReportPeople = ({ report, disabled, onChange, showDelete, onDelete }) => {
  const { currentUser } = useContext(AppContext)
  return (
    <div id="reportPeopleContainer">
      <TableContainer>
        <tbody>
          <tr>
            <th className="reportPeople-fieldHeader">Advisors</th>
            <td>
              <TableContainer className="advisorAttendeesTable">
                <TableHeader showDelete={showDelete} />
                <TableBody
                  reportPeople={report.reportPeople}
                  filterCb={person =>
                    person.role === Person.ROLE.ADVISOR && person.attendee}
                  handleAttendeeRow={renderAttendeeRow}
                  showDelete={showDelete}
                />
              </TableContainer>
            </td>
          </tr>
          <tr>
            <th className="reportPeople-fieldHeader">Principals</th>
            <td>
              <TableContainer className="principalAttendeesTable">
                <TableHeader hide showDelete={showDelete} />
                <TableBody
                  reportPeople={report.reportPeople}
                  filterCb={person =>
                    person.role === Person.ROLE.PRINCIPAL && person.attendee}
                  handleAttendeeRow={renderAttendeeRow}
                  enableDivider
                  showDelete={showDelete}
                />
              </TableContainer>
            </td>
          </tr>
          <tr>
            <th className="reportPeople-fieldHeader">Administrative</th>
            <td>
              <TableContainer className="reportAdministrative">
                <TableHeader hide showDelete={showDelete} />
                <TableBody
                  reportPeople={report.reportPeople}
                  filterCb={person => !person.attendee}
                  handleAttendeeRow={renderAttendeeRow}
                  enableDivider
                  showDelete={showDelete}
                />
              </TableContainer>
            </td>
          </tr>
        </tbody>
      </TableContainer>
    </div>
  )

  function renderAttendeeRow(person) {
    const isCurrentEditor = Person.isEqual(person, currentUser)
    return (
      <tr key={person.uuid}>
        <td className="primary-attendee">
          <PrimaryAttendeeRadioButton
            person={person}
            handleOnChange={setPrimaryAttendee}
            disabled={disabled}
          />
        </td>
        <td className="report-attendee">
          {Person.isAdvisor(person) && (
            <ReportAttendeeCheckbox
              person={person}
              handleOnChange={setReportAttendee}
              disabled={disabled}
            />
          )}
        </td>
        <td className="report-author">
          {Person.isAdvisor(person) && (
            <ReportAuthorCheckbox
              person={person}
              handleOnChange={setReportAuthor}
              disabled={disabled}
              isCurrentEditor={isCurrentEditor}
            />
          )}
        </td>
        <td className="reportPeopleName">
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
        <td className="conflictButton" style={{ verticalAlign: "middle" }}>
          <PlanningConflictForPerson person={person} report={report} />
        </td>
        {showDelete && !isCurrentEditor && (
          <td
            className="deleteReportPeople"
            style={{ verticalAlign: "middle" }}
          >
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
    // Prevent the removal of the last author
    const anyAuthorsBesideCurrentPerson = report.reportPeople.some(
      rp => rp.author && !Person.isEqual(rp, person)
    )
    // are we toggling the last author, get the authorness value before toggle
    const isTheLastAuthorBeingRemoved =
      !anyAuthorsBesideCurrentPerson && person.author

    report.reportPeople.forEach(rp => {
      if (Person.isEqual(rp, person)) {
        if (isTheLastAuthorBeingRemoved) {
          toast("You must provide at least 1 author for a report", {
            toastId: "removingLastAuthor"
          })
        } else {
          rp.author = !rp.author
        }
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
          toast("Select a primary first to remove this person", {
            toastId: "removingPrimaryAttendee"
          })
        } else {
          rp.attendee = !rp.attendee
        }
      }

      // After setting attendees, check for primaries
      // if no one else is primary in that role, set that person primary if attending
      if (
        !report.reportPeople.find(a2 => rp.role === a2.role && a2.primary) &&
        rp.attendee
      ) {
        rp.primary = true
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
