import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { initInvisibleFields } from "components/CustomFields"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  GRAPHQL_ASSESSMENTS_FIELDS,
  GRAPHQL_ENTITY_AVATAR_FIELDS,
  GRAPHQL_NOTES_FIELDS
} from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RelatedObjectNotes from "components/RelatedObjectNotes"
import { Attachment, Event, Person, Report, Task } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import ReportForm from "./Form"

const GQL_GET_REPORT = gql`
  query($uuid: String!) {
    report(uuid: $uuid) {
      uuid
      intent
      classification
      engagementDate
      duration
      atmosphere
      atmosphereDetails
      keyOutcomes
      reportText
      nextSteps
      cancelledReason
      state
      location {
        uuid
        name
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
        user
        endOfTourDate
        position {
          uuid
          name
          type
          role
          code
          status
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
          }
        }
        previousPositions {
          startTime
          endTime
          position {
            uuid
            name
            code
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
      approvalStep {
        uuid
        name
        approvers {
          uuid
        }
        nextStepUuid
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
      attachments {
        ${Attachment.basicFieldsQuery}
      }
      event {
        uuid
        name
        startDate
        endDate
      }
      customFields
      ${GRAPHQL_ASSESSMENTS_FIELDS}
      ${GRAPHQL_NOTES_FIELDS}
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
