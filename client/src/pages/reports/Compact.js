/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import { ReadonlyCustomFields } from "components/CustomFields"
import LinkTo from "components/LinkTo"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import { CompactRowReportWorkflow } from "components/ReportWorkflow"
import {
  CompactSecurityBanner,
  SETTING_KEY_COLOR
} from "components/SecurityBanner"
import { Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Person, Report, Task } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { Button } from "react-bootstrap"
import { connect } from "react-redux"
import { Link, useHistory, useLocation, useParams } from "react-router-dom"
import anetLogo from "resources/logo.png"
import Settings from "settings"
import utils from "utils"
import { parseHtmlWithLinkTo } from "utils_links"

const GQL_GET_REPORT = gql`
  query($uuid: String!) {
    report(uuid: $uuid) {
      uuid
      intent
      engagementDate
      duration
      atmosphere
      atmosphereDetails
      keyOutcomes
      reportText
      nextSteps
      cancelledReason
      releasedAt
      state
      location {
        uuid
        name
      }
      author {
        uuid
        name
        rank
        role
        avatar(size: 32)
        position {
          uuid
          organization {
            uuid
            shortName
            longName
            identificationCode
            approvalSteps {
              uuid
              name
              approvers {
                uuid
                name
                person {
                  uuid
                  name
                  rank
                  role
                  avatar(size: 32)
                }
              }
            }
          }
        }
      }
      attendees {
        uuid
        name
        primary
        rank
        role
        status
        endOfTourDate
        avatar(size: 32)
        position {
          uuid
          name
          type
          code
          status
          organization {
            uuid
            shortName
          }
          location {
            uuid
            name
          }
        }
      }
      primaryAdvisor {
        uuid
      }
      primaryPrincipal {
        uuid
      }
      tasks {
        uuid
        shortName
        longName
        customFieldRef1 {
          uuid
          shortName
        }
        taskedOrganizations {
          uuid
          shortName
        }
        customFields
      }
      comments {
        uuid
        text
        createdAt
        updatedAt
        author {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
      principalOrg {
        uuid
        shortName
        longName
        identificationCode
        type
      }
      advisorOrg {
        uuid
        shortName
        longName
        identificationCode
        type
      }
      workflow {
        type
        createdAt
        step {
          uuid
          name
          approvers {
            uuid
            name
            person {
              uuid
              name
              rank
              role
              avatar(size: 32)
            }
          }
        }
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
      approvalStep {
        uuid
        name
        approvers {
          uuid
        }
        nextStepUuid
      }
      tags {
        uuid
        name
        description
      }
      reportSensitiveInformation {
        uuid
        text
      }
      authorizationGroups {
        uuid
        name
        description
      }
      customFields
    }
  }
`

