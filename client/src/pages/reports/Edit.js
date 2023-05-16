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
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { Person, Report, Task } from "models"
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
        endOfTourDate
        avatar(size: 32)
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
            identificationCode
          }
          location {
            uuid
            name
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
        ascendantTasks(query: { pageNum: 0, pageSize: 0 }) {
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
      customFields
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const ReportEdit = ({ pageDispatchers }) => {
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

  return (
    <div className="report-edit">
      <ReportForm
        edit
        initialValues={reportInitialValues}
        title={`Report #${report.uuid}`}
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

ReportEdit.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(ReportEdit)
