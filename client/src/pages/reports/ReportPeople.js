import { Icon } from "@blueprintjs/core"
import "@blueprintjs/core/lib/css/blueprint.css"
import { IconNames } from "@blueprintjs/icons"
import "@blueprintjs/icons/lib/css/blueprint-icons.css" // needed for the mosaic tile buttons (expand, close)
import AppContext from "components/AppContext"
import PlanningConflictForPerson from "components/PlanningConflictForPerson"
import RemoveButton from "components/RemoveButton"
import { Person } from "models"
import Report from "models/Report"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { Checkbox, Label, Radio, Table } from "react-bootstrap"
import { toast } from "react-toastify"
import "./ReportPeople.css"

const ReportPeople = ({
  report,
  disabled,
  onChange,
  showDelete,
  onDelete,
  linkToComp: LinkToComp
}) => {
  const { currentUser } = useContext(AppContext)
  const showNonAttending = report.reportPeople.some(rp => !rp.attendee)
  return (
    <div id="reportPeopleContainer">
      <Table condensed responsive>
        <tbody>
          <tr>
            <th style={{ border: "none" }}>Advisors</th>
            <td style={{ padding: "0" }}>
              <TableContainer className="advisorAttendeesTable">
                <TableHeader showDelete={showDelete} />
                <TableBody
                  reportPeople={report.reportPeople}
                  filterCb={person =>
                    person.role === Person.ROLE.ADVISOR && person.attendee
                  }
                  handleAttendeeRow={renderAttendeeRow}
                  showDelete={showDelete}
                />
              </TableContainer>
            </td>
          </tr>
          <tr>
            <th>Principals</th>
            <td style={{ padding: "0" }}>
              <TableContainer className="principalAttendeesTable">
                <TableHeader hide showDelete={showDelete} />
                <TableBody
                  reportPeople={report.reportPeople}
                  filterCb={person =>
                    person.role === Person.ROLE.PRINCIPAL && person.attendee
                  }
                  handleAttendeeRow={renderAttendeeRow}
                  enableDivider
                  showDelete={showDelete}
                />
              </TableContainer>
            </td>
          </tr>
          {showNonAttending ? (
            <tr>
              <th>Non-attending</th>
              <td style={{ padding: "0" }}>
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
          ) : null}
        </tbody>
      </Table>
    </div>
  )

  function renderAttendeeRow(person) {
    const isCurrentEditor = Person.isEqual(person, currentUser)
    return (
      <tr key={person.uuid}>
        <td className="primary-attendee">
          {/* // only attendees can be primary */}
          {person.attendee && (
            <PrimaryAttendeeRadioButton
              person={person}
              handleOnChange={setPrimaryAttendee}
              disabled={disabled}
            />
          )}
        </td>
        <td className="report-attendee">
          {/* // only advisors can be non-attending */}
          {Person.isAdvisor(person) && (
            <ReportAttendeeCheckbox
              person={person}
              handleOnChange={setReportAttendee}
              disabled={disabled}
            />
          )}
        </td>
        <td className="report-author">
          {/* // only advisors can be authors */}
          {Person.isAdvisor(person) && (
            <ReportAuthorCheckbox
              person={person}
              handleOnChange={setReportAuthor}
              disabled={disabled}
              isCurrentEditor={isCurrentEditor}
            />
          )}
        </td>
        <td className="conflictButton">
          <PlanningConflictForPerson
            person={person}
            report={report}
            iconOnly={!!showDelete}
            linkToComp={LinkToComp}
          />
        </td>
        <td className="reportPeopleName">
          <LinkToComp
            modelType="Person"
            model={person}
            showIcon={false}
            previewId="rep-people-person"
          />
        </td>
        <td>
          {person.position && person.position.uuid && (
            <LinkToComp
              modelType="Position"
              model={person.position}
              previewId="rep-people-pos"
            />
          )}
          {person.position && person.position.code
            ? `, ${person.position.code}`
            : ""}
        </td>
        <td>
          <LinkToComp
            modelType="Location"
            model={person.position && person.position.location}
            whenUnspecified=""
            previewId="rep-people-loc"
          />
        </td>
        <td>
          <LinkToComp
            modelType="Organization"
            model={person.position && person.position.organization}
            whenUnspecified=""
            previewId="rep-people-org"
          />
        </td>
        {showDelete && (
          <td
            className="deleteReportPeople"
            style={{ verticalAlign: "middle" }}
          >
            {!isCurrentEditor && (
              <RemoveButton
                title="Remove person"
                altText="Remove person"
                onClick={() => onDelete(person)}
              />
            )}
          </td>
        )}
      </tr>
    )
  }

  function setPrimaryAttendee(person) {
    const newPeopleList = report.reportPeople.map(rp => new Person(rp))
    newPeopleList.forEach(np => {
      if (Person.isEqual(np, person)) {
        np.primary = true
      } else if (np.role === person.role) {
        np.primary = false
      }
    })
    onChange(newPeopleList)
  }

  function setReportAuthor(person) {
    const newPeopleList = report.reportPeople.map(rp => new Person(rp))
    if (passesAuthorValidationSteps(person)) {
      newPeopleList.forEach(rp => {
        if (Person.isEqual(rp, person)) {
          rp.author = !rp.author
        }
      })
      onChange(newPeopleList)
    }
  }

  function setReportAttendee(person) {
    const newPeopleList = report.reportPeople.map(rp => new Person(rp))
    if (passesAttendeeValidationSteps(person)) {
      newPeopleList.forEach(rp => {
        if (Person.isEqual(rp, person)) {
          rp.attendee = !rp.attendee
        }
      })
      forceOnlyAttendingPersonPerRoleToPrimary(newPeopleList)
      onChange(newPeopleList)
    }
  }

  function passesAuthorValidationSteps(person) {
    // 1- Prevent self removing from authors
    const isRemovingSelfAuthor =
      Person.isEqual(currentUser, person) && person.author
    if (isRemovingSelfAuthor) {
      toast("You cannot remove yourself from authors list", {
        toastId: "removingPrimaryAttendee"
      })
      return false
    }

    // 2- Prevent the removal of the last author
    const anyAuthorsBesideCurrentPerson = report.reportPeople.some(
      rp => rp.author && !Person.isEqual(rp, person)
    )
    // are we toggling the last author, get the authorness value before toggle
    const isTheLastAuthorBeingRemoved =
      !anyAuthorsBesideCurrentPerson && person.author

    if (isTheLastAuthorBeingRemoved) {
      toast("You must provide at least 1 author for a report", {
        toastId: "removingLastAuthor"
      })
      return false
    }

    return true
  }

  function passesAttendeeValidationSteps(person) {
    // Prevent removal of primary attendee without making someone else primary
    if (person.attendee && person.primary) {
      toast("Select a primary first to remove this person", {
        toastId: "removingPrimaryAttendee"
      })
      return false
    }
    return true
  }
}