const CompactReportView = ({ pageDispatchers }) => {
  const history = useHistory()
  const { uuid } = useParams()
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT, {
    uuid
  })

  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Report",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }
  let report
  if (!data) {
    report = new Report()
  } else {
    data.report.tasks = Task.fromArray(data.report.tasks)
    data.report.attendees = Person.fromArray(data.report.attendees)
    data.report.to = ""
    data.report[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.report.customFields
    )
    report = new Report(data.report)
  }

  if (_isEmpty(report)) {
    return (
      <CompactViewHeader returnToDefualtPage={returnToDefualtPage} noReport />
    )
  }
  // Get initial tasks/attendees instant assessments values
  report = Object.assign(report, report.getTasksEngagementAssessments())
  report = Object.assign(report, report.getAttendeesEngagementAssessments())
  const draftAttr = report.isDraft() ? "draft" : "not-draft"
  return (
    <Formik
      validationSchema={Report.yupSchema}
      validateOnMount
      initialValues={report}
    >
      {() => (
        <React.Fragment>
          <CompactViewHeader
            onPrintClick={printReport}
            returnToDefualtPage={returnToDefualtPage}
          />
          <div
            css={COMPACT_VIEW_STYLE}
            className="compact-view"
            data-draft={draftAttr}
          >
            <CompactTableHeaderContent report={report} />
            <CompactTable>
              <CompactRow
                rowType={ROW_TYPES.titleLike}
                style={TITLE_STYLE}
                label={getReportTitle()}
                className="reportField"
              />
              <CompactRow
                rowType={ROW_TYPES.titleLike}
                style={SUBTITLE_STYLE}
                label={getReportSubTitle()}
                className="reportField"
              />
              <CompactRow
                label="purpose"
                content={report.intent}
                className="reportField"
              />
              <CompactRow
                label={Settings.fields.report.keyOutcomes || "key outcomes"}
                content={report.keyOutcomes}
                className="reportField"
              />
              <CompactRow
                label={Settings.fields.report.nextSteps}
                content={report.intent}
                className="reportField"
              />
              <CompactRow
                label="principals"
                content={getPrincipalAttendees()}
                className="reportField"
              />
              <CompactRow
                label="advisors"
                content={getAdvisorAttendees()}
                className="reportField"
              />
              {!report.cancelled ? (
                <CompactRow
                  label={Settings.fields.report.atmosphere}
                  content={
                    <React.Fragment>
                      {utils.sentenceCase(report.atmosphere)}
                      {report.atmosphereDetails &&
                        ` – ${report.atmosphereDetails}`}
                    </React.Fragment>
                  }
                  className="reportField"
                />
              ) : null}
              <CompactRow
                label={Settings.fields.task.subLevel.longLabel}
                content={getTasksAndAssessments()}
                className="reportField"
              />
              {report.cancelled ? (
                <CompactRow
                  label="cancelled reason"
                  content={utils.sentenceCase(report.cancelledReason)}
                  className="reportField"
                />
              ) : null}
              {report.showWorkflow() ? (
                <CompactRowReportWorkflow
                  workflow={report.workflow}
                  compactStyle={WORKFLOW_STYLE}
                  className="reportField"
                />
              ) : null}
              {report.reportText ? (
                <CompactRow
                  label={Settings.fields.report.reportText}
                  content={parseHtmlWithLinkTo(report.reportText)}
                  className="reportField"
                />
              ) : null}
              {Settings.fields.report.customFields ? (
                <ReadonlyCustomFields
                  fieldsConfig={Settings.fields.report.customFields}
                  values={report}
                  vertical
                  compactStyle={{}}
                />
              ) : null}
            </CompactTable>
            <CompactTableFooterContent report={report} />
          </div>
        </React.Fragment>
      )}
    </Formik>
  )

  function returnToDefualtPage() {
    history.push(`/reports/${report.uuid}`)
  }

  function printReport() {
    if (typeof window.print === "function") {
      window.print()
    } else {
      alert("Press CTRL+P to print this report")
    }
  }

  function getReportTitle() {
    return (
      <React.Fragment>
        Engagement of{" "}
        <LinkTo
          modelType="Person"
          model={Report.getPrimaryAttendee(
            report.attendees,
            Person.ROLE.PRINCIPAL
          )}
        />{" "}
        by{" "}
        <LinkTo
          modelType="Person"
          model={Report.getPrimaryAttendee(
            report.attendees,
            Person.ROLE.ADVISOR
          )}
        />
        <br />
        on{" "}
        {moment(report.engagementDate).format(
          Report.getEngagementDateFormat()
        )}{" "}
        at{" "}
        {report.location && (
          <LinkTo modelType="Location" model={report.location} />
        )}
      </React.Fragment>
    )
  }

  function getReportSubTitle() {
    return (
      <React.Fragment>
        Authored by <LinkTo modelType="Person" model={report.author} /> on{" "}
        {moment(report.releasedAt).format(
          Settings.dateFormats.forms.displayShort.withTime
        )}
        [{Report.STATE_LABELS[report.state]}]
      </React.Fragment>
    )
  }

  function getPrincipalAttendees() {
    let principalAttendees = []
    const primaryPrincipal = Report.getPrimaryAttendee(
      report.attendees,
      Person.ROLE.PRINCIPAL
    )
    if (primaryPrincipal) {
      principalAttendees.push(primaryPrincipal)
    }

    principalAttendees = principalAttendees.concat(
      report.attendees.filter(attendee => {
        // filter principal attendees which are not the primary one we added above
        return (
          attendee.role === Person.ROLE.PRINCIPAL &&
          attendee.uuid !== principalAttendees[0]?.uuid
        )
      })
    )
    return getAttendeesAndAssessments(
      sortGroupByOrganization(principalAttendees)
    )
  }

  function getAdvisorAttendees() {
    let advisorAttendees = []
    const primaryAdvisor = Report.getPrimaryAttendee(
      report.attendees,
      Person.ROLE.ADVISOR
    )
    if (primaryAdvisor) {
      advisorAttendees.push(primaryAdvisor)
    }

    advisorAttendees = advisorAttendees.concat(
      report.attendees.filter(attendee => {
        // filter advisor attendees which are not the primary one we added above
        return (
          attendee.role === Person.ROLE.ADVISOR &&
          attendee.uuid !== advisorAttendees[0]?.uuid
        )
      })
    )
    return getAttendeesAndAssessments(sortGroupByOrganization(advisorAttendees))
  }

  function getTasksAndAssessments() {
    return (
      <table>
        <tbody>
          {report.tasks.map(task => {
            const taskInstantAssessmentConfig = task.getInstantAssessmentConfig()
            // return only name and objective if no assessment
            return (
              <CompactRow
                key={task.uuid}
                label={<LinkTo modelType={Task.resourceName} model={task} />}
                content={
                  <table>
                    <tbody>
                      <CompactRow
                        label={Settings.fields.task.topLevel.shortLabel}
                        content={
                          task.customFieldRef1 && (
                            <LinkTo
                              modelType="Task"
                              model={task.customFieldRef1}
                            >
                              {task.customFieldRef1.shortName}
                            </LinkTo>
                          )
                        }
                      />
                      {taskInstantAssessmentConfig && (
                        <ReadonlyCustomFields
                          parentFieldName={`${Report.TASKS_ASSESSMENTS_PARENT_FIELD}.${task.uuid}`}
                          fieldsConfig={taskInstantAssessmentConfig}
                          values={report}
                          vertical
                          compactStyle={{}}
                        />
                      )}
                    </tbody>
                  </table>
                }
              />
            )
          })}
        </tbody>
      </table>
    )
  }

  function getAttendeesAndAssessments(attendees) {
    // to keep track of different organization, if it is same consecutively, don't show for compactness
    let prevDiffOrgName = ""
    return (
      <table>
        <tbody>
          {attendees.map(attendee => {
            const attendeeInstantAssessmentConfig = attendee.getInstantAssessmentConfig()
            const renderOrgName =
              prevDiffOrgName !== attendee.position?.organization?.shortName
            prevDiffOrgName = renderOrgName
              ? attendee.position?.organization?.shortName
              : prevDiffOrgName
            return (
              <CompactRow
                key={attendee.uuid}
                label={
                  <React.Fragment>
                    <LinkTo modelType="Person" model={attendee} />
                    {renderOrgName && (
                      <LinkTo
                        modelType="Organization"
                        model={
                          attendee.position && attendee.position.organization
                        }
                        whenUnspecified=" 'NA'"
                      />
                    )}
                  </React.Fragment>
                }
                content={
                  attendeeInstantAssessmentConfig && (
                    <table>
                      <tbody>
                        <ReadonlyCustomFields
                          parentFieldName={`${Report.ATTENDEES_ASSESSMENTS_PARENT_FIELD}.${attendee.uuid}`}
                          fieldsConfig={attendeeInstantAssessmentConfig}
                          values={report}
                          vertical
                          compactStyle={{}}
                        />
                      </tbody>
                    </table>
                  )
                }
                style={css`
                  th {
                    line-height: 1.4;
                    width: max-content;
                  }
                  th label {
                    margin-right: 4px;
                  }
                `}
              />
            )
          })}
        </tbody>
      </table>
    )
  }
  // first item is primary, grouped around that item
  // people without organization at the end
  function sortGroupByOrganization(attendees) {
    if (attendees.length === 0) {
      return attendees
    }
    const sortedAttendees = []
    sortedAttendees.push(attendees[0])
    // keep track of index for non-org people, primary always has org so start at 1
    let indexWithoutOrg = 1
    attendees.forEach((attendeeEach, index) => {
      if (index !== 0) {
        // if no organization, put it at the end
        if (!attendeeEach.position?.organization) {
          sortedAttendees.push(attendeeEach)
        } else {
          // check if same org exists and it is not the exact same attendee
          const indexFound = attendees.findIndex(
            attendeeFind =>
              attendeeEach.uuid !== attendeeFind.uuid &&
              attendeeEach.position?.organization?.uuid ===
                attendeeFind.position?.organization?.uuid
          )
          // if found we should insert next to similar ones
          if (indexFound > -1) {
            sortedAttendees.splice(indexFound + 1, 0, attendeeEach)
          } else {
            // add new org people just before non-org peope line
            sortedAttendees.splice(indexWithoutOrg, 0, attendeeEach)
          }
          // we added someone with org, index moves up
          indexWithoutOrg++
        }
      }
    })
    return sortedAttendees
  }
}

