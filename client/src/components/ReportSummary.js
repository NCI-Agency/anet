import API, { Settings } from "api"
import { gql } from "apollo-boost"
import LinkTo from "components/LinkTo"
import { mapDispatchToProps, useBoilerplate } from "components/Page"
import { ReportCompactWorkflow } from "components/ReportWorkflow"
import Tag from "components/Tag"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import { Report } from "models"
import moment from "moment"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"
import { Col, Grid, Label, Row } from "react-bootstrap"
import { connect } from "react-redux"
import utils from "utils"

const GQL_GET_REPORT_LIST = gql`
  query($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        intent
        engagementDate
        duration
        keyOutcomes
        nextSteps
        cancelledReason
        atmosphere
        atmosphereDetails
        state
        author {
          uuid
          name
          rank
          role
        }
        primaryAdvisor {
          uuid
          name
          rank
          role
        }
        primaryPrincipal {
          uuid
          name
          rank
          role
        }
        advisorOrg {
          uuid
          shortName
        }
        principalOrg {
          uuid
          shortName
        }
        location {
          uuid
          name
          lat
          lng
        }
        tasks {
          uuid
          shortName
        }
        tags {
          uuid
          name
          description
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
              }
            }
          }
          person {
            uuid
            name
            rank
            role
          }
        }
        updatedAt
      }
    }
  }
`

const DEFAULT_PAGESIZE = 10

const ReportSummary = props => {
  const {
    queryParams,
    setTotalCount,
    paginationKey,
    pagination,
    setPagination
  } = props
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    queryParamsUnchanged && pagination[paginationKey]
      ? pagination[paginationKey].pageNum
      : 0
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination(paginationKey, 0)
      setPageNum(0)
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const reportQuery = Object.assign({}, queryParams, {
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  })
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_LIST, {
    reportQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
  })
  if (done) {
    return result
  }

  const reports = data ? data.reportList.list : []
  if (setTotalCount) {
    const totalCount = data && data.reportList && data.reportList.totalCount
    setTotalCount(totalCount)
  }
  if (_get(reports, "length", 0) === 0) {
    return <em>No reports found</em>
  }

  const { pageSize, totalCount } = data.reportList

  return (
    <div>
      <UltimatePaginationTopDown
        className="pull-right"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={setPage}
        contentElement={reports.map(report => (
          <ReportSummaryRow report={report} key={report.uuid} />
        ))}
      />
    </div>
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }
}

ReportSummary.propTypes = {
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  paginationKey: PropTypes.string.isRequired,
  setPagination: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired
}

const ReportSummaryRow = props => {
  const report = new Report(props.report)

  return (
    <Grid fluid className="report-summary">
      {report.isDraft() && (
        <p className="report-draft">
          <strong>Draft</strong>
          {/* If the parent does not fetch report.updatedAt, we will not display this
            so we do not get a broken view.
          */
            report.updatedAt && (
              <span>
              : last saved at{" "}
                {moment(report.updatedAt).format(
                  Settings.dateFormats.forms.displayShort.withTime
                )}
              </span>
            )
          }
        </p>
      )}

      {report.isRejected() && (
        <p className="report-rejected">
          <strong>Changes requested</strong>
        </p>
      )}

      {report.cancelledReason && (
        <p className="report-cancelled">
          <strong>Cancelled: </strong>
          {utils.sentenceCase(
            report.cancelledReason.substr(report.cancelledReason.indexOf("_"))
          )}
        </p>
      )}

      {report.isFuture() && (
        <p className="report-future">
          <strong>Planned Engagement</strong>
        </p>
      )}

      {report.isPending() && (
        <>
          <p className="report-pending">
            <strong>Pending Approval</strong>
          </p>
          <Row>
            <Col md={12}>
              <ReportCompactWorkflow workflow={report.workflow} />
            </Col>
          </Row>
        </>
      )}
      <Row>
        <Col md={12}>
          {report.engagementDate && (
            <Label bsStyle="default" className="engagement-date">
              {moment(report.engagementDate).format(
                Report.getEngagementDateFormat()
              )}
            </Label>
          )}
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <LinkTo person={report.primaryAdvisor} />
          <span>
            {" "}
            (<LinkTo organization={report.advisorOrg} />)
          </span>
          <span className="people-separator">&#x25B6;</span>
          <LinkTo person={report.primaryPrincipal} />
          <span>
            {" "}
            (<LinkTo organization={report.principalOrg} />)
          </span>
        </Col>
      </Row>
      {!_isEmpty(report.location) && (
        <Row>
          <Col md={12}>
            <span>
              <strong>Location: </strong>
              <LinkTo anetLocation={report.location} />
            </span>
          </Col>
        </Row>
      )}
      <Row>
        <Col md={12}>
          {report.intent && (
            <span>
              <strong>{Settings.fields.report.intent}:</strong> {report.intent}
            </span>
          )}
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          {report.keyOutcomes && (
            <span>
              <strong>{Settings.fields.report.keyOutcomes}:</strong>{" "}
              {report.keyOutcomes}
            </span>
          )}
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          {report.nextSteps && (
            <span>
              <strong>{Settings.fields.report.nextSteps}:</strong>{" "}
              {report.nextSteps}
            </span>
          )}
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          {report.atmosphere && (
            <span>
              <strong>{Settings.fields.report.atmosphere}:</strong>{" "}
              {utils.sentenceCase(report.atmosphere)}
              {report.atmosphereDetails && ` – ${report.atmosphereDetails}`}
            </span>
          )}
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          {report.tasks.length > 0 && (
            <span>
              <strong>{pluralize(Settings.fields.task.shortLabel)}:</strong>{" "}
              {report.tasks.map((task, i) => {
                return (
                  task.shortName + (i < report.tasks.length - 1 ? ", " : "")
                )
              })}
            </span>
          )}
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          {report.tags && (
            <Row>
              <Col md={12}>
                {report.tags.map((tag, i) => (
                  <Tag key={tag.uuid} tag={tag} />
                ))}
              </Col>
            </Row>
          )}
        </Col>
      </Row>
      <Row className="hide-for-print">
        <Col className="read-report-actions" md={12}>
          <LinkTo report={report} button className="read-report-button">
            Read report
          </LinkTo>
        </Col>
      </Row>
    </Grid>
  )
}

ReportSummaryRow.propTypes = {
  report: PropTypes.object.isRequired
}

const mapStateToProps = (state, ownProps) => ({
  pagination: state.pagination
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReportSummary)
