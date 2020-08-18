import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_MIN_HEAD } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import _isEmpty from "lodash/isEmpty"
// import Location from "models/Location"
// import Person from "models/Person"
import Report from "models/Report"
import moment from "moment"
import React, { useContext } from "react"
import { Alert } from "react-bootstrap"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import anetLogo from "resources/logo.png"
import Settings from "settings"
import "./Print.css"

const ReportPrint = ({ pageDispatchers }) => {
  const { uuid } = useParams()
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT, {
    uuid
  })
  const { currentUser } = useContext(AppContext)
  console.dir(currentUser)
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Report",
    uuid,
    pageProps: PAGE_PROPS_MIN_HEAD,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }

  let report, validationErrors, validationWarnings
  if (!data) {
    report = new Report()
  } else {
    data.report.cancelled = !!data.report.cancelledReason
    report = new Report(data.report)
    try {
      Report.yupSchema.validateSync(report, { abortEarly: false })
    } catch (e) {
      validationErrors = e.errors
    }
    try {
      Report.yupWarningSchema.validateSync(report, { abortEarly: false })
    } catch (e) {
      validationWarnings = e.errors
    }
  }

  const reportType = report.isFuture() ? "planned engagement" : "report"
  const tasksLabel = Settings.fields.task.subLevel.longLabel.toLowerCase()
  if (report) {
    printReport()
  }
  return (
    <div className="ReportPrint">
      <div className="print-page-header-content">
        <img src={anetLogo} alt="logo" width="92" height="21" />
        <span>Classification Banner</span>
        <span>{report.uuid}</span>
      </div>
      <table className="print-page-table">
        <thead>
          <tr>
            <td className="print-page-header-space" colSpan="2" />
          </tr>
        </thead>
        <tbody>
          <tr>
            <th className="print-table-title" colSpan="2">
              Engagement of <LinkTo modelType="Person" model={report.author} />{" "}
              on{" "}
              {moment(report.engagementDate).format(
                Report.getEngagementDateFormat()
              )}
              at{" "}
              {report.location && (
                <LinkTo modelType="Location" model={report.location} />
              )}
            </th>
          </tr>
          <tr>
            <th className="print-table-subtitle" colSpan="2">
              Authored by <LinkTo modelType="Person" model={report.author} /> on{" "}
              {moment(report.releasedAt).format(
                Settings.dateFormats.forms.displayShort.withTime
              )}
              , printed by <LinkTo modelType="Person" model={currentUser} />
            </th>
          </tr>

          <tr>
            <th>purpose</th>
            <td>some purpose</td>
          </tr>
          <tr>
            <th>status</th>
            <td>{Report.STATE_LABELS[report.state]}</td>
          </tr>
          {report.engagementDate && (
            <tr>
              <th>key details</th>
              <td>some key details</td>
            </tr>
          )}
          {Settings.engagementsIncludeTimeAndDuration && report.duration && (
            <tr>
              <th>Duration(min)</th>
              <td>{report.duration}</td>
            </tr>
          )}
          <tr>
            <th>{tasksLabel}</th>
            <td>
              {report.tasks.map(task => (
                <span key={task.uuid}>{task.shortName}</span>
              ))}
            </td>
          </tr>
          <tr>
            <td colSpan="2">{renderValidationMessages()}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td className="print-page-footer-space" colSpan="2" />
          </tr>
        </tfoot>
      </table>
      <div className="print-page-footer-content">
        <img src={anetLogo} alt="logo" width="92" height="21" />
        <span>Classification Banner</span>
        <span>{report.uuid}</span>
      </div>
    </div>
  )

  function printReport() {
    // wait for render to print
    setTimeout(() => {
      window.print()
    })
  }

  function renderValidationMessages(submitType) {
    submitType = submitType || "submitting"
    return (
      <>
        {renderValidationErrors(submitType)}
        {renderValidationWarnings(submitType)}
      </>
    )
  }

  function renderValidationErrors(submitType) {
    if (_isEmpty(validationErrors)) {
      return null
    }
    const warning = report.isFuture()
      ? `You'll need to fill out these required fields before you can submit your final ${reportType}:`
      : `The following errors must be fixed before ${submitType} this ${reportType}:`
    const style = report.isFuture() ? "info" : "danger"
    return (
      <Alert bsStyle={style}>
        {warning}
        <ul>
          {validationErrors.map((error, idx) => (
            <li key={idx}>{error}</li>
          ))}
        </ul>
      </Alert>
    )
  }

  function renderValidationWarnings(submitType) {
    if (_isEmpty(validationWarnings)) {
      return null
    }
    return (
      <Alert bsStyle="warning">
        The following warnings should be addressed before {submitType} this
        {reportType}:
        <ul>
          {validationWarnings.map((warning, idx) => (
            <li key={idx}>{warning}</li>
          ))}
        </ul>
      </Alert>
    )
  }
}
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
      }
      author {
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
            identificationCode
            approvalSteps {
              uuid
              name
              approvers {
                uuid
                name
                person {
                  uuid
                  name
                  rank
                  role
                  avatar(size: 32)
                }
              }
            }
          }
        }
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
      }
      comments {
        uuid
        text
        createdAt
        updatedAt
        author {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
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
      workflow {
        type
        createdAt
        step {
          uuid
          name
          approvers {
            uuid
            name
            person {
              uuid
              name
              rank
              role
              avatar(size: 32)
            }
          }
        }
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
      approvalStep {
        uuid
        name
        approvers {
          uuid
        }
        nextStepUuid
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
    }
  }
`
// Explanation why we need header-space and header-content (same for footer) to create printable report
// https://medium.com/@Idan_Co/the-ultimate-print-html-template-with-header-footer-568f415f6d2a
// tldr: we need both
// 1- headers and footers to be position fixed at top and bottom of page which "header/footer-content" div provides
// 2- we need normal content not to overlap with headers and footers which "header/footer-space" provides

ReportPrint.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(ReportPrint)
