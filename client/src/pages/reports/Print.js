import AppContext from "components/AppContext"
import { ReadonlyCustomFields } from "components/CustomFields"
import LinkTo from "components/LinkTo"
import { Report, Task } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useContext, useEffect } from "react"
import anetLogo from "resources/logo.png"
import Settings from "settings"
import "./Print.css"
const ReportPrint = ({ report, setPrintDone }) => {
  const { currentUser } = useContext(AppContext)

  const tasksLabel = Settings.fields.task.subLevel.longLabel.toLowerCase()

  useEffect(() => {
    // wait for render to print
    setTimeout(() => {
      if (typeof window.print !== "function") {
        window.print()
      } else {
        alert("Press CTRL+P to print this report")
      }
      setPrintDone()
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
              <td className="print-row-content">{report.keyOutcomes}</td>
            </tr>
            {Settings.engagementsIncludeTimeAndDuration && report.duration && (
              <tr>
                <th className="print-row-label">duration(min)</th>
                <td className="print-row-content">{report.duration}</td>
              </tr>
            )}
            <tr>
              <th className="print-row-label">{tasksLabel}</th>
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

  function effortsAndAssessments() {
    if (!report) {
      return null
    }
    return (
      <table>
        <tbody>
          {report.tasks.map(task => {
            const taskInstantAssessmentConfig = task.getInstantAssessmentConfig()
            if (!taskInstantAssessmentConfig) {
              return null
            }
            console.log(taskInstantAssessmentConfig)
            return (
              <tr key={task.uuid}>
                <th>
                  <LinkTo modelType={Task.resourceName} model={task} />
                </th>
                <td className="print-task-assessment-field">
                  <ReadonlyCustomFields
                    parentFieldName={`${Report.TASKS_ASSESSMENTS_PARENT_FIELD}.${task.uuid}`}
                    fieldsConfig={taskInstantAssessmentConfig}
                    values={report}
                  />
                </td>
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