CompactReportView.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

// color-adjust forces browsers to keep color values of the node
// supported in most major browsers' new versions, but not in IE or some older versions
const COMPACT_VIEW_STYLE = css`
  position: relative;
  outline: 2px solid grey;
  padding: 0 1rem;
  width: 21cm;
  table,
  tbody,
  tr {
    width: 100% !important;
    background-color: transparent !important;
  }
  td {
    background-color: transparent !important;
  }
  &[data-draft="draft"]:before {
    content: "DRAFT";
    z-index: -1000;
    position: absolute;
    font-weight: 100;
    top: 300px;
    left: 20%;
    font-size: 150px;
    color: rgba(161, 158, 158, 0.699) !important;
    -webkit-print-color-adjust: exact;
    color-adjust: exact !important;
    transform: rotateZ(-45deg);
  }
  @media print {
    position: static;
    padding: 0;
    outline: none;
    &[data-draft="draft"]:before {
      top: 40%;
      position: fixed;
    }
    .banner {
      display: inline-block !important;
      -webkit-print-color-adjust: exact;
      color-adjust: exact !important;
    }
    .workflow-action button {
      display: inline block !important;
    }
  }
`

const TITLE_STYLE = css`
  & > th {
    font-size: 18px;
    font-style: normal;
    color: black;
    text-align: center;
    font-weight: bold;
  }
`

