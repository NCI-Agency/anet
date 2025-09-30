import { gql } from "@apollo/client"
import API from "api"
import AuthorizationGroupTable from "components/AuthorizationGroupTable"
import DictionaryField from "components/DictionaryField"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import ListItems from "components/ListItems"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import NoPaginationTaskTable from "components/NoPaginationTaskTable"
import PlanningConflictForReport from "components/PlanningConflictForReport"
import RichTextEditor from "components/RichTextEditor"
import { Person, Report, Task } from "models"
import moment from "moment"
import ReportPeople from "pages/reports/ReportPeople"
import pluralize from "pluralize"
import React from "react"
import Settings from "settings"
import utils from "utils"

const GQL_GET_REPORT = gql`
  query ($uuid: String!) {
    report(uuid: $uuid) {
      uuid
      intent
      classification
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
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
      authors {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
      reportPeople {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        status
        author
        primary
        attendee
        interlocutor
        position {
          uuid
          name
          type
          code
          status
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          organization {
            uuid
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          location {
            uuid
            name
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
        }
        previousPositions {
          startTime
          endTime
          position {
            uuid
            name
            code
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            organization {
              uuid
              shortName
              longName
              identificationCode
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
            location {
              uuid
              name
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
          }
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
          longName
          identificationCode
        }
        customFields
      }
      reportCommunities {
        uuid
        name
        description
      }
      interlocutorOrg {
        uuid
        shortName
        longName
        identificationCode
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
      advisorOrg {
        uuid
        shortName
        longName
        identificationCode
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
    }
  }
`

interface ReportPreviewProps {
  className?: string
  uuid?: string
}

const ReportPreview = ({ className, uuid }: ReportPreviewProps) => {
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
  const tasksLabel = pluralize(Settings.fields.task.shortLabel)

  // Get initial tasks/people instant assessments values
  const hasAssessments = report.engagementDate && !report.isFuture()
  if (hasAssessments) {
    report = Object.assign(report, report.getTasksEngagementAssessments())
    report = Object.assign(report, report.getAttendeesEngagementAssessments())
  }

  const reportTitle = report.intent || `#${report.uuid}`
  return (
    <div className={`report-preview preview-content-scroll ${className || ""}`}>
      {report.classification && (
        <div style={{ width: "100%", fontSize: "18px", textAlign: "center" }}>
          <span style={{ fontWeight: "bold" }}>
            {utils.getConfidentialityLabelForChoice(report.classification)}
          </span>
        </div>
      )}

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

      <h4 className="ellipsized-text">Report {reportTitle}</h4>
      <div className="preview-section">
        <PreviewField
          extraColForValue
          label="Summary"
          value={
            <div id="report-summary">
              <DictionaryField
                wrappedComponent={PreviewField}
                dictProps={Settings.fields.report.intent}
                value={report.intent}
                style={{ marginBottom: 0 }}
              />
              <DictionaryField
                wrappedComponent={PreviewField}
                dictProps={Settings.fields.report.keyOutcomes}
                value={<ListItems value={report.keyOutcomes} />}
                style={{ marginBottom: 0 }}
              />
              <DictionaryField
                wrappedComponent={PreviewField}
                dictProps={Settings.fields.report.nextSteps}
                value={<ListItems value={report.nextSteps} />}
                style={{ marginBottom: 0 }}
              />
            </div>
          }
        />

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.report.engagementDate}
          extraColForValue
          value={
            <>
              <>
                {report.engagementDate &&
                  moment(report.engagementDate).format(
                    Report.getEngagementDateFormat()
                  )}
                <PlanningConflictForReport report={report} largeIcon />
              </>
            </>
          }
        />

        {Settings.engagementsIncludeTimeAndDuration && report.duration && (
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.report.duration}
            extraColForValue
            value={report.duration}
          />
        )}

        <PreviewField
          extraColForValue
          label="Authors"
          value={report.authors?.map((a, index) => (
            <React.Fragment key={a.uuid}>
              <LinkTo modelType="Person" model={a} />
              {index !== report.authors.length - 1 ? ", " : ""}
            </React.Fragment>
          ))}
        />

        <PreviewField
          extraColForValue
          label={Settings.fields.advisor.org.name}
          value={<LinkTo modelType="Organization" model={report.advisorOrg} />}
        />

        <PreviewField
          extraColForValue
          label={Settings.fields.interlocutor.org.name}
          value={
            <LinkTo modelType="Organization" model={report.interlocutorOrg} />
          }
        />

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.report.location}
          extraColForValue
          value={
            report.location && (
              <LinkTo modelType="Location" model={report.location} />
            )
          }
        />

        {report.cancelled && (
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.report.cancelledReason}
            extraColForValue
            value={utils.sentenceCase(report.cancelledReason)}
          />
        )}

        {!report.cancelled && (
          <>
            <DictionaryField
              wrappedComponent={PreviewField}
              dictProps={Settings.fields.report.atmosphere}
              extraColForValue
              value={utils.sentenceCase(report.atmosphere)}
            />
            <DictionaryField
              wrappedComponent={PreviewField}
              dictProps={Settings.fields.report.atmosphereDetails}
              extraColForValue
              value={report.atmosphereDetails}
            />
          </>
        )}

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.report.reportCommunities}
          extraColForValue
          value={
            <AuthorizationGroupTable
              authorizationGroups={report.reportCommunities}
              noAuthorizationGroupsMessage={`No ${Settings.fields.report.reportCommunities?.label} selected`}
            />
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
        <>
          <h4>{Settings.fields.report.reportText.label}</h4>
          <div className="preview-section">
            <RichTextEditor readOnly value={report.reportText} />
          </div>
        </>
      )}
      <h4>{Settings.fields.task.longLabel}</h4>
      <div className="preview-section">
        <NoPaginationTaskTable
          tasks={report.tasks}
          noTasksMessage={`No ${tasksLabel} selected`}
        />
      </div>
    </div>
  )
}

export default ReportPreview
