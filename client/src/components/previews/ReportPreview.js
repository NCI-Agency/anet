import { gql } from "@apollo/client"
import API from "api"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import NoPaginationTaskTable from "components/NoPaginationTaskTable"
import PlanningConflictForReport from "components/PlanningConflictForReport"
import RichTextEditor from "components/RichTextEditor"
import { Person, Report, Task } from "models"
import moment from "moment"
import ReportPeople from "pages/reports/ReportPeople"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React from "react"
import Settings from "settings"
import utils from "utils"

const GQL_GET_REPORT = gql`
  query ($uuid: String!) {
    report(uuid: $uuid) {
      uuid
      intent
      engagementDate
      duration
      atmosphere
      atmosphereDetails
      keyOutcomes
      nextSteps
      cancelledReason
      reportText
      releasedAt
      state
      location {
        uuid
        name
        lat
        lng
      }
      authors {
        uuid
        name
        rank
        role
        avatar(size: 32)
      }
      reportPeople {
        uuid
        name
        author
        primary
        attendee
        rank
        role
        status
        avatar(size: 32)
        position {
          uuid
          name
          type
          role
        }
      }
      tasks {
        uuid
        shortName
        longName
        parentTask {
          uuid
          shortName
        }
        ascendantTasks {
          uuid
          shortName
          parentTask {
            uuid
          }
        }
        taskedOrganizations {
          uuid
          shortName
        }
        customFields
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
    }
  }
`

const ReportPreview = ({ className, uuid }) => {
  const { data, error } = API.useApiQuery(GQL_GET_REPORT, {
    uuid
  })

  if (!data) {
    if (error) {
      return <p>Could not load the preview</p>
    }
    return null
  }

  let report

  data.report.cancelled = !!data.report.cancelledReason
  data.report.tasks = Task.fromArray(data.report.tasks)
  data.report.reportPeople = Report.sortReportPeople(
    Person.fromArray(data.report.reportPeople)
  )
  report = new Report(data.report)
  const reportType = report.isFuture() ? "planned engagement" : "report"
  const tasksLabel = pluralize(Settings.fields.task.subLevel.shortLabel)

  // Get initial tasks/people instant assessments values
  const hasAssessments = report.engagementDate && !report.isFuture()
  if (hasAssessments) {
    report = Object.assign(report, report.getTasksEngagementAssessments())
    report = Object.assign(report, report.getAttendeesEngagementAssessments())
  }

  return (
    <div className={`report-preview preview-content-scroll ${className || ""}`}>
      {report.isPublished() && (
        <div className="preview-section text-center">
          <h4 className="text-danger">This {reportType} is PUBLISHED.</h4>
        </div>
      )}

      {report.isRejected() && (
        <div className="preview-section text-center">
          <h4 className="text-danger">
            This {reportType} has CHANGES REQUESTED.
          </h4>
        </div>
      )}

      {report.isDraft() && (
        <div className="preview-section text-center">
          <h4 className="text-danger">
            This is a DRAFT {reportType} and hasn't been submitted.
          </h4>
        </div>
      )}

      {report.isPending() && (
        <div className="preview-section text-center">
          <h4 className="text-danger">
            This {reportType} is PENDING approvals.
          </h4>
        </div>
      )}

      {report.isApproved() && (
        <div className="preview-section text-center">
          <h4 className="text-danger">This {reportType} is APPROVED.</h4>
        </div>
      )}

      <h4>Report {uuid}</h4>
      <div className="preview-section">
        <PreviewField
          extraColForValue={true}
          label="Summary"
          value={
            <div id={"intent"} className="form-control-static">
              <p>
                <strong>{Settings.fields.report.intent}:</strong>{" "}
                {report.intent}
              </p>
              {report.keyOutcomes && (
                <p>
                  <span>
                    <strong>
                      {Settings.fields.report.keyOutcomes || "Key outcomes"}:
                    </strong>{" "}
                    {report.keyOutcomes}&nbsp;
                  </span>
                </p>
              )}
              <p>
                <strong>{Settings.fields.report.nextSteps.label}:</strong>{" "}
                {report.nextSteps}
              </p>
            </div>
          }
        />

        <PreviewField
          extraColForValue={true}
          label="Engagement date"
          value={
            <React.Fragment>
              <>
                {report.engagementDate &&
                  moment(report.engagementDate).format(
                    Report.getEngagementDateFormat()
                  )}
                <PlanningConflictForReport report={report} largeIcon />
              </>
            </React.Fragment>
          }
        />

        {Settings.engagementsIncludeTimeAndDuration && report.duration && (
          <PreviewField
            extraColForValue={true}
            label="Duration (minutes)"
            value={report.duration}
          />
        )}

        <PreviewField
          extraColForValue={true}
          label="Location"
          value={
            report.location && (
              <LinkTo modelType="Location" model={report.location} />
            )
          }
        />

        {report.cancelled && (
          <PreviewField
            extraColForValue={true}
            label="Cancelled Reason"
            value={utils.sentenceCase(report.cancelledReason)}
          />
        )}

        {!report.cancelled && (
          <PreviewField
            extraColForValue={true}
            label={Settings.fields.report.atmosphere}
            value={
              <React.Fragment>
                {utils.sentenceCase(report.atmosphere)}
                {report.atmosphereDetails && ` – ${report.atmosphereDetails}`}
              </React.Fragment>
            }
          />
        )}

        <PreviewField
          extraColForValue={true}
          label="Authors"
          value={report.authors?.map((a, index) => (
            <React.Fragment key={a.uuid}>
              <LinkTo modelType="Person" model={a} />
              {index !== report.authors.length - 1 ? ", " : ""}
            </React.Fragment>
          ))}
        />

        <PreviewField
          extraColForValue={true}
          label={Settings.fields.advisor.org.name}
          value={<LinkTo modelType="Organization" model={report.advisorOrg} />}
        />

        <PreviewField
          extraColForValue={true}
          label={Settings.fields.principal.org.name}
          value={
            <LinkTo modelType="Organization" model={report.principalOrg} />
          }
        />
      </div>
      <h4>
        {report.isFuture()
          ? "People who will attend to this planned engagement"
          : "People attended in this engagement"}
      </h4>
      <div className="preview-section">
        <ReportPeople report={report} disabled />
      </div>
      {report.reportText && (
        <React.Fragment>
          <h4>{Settings.fields.report.reportText}</h4>
          <div className="preview-section">
            <RichTextEditor readOnly value={report.reportText} />
          </div>
        </React.Fragment>
      )}
      <h4>{Settings.fields.task.subLevel.longLabel}</h4>
      <div className="preview-section">
        <NoPaginationTaskTable
          tasks={report.tasks}
          noTasksMessage={`No ${tasksLabel} selected`}
        />
      </div>
    </div>
  )
}

ReportPreview.propTypes = {
  className: PropTypes.string,
  uuid: PropTypes.string
}

export default ReportPreview