const SUBTITLE_STYLE = css`
  & > th {
    font-style: italic;
    color: black;
    text-align: center;
    font-weight: normal;
  }
`

const CompactViewHeader = ({ onPrintClick, returnToDefualtPage, noReport }) => {
  return (
    <header css={HEADER_STYLE}>
      <h3 css={HEADER_TITLE_STYLE} value="title">
        Compact Version
      </h3>
      <div css={BUTTONS_STYLE}>
        {!noReport && (
          <Button
            value="print"
            type="button"
            bsStyle="primary"
            onClick={onPrintClick}
          >
            Print
          </Button>
        )}
        <Button
          value="webView"
          type="button"
          bsStyle="primary"
          onClick={returnToDefualtPage}
        >
          Web View
        </Button>
      </div>
    </header>
  )
}

CompactViewHeader.propTypes = {
  onPrintClick: PropTypes.func,
  returnToDefualtPage: PropTypes.func,
  noReport: PropTypes.bool
}

CompactViewHeader.defaultProps = {
  noReport: false
}

const HEADER_STYLE = css`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  max-width: 21cm;
`

const HEADER_TITLE_STYLE = css`
  margin: 0;
  @media print {
    display: none;
  }
`

const BUTTONS_STYLE = css`
  margin-bottom: 1rem;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  button {
    margin-left: 5px;
    margin-right: 5px;
  }
`

const CompactTableHeaderContent = ({ report }) => {
  const location = useLocation()
  const { appSettings } = useContext(AppContext)
  return (
    <div
      css={css`
        ${HEADER_CONTENT_STYLE};
        background-color: ${appSettings[SETTING_KEY_COLOR]} !important;
      `}
    >
      <img src={anetLogo} alt="logo" width="50" height="12" />
      <ClassificationBanner />
      <span style={{ fontSize: "12px" }}>
        <Link to={location.pathname}>{report.uuid}</Link>
      </span>
    </div>
  )
}

CompactTableHeaderContent.propTypes = {
  report: PropTypes.object
}

const CompactTableFooterContent = () => {
  const { currentUser, appSettings } = useContext(AppContext)
  return (
    <div
      css={css`
        ${FOOTER_CONTENT_STYLE};
        background-color: ${appSettings[SETTING_KEY_COLOR]} !important;
      `}
    >
      <img src={anetLogo} alt="logo" width="50" height="12" />
      <ClassificationBanner />
      <span css={PRINTED_BY_STYLE}>
        printed by{" "}
        <span>
          <LinkTo modelType="Person" model={currentUser} />
        </span>
      </span>
    </div>
  )
}

