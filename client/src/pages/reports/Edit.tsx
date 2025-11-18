import {
  gqlAllAttachmentFields,
  gqlAllReportFields,
  gqlApprovalStepFields,
  gqlAssessmentsFields,
  gqlAuthorizedMembersFields,
  gqlEntityFieldsMap,
  gqlNotesFields,
  gqlReportCommunitiesFields,
  gqlReportSensitiveInformationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { initInvisibleFields } from "components/CustomFields"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RelatedObjectNotes from "components/RelatedObjectNotes"
import { Event, Person, Report, Task } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import ReportForm from "./Form"

const GQL_GET_REPORT = gql`
  query($uuid: String!) {
    report(uuid: $uuid) {
      ${gqlAllReportFields}
      location {
        ${gqlEntityFieldsMap.Location}
        lat
        lng
        type
      }
      authors {
        ${gqlEntityFieldsMap.Person}
      }
      reportPeople {
        ${gqlEntityFieldsMap.ReportPerson}
        position {
          ${gqlEntityFieldsMap.Position}
          organization {
            ${gqlEntityFieldsMap.Organization}
          }
          location {
            ${gqlEntityFieldsMap.Location}
          }
        }
        previousPositions {
          startTime
          endTime
          position {
            ${gqlEntityFieldsMap.Position}
            organization {
              ${gqlEntityFieldsMap.Organization}
            }
            location {
              ${gqlEntityFieldsMap.Location}
            }
          }
        }
      }
      tasks {
        ${gqlEntityFieldsMap.Task}
        parentTask {
          ${gqlEntityFieldsMap.Task}
        }
        ascendantTasks {
          ${gqlEntityFieldsMap.Task}
          parentTask {
            ${gqlEntityFieldsMap.Task}
          }
        }
        taskedOrganizations {
          ${gqlEntityFieldsMap.Organization}
        }
      }
      ${gqlReportCommunitiesFields}
      approvalStep {
        ${gqlApprovalStepFields}
      }
      ${gqlReportSensitiveInformationFields}
      attachments {
        ${gqlAllAttachmentFields}
      }
      event {
        ${gqlEntityFieldsMap.Event}
        startDate
        endDate
      }
      ${gqlAuthorizedMembersFields}
      ${gqlAssessmentsFields}
      ${gqlNotesFields}
    }
  }
`

interface ReportEditProps {
  pageDispatchers?: PageDispatchersPropType
}

const ReportEdit = ({ pageDispatchers }: ReportEditProps) => {
  const { uuid } = useParams()
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Report",
    uuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(
    data?.report && `Edit | ${data.report.intent || data.report.uuid}`
  )
  if (done) {
    return result
  }

  if (data) {
    data.report.cancelled = !!data.report.cancelledReason
    data.report[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.report.customFields
    )
    data.report.reportPeople = Report.sortReportPeople(
      Person.fromArray(data.report.reportPeople)
    )
    data.report.event = data.report.event ? new Event(data.report.event) : null
  }
  const report = new Report(data ? data.report : {})
  const reportInitialValues = Object.assign(
    report,
    report.getTasksEngagementAssessments(),
    report.getAttendeesEngagementAssessments()
  )

  // mutates the object
  initInvisibleFields(reportInitialValues, Settings.fields.report.customFields)

  reportInitialValues.tasks = Task.fromArray(reportInitialValues.tasks)
  reportInitialValues.reportPeople = Person.fromArray(
    reportInitialValues.reportPeople
  )

  const reportTitle = report.intent || `#${report.uuid}`
  return (
    <div className="report-edit">
      <ReportForm
        edit
        initialValues={reportInitialValues}
        title={`Report ${reportTitle}`}
        showSensitiveInfo={!!report.reportSensitiveInformation?.text}
        notesComponent={
          <RelatedObjectNotes
            notes={report.notes}
            relatedObject={
              report.uuid && {
                relatedObjectType: Report.relatedObjectType,
                relatedObjectUuid: report.uuid,
                relatedObject: report
              }
            }
          />
        }
      />
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(ReportEdit)
