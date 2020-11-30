import { setSearchQuery } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import Fieldset from "components/Fieldset"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import { Form, Formik } from "formik"
import { Person, Report, Task } from "models"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import utils from "utils"

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
        position {
          uuid
          organization {
            uuid
            shortName
            longName
          }
        }
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
      primaryAdvisor {
        uuid
      }
      primaryPrincipal {
        uuid
      }
      tasks {
        uuid
        shortName
        longName
        customFieldRef1 {
          uuid
          shortName
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

const ReportPreview = ({ pageDispatchers, className, uuid, previewId }) => {
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Report",
    uuid,
    pageDispatchers
  })
  if (done) {
    return result
  }

  let report
  if (!data) {
    report = new Report()
  } else {
    data.report.cancelled = !!data.report.cancelledReason
    data.report.reportTags = (data.report.tags || []).map(tag => ({
      id: tag.uuid.toString(),
      text: tag.name
    }))
    data.report.tasks = Task.fromArray(data.report.tasks)
    data.report.reportPeople = Person.fromArray(data.report.reportPeople)
    data.report.to = ""
    data.report[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.report.customFields
    )
    report = new Report(data.report)
  }
  const reportType = report.isFuture() ? "planned engagement" : "report"

  // Get initial tasks/people instant assessments values
  const hasAssessments = report.engagementDate && !report.isFuture()
  if (hasAssessments) {
    report = Object.assign(report, report.getTasksEngagementAssessments())
    report = Object.assign(report, report.getAttendeesEngagementAssessments())
  }

  return (
    <Formik
      enableReinitialize
      validationSchema={Report.yupSchema}
      validateOnMount
      initialValues={report}
    >
      {({ values }) => {
        return (
          <div className={`report-preview ${className || ""}`}>
            {report.isPublished() && (
              <Fieldset style={{ textAlign: "center" }}>
                <h4 className="text-danger">This {reportType} is PUBLISHED.</h4>
              </Fieldset>
            )}

            {report.isRejected() && (
              <Fieldset style={{ textAlign: "center" }}>
                <h4 className="text-danger">
                  This {reportType} has CHANGES REQUESTED.
                </h4>
              </Fieldset>
            )}

            {report.isDraft() && (
              <Fieldset style={{ textAlign: "center" }}>
                <h4 className="text-danger">
                  This is a DRAFT {reportType} and hasn't been submitted.
                </h4>
              </Fieldset>
            )}

            {report.isPending() && (
              <Fieldset style={{ textAlign: "center" }}>
                <h4 className="text-danger">
                  This {reportType} is PENDING approvals.
                </h4>
              </Fieldset>
            )}

            {report.isApproved() && (
              <Fieldset style={{ textAlign: "center" }}>
                <h4 className="text-danger">This {reportType} is APPROVED.</h4>
              </Fieldset>
            )}

            <Form className="form-horizontal" method="post"></Form>
          </div>
        )
      }}
    </Formik>
  )
}

ReportPreview.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  className: PropTypes.string,
  previewId: PropTypes.string,
  uuid: PropTypes.string
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    setSearchQuery: searchQuery => dispatch(setSearchQuery(searchQuery)),
    ...pageDispatchers
  }
}

export default connect(null, mapDispatchToProps)(ReportPreview)
