import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import {
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { Report } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
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
      author {
        uuid
        name
        rank
        role
        avatar(size: 32)
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
      tasks {
        uuid
        shortName
        longName
        responsibleOrg {
          uuid
          shortName
        }
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

const ReportEdit = props => {
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
    ...props
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
  }
  const report = new Report(data ? data.report : {})

  return (
    <div className="report-edit">
      <RelatedObjectNotes
        notes={report.notes}
        relatedObject={
          report.uuid && {
            relatedObjectType: "reports",
            relatedObjectUuid: report.uuid
          }
        }
      />
      <ReportForm
        edit
        initialValues={report}
        title={`Report #${report.uuid}`}
        showSensitiveInfo={
          !!report.reportSensitiveInformation &&
          !!report.reportSensitiveInformation.text
        }
      />
    </div>
  )
}

ReportEdit.propTypes = {
  ...pagePropTypes
}

export default connect(
  null,
  mapDispatchToProps
)(ReportEdit)
