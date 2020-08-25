/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import AppContext from "components/AppContext"
import { ReadonlyCustomFields } from "components/CustomFields"
import LinkTo from "components/LinkTo"
import { ReportFullWorkflow } from "components/ReportWorkflow"
import SecurityBanner from "components/SecurityBanner"
import { Person, Report, Task } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { Button } from "react-bootstrap"
import { Link, useLocation } from "react-router-dom"
import anetLogo from "resources/logo.png"
import Settings from "settings"
import utils from "utils"
import { parseHtmlWithLinkTo } from "utils_links"
import "./Print.css"
const PrintReportPage = ({ report, setPrintDone }) => {
  console.log("Print Report Page Render")
  if (!report) {
    return null
  }
  report.formCustomFields.itemsAgreed = [
    {
      item: "Very good item",
      dueDate: moment()
    },
    {
      item: "Very nice item",
      dueDate: moment()
    },
    {
      item: "Very bad item",
      dueDate: moment()
    }
  ]

  return (
    <React.Fragment>
      <PrintPageHeader onPrintClick={printReport} setPrintDone={setPrintDone} />
      <div css={PRINT_PAGE_STYLE} className="print-page">
        <ReportHeaderContent report={report} />
        <PrintTable>
          <PrintRow
            rowType={ROW_TYPES.titleLike}
            style={TITLE_STYLE}
            label={getReportTitle()}
          />
          <PrintRow
            rowType={ROW_TYPES.titleLike}
            style={SUBTITLE_STYLE}
            label={getReportSubTitle()}
          />
          <PrintRow
            label="purpose"
            content={
              report.intent +
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Omnis facilis ipsa, alias numquam harum a tenetur nemo vero deserunt. Animi neque nihil illo ipsum atque voluptas quis cumque, quaerat officiis hic quibusdam, eveniet, provident dignissimos amet quam ex doloribus! Quas ducimus nam veritatis nobis impedit ut corporis cupiditate? Magni facilis repellat hic ipsa at? Minima doloribus nisi dignissimos numquam incidunt reiciendis quas ipsam ea accusamus cupiditate asperiores dolor illo error fugit sed alias, hic et porro sint, repellat earum? Deserunt illo exercitationem natus praesentium aspernatur facilis accusantium fuga adipisci tempora? Nobis dolore tenetur id dolorem, cupiditate perferendis qui repellendus sit esse adipisci, provident impedit nesciunt necessitatibus. Aliquam quia corrupti aspernatur esse?"
            }
          />

          <PrintRow
            label={Settings.fields.report.keyOutcomes || "key outcomes"}
            content={report.keyOutcomes}
          />
          <PrintRow
            label={Settings.fields.report.nextSteps}
            content={report.intent}
          />
          <PrintRow label="attendees" content={getAttendeesAndAssessments()} />
          {report.showWorkflow() ? (
            <ReportFullWorkflow
              workflow={report.workflow}
              printStyle={WORKFLOW_STYLE}
            />
          ) : null}
          <PrintRow label="comments" content={getComments()} />
          {!report.cancelled ? (
            <PrintRow
              label={Settings.fields.report.atmosphere}
              content={
                <React.Fragment>
                  {utils.sentenceCase(report.atmosphere)}
                  {report.atmosphereDetails && ` – ${report.atmosphereDetails}`}
                </React.Fragment>
              }
            />
          ) : null}
          <PrintRow
            label={Settings.fields.task.subLevel.longLabel}
            content={getTasksAndAssessments()}
          />
          {Settings.engagementsIncludeTimeAndDuration && report.duration ? (
            <PrintRow label="duration(min)" content={report.duration} />
          ) : null}
          {report.cancelled ? (
            <PrintRow
              label="cancelled reason"
              content={utils.sentenceCase(report.cancelledReason)}
            />
          ) : null}
          {report.reportText ? (
            <PrintRow
              label={Settings.fields.report.reportText}
              content={parseHtmlWithLinkTo(report.reportText)}
            />
          ) : null}
          {report.reportSensitiveInformation &&
          report.reportSensitiveInformation.text ? (
            <PrintRow
              label="sensitive information"
              content={parseHtmlWithLinkTo(
                report.reportSensitiveInformation.text
              )}
            />
            ) : null}
          {Settings.fields.report.customFields ? (
            <ReadonlyCustomFields
              fieldsConfig={Settings.fields.report.customFields}
              values={report}
              vertical
              printStyle={{}}
            />
          ) : null}
        </PrintTable>
        <ReportFooterContent report={report} />
      </div>
    </React.Fragment>
  )

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

  function getAttendeesAndAssessments() {
    // to keep track of different organization, if it is same consecutively, don't print for compactness
    let prevDiffOrgName = ""
    return (
      <table>
        <tbody>
          {report.attendees.map(attendee => {
            const attendeeInstantAssessmentConfig = attendee.getInstantAssessmentConfig()
            const renderOrgName =
              prevDiffOrgName !== attendee.position?.organization?.shortName
            prevDiffOrgName = renderOrgName
              ? attendee.position?.organization?.shortName
              : prevDiffOrgName
            return (
              <PrintRow
                key={attendee.uuid}
                label={
                  <React.Fragment>
                    {attendee.primary && (
                      <label className="label label-primary">Primary</label>
                    )}
                    <LinkTo modelType="Person" model={attendee} />
                    {renderOrgName && (
                      <LinkTo
                        modelType="Organization"
                        model={
                          attendee.position && attendee.position.organization
                        }
                        whenUnspecified=""
                      />
                    )}
                  </React.Fragment>
                }
                content={
                  attendeeInstantAssessmentConfig && (
                    <ReadonlyCustomFields
                      parentFieldName={`${Report.ATTENDEES_ASSESSMENTS_PARENT_FIELD}.${attendee.uuid}`}
                      fieldsConfig={attendeeInstantAssessmentConfig}
                      values={report}
                      vertical
                    />
                  )
                }
                style={css`
                  th {
                    line-height: 1.4;
                    width: auto;
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

  function getTasksAndAssessments() {
    return (
      <table>
        <tbody>
          {report.tasks.map(task => {
            const taskInstantAssessmentConfig = task.getInstantAssessmentConfig()
            // return only name and objective if no assessment
            return (
              <PrintRow
                key={task.uuid}
                label={<LinkTo modelType={Task.resourceName} model={task} />}
                content={
                  <React.Fragment>
                    <div className="form-group">
                      <label htmlFor={`${task.uuid}-topLevel`}>
                        {Settings.fields.task.topLevel.shortLabel}
                      </label>
                      <br />
                      {task.customFieldRef1 && (
                        <LinkTo modelType="Task" model={task.customFieldRef1}>
                          {task.customFieldRef1.shortName}
                        </LinkTo>
                      )}
                    </div>
                    {taskInstantAssessmentConfig && (
                      <ReadonlyCustomFields
                        parentFieldName={`${Report.TASKS_ASSESSMENTS_PARENT_FIELD}.${task.uuid}`}
                        fieldsConfig={taskInstantAssessmentConfig}
                        values={report}
                        vertical
                      />
                    )}
                  </React.Fragment>
                }
              />
            )
          })}
        </tbody>
      </table>
    )
  }

  function getComments() {
    return (
      <React.Fragment>
        {report.comments.map(comment => {
          const createdAt = moment(comment.createdAt)
          return (
            <p key={comment.uuid}>
              <LinkTo modelType="Person" model={comment.author} />,
              <span
                title={createdAt.format(
                  Settings.dateFormats.forms.displayShort.withTime
                )}
              >
                {" "}
                {createdAt.fromNow()}:{" "}
              </span>
              "{comment.text}"
            </p>
          )
        })}

        {!report.comments.length && <p>There are no comments</p>}
      </React.Fragment>
    )
  }
}

PrintReportPage.propTypes = {
  report: PropTypes.object.isRequired,
  setPrintDone: PropTypes.func
}

const PRINT_PAGE_STYLE = css`
  position: relative;
  outline: 2px solid grey;
  padding: 0 1rem;
  width: 768px;
  @media print {
    position: static;
    padding: 0;
    outline: none;
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

const PrintPageHeader = ({ onPrintClick, setPrintDone }) => {
  return (
    <header css={HEADER_STYLE}>
      <h3 css={HEADER_TITLE_STYLE}>Printable Version</h3>
      <div css={BUTTONS_STYLE}>
        <Button type="button" bsStyle="primary" onClick={onPrintClick}>
          Print
        </Button>
        <Button type="button" bsStyle="primary" onClick={setPrintDone}>
          Web View
        </Button>
      </div>
    </header>
  )
}

PrintPageHeader.propTypes = {
  onPrintClick: PropTypes.func,
  setPrintDone: PropTypes.func
}

const HEADER_STYLE = css`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 768px;
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

const ReportHeaderContent = ({ report }) => {
  const location = useLocation()
  return (
    <div css={HEADER_CONTENT_STYLE}>
      <img src={anetLogo} alt="logo" width="50" height="12" />
      <div css={TOP_CLASSIFICATION_BANNER_STYLE}>
        <SecurityBanner />
      </div>
      <span style={{ fontSize: "12px" }}>
        <Link to={location.pathname}>{report.uuid}</Link>
      </span>
    </div>
  )
}

ReportHeaderContent.propTypes = {
  report: PropTypes.object
}

const ReportFooterContent = () => {
  const { currentUser } = useContext(AppContext)

  return (
    <div css={FOOTER_CONTENT_STYLE}>
      <img src={anetLogo} alt="logo" width="50" height="12" />
      <div css={BOTTOM_CLASSIFICATION_BANNER_STYLE}>
        <SecurityBanner />
      </div>
      <span style={{ fontSize: "12px" }}>
        <React.Fragment>
          printed by <LinkTo modelType="Person" model={currentUser} />
        </React.Fragment>
      </span>
    </div>
  )
}

const HF_COMMON_STYLE = css`
  position: absolute;
  display: flex;
  width: 95%;
  margin: 10px auto;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  img {
    max-width: 50px !important;
    max-height: 24px !important;
  }
  @media print {
    position: fixed;
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

const CLASSIFICATION_BANNER_STYLE = css`
  width: auto;
  text-align: center;
`

const TOP_CLASSIFICATION_BANNER_STYLE = css`
  ${CLASSIFICATION_BANNER_STYLE};
  top: 0;
`

const BOTTOM_CLASSIFICATION_BANNER_STYLE = css`
  ${CLASSIFICATION_BANNER_STYLE};
  bottom: 0;
`

const PrintTable = ({ children }) => {
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

PrintTable.propTypes = {
  children: PropTypes.node
}

const TABLE_STYLE = css`
  width: 100%;
`

const SPACE_STYLE = css`
  height: 70px;
`

export const ROW_TYPES = {
  titleLike: "titleLike",
  onlyData: "onlyData"
}

export const PrintRow = ({ label, content, rowType, ...otherProps }) => {
  const { style } = otherProps
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
    <tr css={customStyle}>
      <th css={ROW_LABEL_STYLE}>{lowerLabel}</th>
      <td css={ROW_CONTENT_STYLE}>{content}</td>
    </tr>
  )
}

PrintRow.propTypes = {
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
    flex-wrap: wrap;
    text-align: center;
    & > div {
      position: relative;
      margin-right: 24px;
    }
    & > div:not(:last-child):after {
      position: absolute;
      right: -18px;
      top: 0;
      content: "→";
    }
  }
`

export default PrintReportPage
