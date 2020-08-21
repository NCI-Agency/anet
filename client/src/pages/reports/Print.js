import AppContext from "components/AppContext"
import { ReadonlyCustomFields } from "components/CustomFields"
import LinkTo from "components/LinkTo"
import { Report, Task } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useContext, useEffect } from "react"
import anetLogo from "resources/logo.png"
import Settings from "settings"
import utils from "utils"
import "./Print.css"
const ReportPrint = ({ report, setPrintDone }) => {
  const { currentUser } = useContext(AppContext)

  useEffect(() => {
    // wait for render to print
    setTimeout(() => {
      if (typeof window.print === "function") {
        window.print()
        // setPrintDone()
      } else {
        alert("Press CTRL+P to print this report")
      }
    }, 100)
  }, [setPrintDone])
  return (
    <>
      <h3 className="report-preview-title" style={{ textAlign: "center" }}>
        Printable Version
      </h3>
      <div className="ReportPrint">
        <div className="print-header-content">
          <img src={anetLogo} alt="logo" width="92" height="21" />
          <div className="print-classification-banner-top">
            Classification Banner
          </div>
          <span style={{ fontSize: "12px" }}>#{report.uuid}</span>
        </div>
        <table className="print-table">
          <thead>
            <tr>
              <td className="print-header-space" colSpan="2" />
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="print-table-title" colSpan="2">
                Engagement of{" "}
                <LinkTo modelType="Person" model={report.author} /> on{" "}
                {moment(report.engagementDate).format(
                  Report.getEngagementDateFormat()
                )}
                <br />
                at{" "}
                {report.location && (
                  <LinkTo modelType="Location" model={report.location} />
                )}
              </th>
            </tr>
            <tr>
              <td className="print-table-subtitle" colSpan="2">
                Authored by <LinkTo modelType="Person" model={report.author} />{" "}
                on{" "}
                {moment(report.releasedAt).format(
                  Settings.dateFormats.forms.displayShort.withTime
                )}
                <br />
                printed by <LinkTo modelType="Person" model={currentUser} /> [
                {Report.STATE_LABELS[report.state]}]
              </td>
            </tr>
            <tr>
              <th className="print-row-label">purpose</th>
              <td className="print-row-content">{report.intent}</td>
            </tr>
            <tr>
              <th className="print-row-label">
                {Settings.fields.report.keyOutcomes.toLowerCase() ||
                  "key outcomes"}
              </th>
              <td className="print-row-content">
                {report.keyOutcomes}
                Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                Repellat consequatur accusantium doloribus facilis.
              </td>
            </tr>
            <tr>
              <th className="print-row-label">
                {Settings.fields.report.nextSteps.toLowerCase()}
              </th>
              <td className="print-row-content">{report.nextSteps}</td>
            </tr>
            {Settings.engagementsIncludeTimeAndDuration && report.duration && (
              <tr>
                <th className="print-row-label">duration(min)</th>
                <td className="print-row-content">{report.duration}</td>
              </tr>
            )}
            {report.cancelled && (
              <tr>
                <th className="print-row-label">cancelled reason</th>
                <td className="print-row-content">
                  {utils.sentenceCase(report.cancelledReason)}
                </td>
              </tr>
            )}
            {!report.cancelled && (
              <tr>
                <th className="print-row-label">
                  {Settings.fields.report.atmosphere.toLowerCase()}
                </th>
                <td className="print-row-content">
                  {" "}
                  <>
                    {utils.sentenceCase(report.atmosphere)}
                    {report.atmosphereDetails &&
                      ` – ${report.atmosphereDetails}`}
                  </>
                </td>
              </tr>
            )}
            <tr>
              <th className="print-row-label">
                {Settings.fields.advisor.org.name.toLowerCase()}
              </th>
              <td className="print-row-content">
                {" "}
                <LinkTo modelType="Organization" model={report.advisorOrg} />
              </td>
            </tr>
            <tr>
              <th className="print-row-label">
                {Settings.fields.principal.org.name.toLowerCase()}
              </th>
              <td className="print-row-content">
                {" "}
                <LinkTo modelType="Organization" model={report.principalOrg} />
              </td>
            </tr>
            <tr>
              <th className="print-row-label">b</th>
              <td className="print-row-content">b</td>
            </tr>
            <tr>
              <th className="print-row-label">b</th>
              <td className="print-row-content">b</td>
            </tr>
            <tr>
              <th className="print-row-label">b</th>
              <td className="print-row-content">b</td>
            </tr>
            <tr>
              <th className="print-row-label">b</th>
              <td className="print-row-content">b</td>
            </tr>
            <tr>
              <th className="print-row-label">meeting attendees</th>
              <td className="print-row-content">
                {
                  ((console.dir(report.attendees), console.dir(report)),
                  attendeesAndAssessments())
                }
              </td>
            </tr>
            <tr>
              <th className="print-row-label">
                {Settings.fields.task.subLevel.longLabel.toLowerCase()}
              </th>
              <td className="print-row-content">{effortsAndAssessments()}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="print-footer-space" colSpan="2" />
            </tr>
          </tfoot>
        </table>
        <div className="print-footer-content">
          <img src={anetLogo} alt="logo" width="92" height="21" />
          <div className="print-classification-banner-bot">
            Classification Banner
          </div>
          <span style={{ fontSize: "12px" }}>#{report.uuid}</span>
        </div>
      </div>
    </>
  )

  // each tasks name, objective and assessments combined into a table
  function effortsAndAssessments() {
    if (!report) {
      return null
    }
    if (report.tasks.length === 0) {
      return <>None</>
    }
    return (
      <table>
        <tbody>
          {report.tasks.map(task => {
            const taskInstantAssessmentConfig = task.getInstantAssessmentConfig()
            // return only name and objective if no assessment
            if (!taskInstantAssessmentConfig) {
              return (
                <tr key={task.uuid}>
                  <th>
                    <LinkTo modelType={Task.resourceName} model={task} />
                  </th>
                  <td className="print-task-assessment-field">
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
                  </td>
                </tr>
              )
            }
            return (
              <tr key={task.uuid}>
                <th>
                  <LinkTo modelType={Task.resourceName} model={task} />
                </th>
                <td className="print-task-assessment-field">
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
                  <h4 style={{ textAlign: "center" }}>Assessments</h4>
                  <ReadonlyCustomFields
                    parentFieldName={`${Report.TASKS_ASSESSMENTS_PARENT_FIELD}.${task.uuid}`}
                    fieldsConfig={taskInstantAssessmentConfig}
                    values={report}
                    vertical
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  function attendeesAndAssessments() {
    if (!report) {
      return null
    }
    if (report.attendees.length === 0) {
      return <>None</>
    }
    // to keep track of different organization, if same don't print for compactness
    // const prevOrg = null
    return (
      <table>
        <tbody>
          {report.attendees.map(attendee => {
            return (
              <tr key={attendee.uuid}>
                <th>
                  <label className="label label-primary">Primary</label>
                  {attendee.name}
                </th>
                <td />
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }
}

// Explanation why we need header-space and header-content (same for footer) to create printable report
// https://medium.com/@Idan_Co/the-ultimate-print-html-template-with-header-footer-568f415f6d2a
// tldr: we need both
// 1- headers and footers to be position fixed at top and bottom of page which "header/footer-content" div provides
// 2- we need normal content not to overlap with headers and footers which "header/footer-space" provides

ReportPrint.propTypes = {
  report: PropTypes.object.isRequired,
  setPrintDone: PropTypes.func
}

export default ReportPrint