export function forceOnlyAttendingPersonPerRoleToPrimary(peopleList) {
  // After setting attendees, check for primaries
  // if no one else is primary and attending in that role, set that person primary
  const [advisors, principals] = [[], []]
  peopleList.forEach(p => {
    if (p.role === Person.ROLE.ADVISOR && p.attendee) {
      advisors.push(p)
    } else if (p.role === Person.ROLE.PRINCIPAL && p.attendee) {
      principals.push(p)
    }
  })

  if (advisors.length === 1) {
    advisors[0].primary = true
  }
  if (principals.length === 1) {
    principals[0].primary = true
  }
}

ReportPeople.propTypes = {
  report: PropTypes.instanceOf(Report),
  linkToComp: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  showDelete: PropTypes.bool,
  onDelete: PropTypes.func
}

const TableContainer = ({ className, children }) => (
  <Table
    striped
    condensed
    hover
    responsive
    className={className}
    style={{ margin: 0 }}
  >
    {children}
  </Table>
)
TableContainer.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
}

const TableHeader = ({ showDelete, hide }) => (
  <thead>
    <tr>
      <th
        className={"col-xs-1" + (hide ? " empty-cell-header" : "")}
        style={{ textAlign: "center" }}
      >
        <div style={{ minWidth: "80px" }}>{!hide && "Primary"}</div>
      </th>
      <th
        className={"col-xs-1" + (hide ? " empty-cell-header" : "")}
        style={{ textAlign: "center" }}
      >
        <div style={{ minWidth: "80px" }}>{!hide && "Attendees"}</div>
      </th>
      <th
        className={
          "col-xs-1 report-author" + (hide ? " empty-cell-header" : "")
        }
        style={{ textAlign: "center" }}
      >
        <div style={{ minWidth: "70px" }}>{!hide && "Authors"}</div>
      </th>
      <th className={"col-xs-1" + (hide ? " empty-cell-header" : "")}>
        <div style={{ width: showDelete ? "35px" : "120px" }} />
      </th>
      <th className={"col-xs-3" + (hide ? " empty-cell-header" : "")}>
        <div style={{ minWidth: "120px" }}>{!hide && "Name"}</div>
      </th>
      <th className={"col-xs-3" + (hide ? " empty-cell-header" : "")}>
        <div style={{ minWidth: "90px" }}>{!hide && "Position"}</div>
      </th>
      <th className={"col-xs-2" + (hide ? " empty-cell-header" : "")}>
        <div style={{ minWidth: "90px" }}>{!hide && "Location"}</div>
      </th>
      <th className={"col-xs-2" + (hide ? " empty-cell-header" : "")}>
        <div style={{ minWidth: "90px" }}>{!hide && "Organization"}</div>
      </th>
      {showDelete && (
        <th className={"col-xs-1" + (hide ? " empty-cell-header" : "")} />
      )}
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

const PrimaryAttendeeRadioButton = ({ person, disabled, handleOnChange }) => (
  <Radio
    name={`primaryAttendee${person.role}`}
    className={`primary${!person.primary ? " inActive" : ""}`}
    checked={person.primary}
    disabled={disabled || !person.attendee}
    onChange={() => !disabled && handleOnChange(person)}
  >
    <Label bsStyle="primary">Primary</Label>
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
    disabled={disabled}
    readOnly={isCurrentEditor}
    onChange={() => !disabled && handleOnChange(person)}
  >
    <Icon iconSize={Icon.SIZE_LARGE} icon={IconNames.EDIT} />
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
    <Icon iconSize={Icon.SIZE_LARGE} icon={IconNames.PEOPLE} />
  </Checkbox>
)
ReportAttendeeCheckbox.propTypes = {
  person: PropTypes.object,
  disabled: PropTypes.bool,
  handleOnChange: PropTypes.func
}

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

export default ReportPeople
