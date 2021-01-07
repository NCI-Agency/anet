import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import { initInvisibleFields } from "components/CustomFields"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
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
        taskedOrganizations {
          uuid
          shortName
        }
        customFields
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
  if (done) {
    return result
  }

  if (data) {
    data.report.cancelled = !!data.report.cancelledReason
    data.report.reportTags = (data.report.tags || []).map(tag => ({
      id: tag.uuid.toString(),
      text: tag.name
    }))
    data.report[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.report.customFields
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
      <ReportForm
        edit
        initialValues={reportInitialValues}
        title={`Report #${report.uuid}`}
        showSensitiveInfo={!!report.reportSensitiveInformation?.text}
      />
    </div>
  )
}

ReportEdit.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(ReportEdit)
