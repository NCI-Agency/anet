import { Icon, IconSize } from "@blueprintjs/core"
import "@blueprintjs/core/lib/css/blueprint.css"
import { IconNames } from "@blueprintjs/icons"
// needed for the mosaic tile buttons (expand, close):
import "@blueprintjs/icons/lib/css/blueprint-icons.css"
import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import PlanningConflictForPerson from "components/PlanningConflictForPerson"
import RemoveButton from "components/RemoveButton"
import { Person } from "models"
import Report from "models/Report"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { Badge, Form, OverlayTrigger, Table, Tooltip } from "react-bootstrap"
import { toast } from "react-toastify"
import Settings from "settings"
import "./ReportPeople.css"

const ReportPeople = ({ report, disabled, onChange, showDelete, onDelete }) => {
  const { currentUser } = useContext(AppContext)
  const showNonAttending = report.reportPeople.some(rp => !rp.attendee)
  return (
    <div id="reportPeopleContainer">
      <Table responsive>
        <tbody>
          <tr>
            <th style={{ border: "none" }}>
              {pluralize(Settings.fields.advisor.person.name)}
            </th>
            <td style={{ padding: "0" }}>
              <TableContainer className="advisorAttendeesTable">
                <TableHeader showDelete={showDelete} />
                <TableBody
                  reportPeople={report.reportPeople}
                  filterCb={person => !person.interlocutor && person.attendee}
                  handleAttendeeRow={renderAttendeeRow}
                  showDelete={showDelete}
                />
              </TableContainer>
            </td>
          </tr>
          <tr>
            <th>{pluralize(Settings.fields.interlocutor.person.name)}</th>
            <td style={{ padding: "0" }}>
              <TableContainer className="interlocutorAttendeesTable">
                <TableHeader hide showDelete={showDelete} />
                <TableBody
                  reportPeople={report.reportPeople}
                  filterCb={person => person.interlocutor && person.attendee}
                  handleAttendeeRow={renderAttendeeRow}
                  enableDivider
                  showDelete={showDelete}
                />
              </TableContainer>
            </td>
          </tr>
          {showNonAttending && (
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
          )}
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
          {/* // authors 0r non-attendees can't be interlocutors */}
          {!person.author && person.attendee && (
            <ReportInterlocutorCheckbox
              person={person}
              handleOnChange={setReportInterlocutor}
              disabled={disabled}
              isCurrentEditor={isCurrentEditor}
            />
          )}
          {/* // only advisors can be non-attending */}
          {!person.interlocutor && (
            <ReportAttendeeCheckbox
              person={person}
              handleOnChange={setReportAttendee}
              disabled={disabled}
            />
          )}
          {/* // only advisors can be authors */}
          {!person.interlocutor && (
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
          />
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
        {showDelete && (
          <td
            className="deleteReportPeople"
            style={{ verticalAlign: "middle" }}
          >
            {!isCurrentEditor && (
              <RemoveButton
                title="Remove person"
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
      } else if (np.interlocutor === person.interlocutor) {
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
          rp.primary = false
        }
      })
      forceOnlyAttendingPersonPerRoleToPrimary(newPeopleList)
      onChange(newPeopleList)
    }
  }

  function setReportInterlocutor(person) {
    const newPeopleList = report.reportPeople.map(rp => new Person(rp))
    newPeopleList.forEach(rp => {
      if (Person.isEqual(rp, person)) {
        rp.interlocutor = !rp.interlocutor
        rp.primary = false
      }
    })
    onChange(newPeopleList)
  }

  function passesAuthorValidationSteps(person) {
    // 1- Prevent self removing from authors
    const isRemovingSelfAuthor =
      Person.isEqual(currentUser, person) && person.author
    if (isRemovingSelfAuthor) {
      toast.warning("You cannot remove yourself from authors list", {
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
      toast.warning("You must provide at least 1 author for a report", {
        toastId: "removingLastAuthor"
      })
      return false
    }

    return true
  }

  function passesAttendeeValidationSteps(person) {
    // Prevent removal of primary attendee without making someone else primary
    if (person.attendee && person.primary) {
      toast.warning("Select a primary first to remove this person", {
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
  const [advisors, interlocutors] = [[], []]
  peopleList.forEach(p => {
    if (!p.interlocutor && p.attendee) {
      advisors.push(p)
    } else if (p.interlocutor && p.attendee) {
      interlocutors.push(p)
    }
  })

  if (advisors.length === 1) {
    advisors[0].primary = true
  }
  if (interlocutors.length === 1) {
    interlocutors[0].primary = true
  }
}

ReportPeople.propTypes = {
  report: PropTypes.instanceOf(Report),
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  showDelete: PropTypes.bool,
  onDelete: PropTypes.func
}

const TableContainer = ({ className, children }) => (
  <Table striped hover responsive className={className} style={{ margin: 0 }}>
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
      <th className={"col-1" + (hide ? " empty-cell-header" : "")}>
        <div style={{ minWidth: "100px" }}>{!hide && "Roles"}</div>
      </th>
      <th className={"col-1" + (hide ? " empty-cell-header" : "")}>
        <div style={{ width: showDelete ? "35px" : "100px" }} />
      </th>
      <th className={"col-3" + (hide ? " empty-cell-header" : "")}>
        <div style={{ minWidth: "120px" }}>{!hide && "Name"}</div>
      </th>
      <th className={"col-3" + (hide ? " empty-cell-header" : "")}>
        <div style={{ minWidth: "90px" }}>{!hide && "Position"}</div>
      </th>
      <th className={"col-2" + (hide ? " empty-cell-header" : "")}>
        <div style={{ minWidth: "90px" }}>{!hide && "Location"}</div>
      </th>
      <th className={"col-2" + (hide ? " empty-cell-header" : "")}>
        <div style={{ minWidth: "90px" }}>{!hide && "Organization"}</div>
      </th>
      {showDelete && (
        <th className={"col-1" + (hide ? " empty-cell-header" : "")} />
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
}) => {
  const peopleFiltered = reportPeople.filter(filterCb)
  return (
    <tbody>
      {enableDivider && <AttendeeDividerRow showDelete={showDelete} />}
      {Person.map(peopleFiltered, person => handleAttendeeRow(person))}
    </tbody>
  )
}
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

const getAttendeeType = person =>
  person.interlocutor ? "INTERLOCUTOR" : "ADVISOR"

const PrimaryAttendeeRadioButton = ({ person, disabled, handleOnChange }) =>
  disabled ? (
    person.primary && <Badge bg="primary">Primary</Badge>
  ) : (
    <Form.Check
      type="radio"
      label={<Badge bg="primary">Primary</Badge>}
      id={`primaryAttendee-${person.uuid}`}
      name={`primaryAttendee${getAttendeeType(person)}`}
      className={`primary${!person.primary ? " inActive" : ""}`}
      checked={person.primary}
      onChange={() => handleOnChange(person)}
    />
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
}) =>
  disabled ? (
    !!person.author && (
      <OverlayTrigger overlay={<Tooltip id="author-tooltip">Author</Tooltip>}>
        <Icon size={IconSize.LARGE} icon={IconNames.EDIT} />
      </OverlayTrigger>
    )
  ) : (
    <Form.Check
      type="checkbox"
      label={
        <OverlayTrigger overlay={<Tooltip id="author-tooltip">Author</Tooltip>}>
          <Icon size={IconSize.LARGE} icon={IconNames.EDIT} />
        </OverlayTrigger>
      }
      id={`reportAuthor-${person.uuid}`}
      name={`reportAuthor${getAttendeeType(person)}`}
      className={`primary${isCurrentEditor ? " isCurrentEditor" : ""}${
        !person.author ? " inActive" : ""
      }`}
      checked={!!person.author}
      readOnly={isCurrentEditor}
      onChange={() => handleOnChange(person)}
    />
  )
ReportAuthorCheckbox.propTypes = {
  person: PropTypes.object,
  disabled: PropTypes.bool,
  isCurrentEditor: PropTypes.bool,
  handleOnChange: PropTypes.func
}

const ReportAttendeeCheckbox = ({ person, disabled, handleOnChange }) =>
  disabled ? (
    !!person.attendee && (
      <OverlayTrigger
        overlay={<Tooltip id="attendee-tooltip">Attendee</Tooltip>}
      >
        <Icon size={IconSize.LARGE} icon={IconNames.PEOPLE} />
      </OverlayTrigger>
    )
  ) : (
    <Form.Check
      type="checkbox"
      label={
        <OverlayTrigger
          overlay={<Tooltip id="attendee-tooltip">Attendee</Tooltip>}
        >
          <Icon size={IconSize.LARGE} icon={IconNames.PEOPLE} />
        </OverlayTrigger>
      }
      id={`reportAttendee-${person.uuid}`}
      name={`reportAttendee${getAttendeeType(person)}`}
      className={`primary${!person.attendee ? " inActive" : ""}`}
      checked={!!person.attendee}
      onChange={() => handleOnChange(person)}
    />
  )
ReportAttendeeCheckbox.propTypes = {
  person: PropTypes.object,
  disabled: PropTypes.bool,
  handleOnChange: PropTypes.func
}

const ReportInterlocutorCheckbox = ({ person, disabled, handleOnChange }) =>
  disabled ? (
    !!person.interlocutor && (
      <OverlayTrigger
        overlay={<Tooltip id="interlocutor-tooltip">Interlocutor</Tooltip>}
      >
        <Icon size={IconSize.LARGE} icon={IconNames.THIRD_PARTY} />
      </OverlayTrigger>
    )
  ) : (
    <Form.Check
      type="checkbox"
      label={
        <OverlayTrigger
          overlay={<Tooltip id="interlocutor-tooltip">Interlocutor</Tooltip>}
        >
          <Icon size={IconSize.LARGE} icon={IconNames.THIRD_PARTY} />
        </OverlayTrigger>
      }
      id={`reportInterlocutor-${person.uuid}`}
      name={`reportInterlocutor${getAttendeeType(person)}`}
      className={`primary${!person.interlocutor ? " inActive" : ""}`}
      checked={!!person.interlocutor}
      onChange={() => handleOnChange(person)}
    />
  )
ReportInterlocutorCheckbox.propTypes = {
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