// background color of banner makes reading blue links hard. Force white color
const HF_COMMON_STYLE = css`
  position: absolute;
  left: 0mm;
  display: flex;
  width: 100%;
  max-height: 50px;
  margin: 10px auto;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  -webkit-print-color-adjust: exact !important;
  color-adjust: exact !important;
  img {
    max-width: 50px !important;
    max-height: 24px !important;
  }
  & * {
    color: white !important;
  }
  @media print {
    position: fixed;
    max-height: 70px;
  }
`

const HEADER_CONTENT_STYLE = css`
  ${HF_COMMON_STYLE};
  top: 0mm;
  border-bottom: 1px solid black;
`

const FOOTER_CONTENT_STYLE = css`
  ${HF_COMMON_STYLE};
  bottom: 0mm;
  border-top: 1px solid black;
`

const PRINTED_BY_STYLE = css`
  width: auto;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
  & > span {
    display: inline-block;
    text-align: right;
  }
`

const ClassificationBanner = () => {
  return (
    <div
      css={css`
        ${CLASSIFICATION_BANNER_STYLE}
      `}
    >
      <CompactSecurityBanner />
    </div>
  )
}

const CLASSIFICATION_BANNER_STYLE = css`
  width: auto;
  max-width: 67%;
  text-align: center;
  display: inline-block;
  & > .banner {
    padding: 2px 4px;
  }
`
const CompactTable = ({ children }) => {
  return (
    <table css={TABLE_STYLE}>
      <thead>
        <tr>
          <td css={SPACE_STYLE} colSpan="2" />
        </tr>
      </thead>
      <tbody>{children}</tbody>
      <tfoot>
        <tr>
          <td css={SPACE_STYLE} colSpan="2" />
        </tr>
      </tfoot>
    </table>
  )
}

CompactTable.propTypes = {
  children: PropTypes.node
}

const TABLE_STYLE = css`
  width: 100%;
`

const SPACE_STYLE = css`
  height: 80px;
`

export const ROW_TYPES = {
  titleLike: "titleLike",
  onlyData: "onlyData"
}

export const CompactRow = ({ label, content, rowType, ...otherProps }) => {
  const { style, className } = otherProps
  const customStyle = css`
    ${ROW_STYLE};
    ${style};
  `
  if (rowType === ROW_TYPES.titleLike) {
    return (
      <tr css={customStyle}>
        <th css={ROW_LABEL_STYLE} colSpan="2">
          {label}
        </th>
      </tr>
    )
  }

  if (rowType === ROW_TYPES.onlyData) {
    return (
      <tr css={customStyle}>
        <td css={ROW_CONTENT_STYLE} colSpan="2">
          {content}
        </td>
      </tr>
    )
  }

  const lowerLabel =
    typeof label === "string" ? label.toLocaleLowerCase() : label
  return (
    <tr css={customStyle} className={className || null}>
      <th css={ROW_LABEL_STYLE}>{lowerLabel}</th>
      <td css={ROW_CONTENT_STYLE}>{content}</td>
    </tr>
  )
}

CompactRow.propTypes = {
  label: PropTypes.node,
  content: PropTypes.node,
  rowType: PropTypes.string
}

const ROW_STYLE = css`
  vertical-align: top;
  font-family: "Times New Roman", Times, serif;
  width: 100%;
`

const ROW_LABEL_STYLE = css`
  padding: 4px 0;
  font-style: italic;
  color: grey;
  width: 15%;
  font-weight: 300;
`

const ROW_CONTENT_STYLE = css`
  padding: 4px 1rem;
`

const WORKFLOW_STYLE = css`
  & > td {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    flex-wrap: wrap;
    align items: center;
    text-align: center;
    & > div {
      position: relative;
      margin-right: 18px;
    }
    & > div:not(:last-child):after {
      position: absolute;
      right: -18px;
      top: 0;
      content: "→";
    }
    & > div > button {
      padding: 0 5px !important;
      margin: 0;
    }
  }
`

export default connect(null, mapPageDispatchersToProps)(CompactReportView)
