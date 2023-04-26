import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import LinkTo from "components/LinkTo"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import { ReportCompactWorkflow } from "components/ReportWorkflow"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import { Location, Report } from "models"
import moment from "moment"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"
import { Badge, Col, Container, Row } from "react-bootstrap"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"
import utils from "utils"

const GQL_GET_REPORT_LIST = gql`
  query ($reportQuery: ReportSearchQueryInput) {
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
        primaryAdvisor {
          uuid
          name
          rank
          avatarUuid
        }
        primaryInterlocutor {
          uuid
          name
          rank
          avatarUuid
        }
        advisorOrg {
          uuid
          shortName
          longName
          identificationCode
        }
        interlocutorOrg {
          uuid
          shortName
          longName
          identificationCode
        }
        location {
          uuid
          name
          lat
          lng
          type
        }
        tasks {
          uuid
          shortName
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
                avatarUuid
              }
            }
          }
          person {
            uuid
            name
            rank
            avatarUuid
          }
        }
        updatedAt
        attachments {
          uuid
        }
      }
    }
  }
`

const DEFAULT_PAGESIZE = 10

const ReportSummary = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination
}) => {
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
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.reportList?.totalCount
  useEffect(
    () => setTotalCount && setTotalCount(totalCount),
    [setTotalCount, totalCount]
  )
  if (done) {
    return result
  }

  const reports = data ? data.reportList.list : []
  if (_get(reports, "length", 0) === 0) {
    return <em>No reports found</em>
  }

  const { pageSize } = data.reportList

  return (
    <div>
      <UltimatePaginationTopDown
        className="float-end"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={setPage}
      >
        {reports.map(report => (
          <ReportSummaryRow report={report} key={report.uuid} />
        ))}
      </UltimatePaginationTopDown>
    </div>
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }
}

ReportSummary.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  paginationKey: PropTypes.string.isRequired,
  setPagination: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired
}

const ReportSummaryRow = ({ report }) => {
  report = new Report(report)
  const className = `report-${report.getStateForClassName()}`

  return (
    <Container fluid className="report-summary">
      {report.isDraft() && (
        <p>
          <span className={className} />
          <strong>Draft</strong>
          <span>
            : last saved at{" "}
            {moment(report.updatedAt).format(
              Settings.dateFormats.forms.displayShort.withTime
            )}
          </span>
        </p>
      )}

      {report.isRejected() && (
        <p>
          <span className={className} />
          <strong>Changes requested</strong>
        </p>
      )}

      {report.cancelledReason && (
        <p>
          <span className={className} />
          <strong>Cancelled: </strong>
          {utils.sentenceCase(
            report.cancelledReason.substr(report.cancelledReason.indexOf("_"))
          )}
        </p>
      )}

      {report.isFuture() && (
        <p>
          <span className={className} />
          <strong>Planned Engagement</strong>
        </p>
      )}

      {report.isPending() && (
        <>
          <p>
            <span className={className} />
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
            <Badge bg="secondary" className="engagement-date">
              {moment(report.engagementDate).format(
                Report.getEngagementDateFormat()
              )}
            </Badge>
          )}
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <LinkTo modelType="Person" model={report.primaryAdvisor} />
          <span>
            {" "}
            (<LinkTo modelType="Organization" model={report.advisorOrg} />)
          </span>
          {report.primaryInterlocutor && (
            <>
              <span className="people-separator">&#x25B6;</span>
              <LinkTo modelType="Person" model={report.primaryInterlocutor} />
              <span>
                {" "}
                (
                <LinkTo
                  modelType="Organization"
                  model={report.interlocutorOrg}
                />
                )
              </span>
            </>
          )}
        </Col>
      </Row>
      {!_isEmpty(report.location) && (
        <Row>
          <Col md={12}>
            <span>
              <strong>{Settings.fields.report.location?.label}: </strong>
              <LinkTo modelType="Location" model={report.location} />
              {"  "}
              <Badge bg="secondary">
                {Location.humanNameOfType(report.location.type)}
              </Badge>
            </span>
          </Col>
        </Row>
      )}
      <Row>
        <Col md={12}>
          {report.intent && (
            <span>
              <strong>{Settings.fields.report.intent?.label}:</strong>{" "}
              {report.intent}
            </span>
          )}
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          {report.keyOutcomes && (
            <span>
              <strong>{Settings.fields.report.keyOutcomes?.label}:</strong>{" "}
              {report.keyOutcomes}
            </span>
          )}
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          {report.nextSteps && (
            <span>
              <strong>{Settings.fields.report.nextSteps?.label}:</strong>{" "}
              {report.nextSteps}
            </span>
          )}
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          {report.atmosphere && (
            <span>
              <strong>{Settings.fields.report.atmosphere?.label}:</strong>{" "}
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
              <strong>
                {pluralize(Settings.fields.task.subLevel.shortLabel)}:
              </strong>{" "}
              {report.tasks.map((task, i) => (
                <React.Fragment key={task.uuid}>
                  {i > 0 && (
                    <img src={TASKS_ICON} alt="★" className="ms-1 me-1" />
                  )}
                  <BreadcrumbTrail
                    modelType="Task"
                    leaf={task}
                    ascendantObjects={task.ascendantTasks}
                    parentField="parentTask"
                  />
                </React.Fragment>
              ))}
            </span>
          )}
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          {report.attachments.length > 0 && (
            <span>
              <Icon icon={IconNames.PAPERCLIP} />
              {`${report.attachments.length} attachment(s)`}
            </span>
          )}
        </Col>
      </Row>
      <Row className="d-print-none">
        <Col className="read-report-actions" md={12}>
          <LinkTo
            modelType="Report"
            model={report}
            button
            className="read-report-button"
          >
            Read Report
          </LinkTo>
        </Col>
      </Row>
    </Container>
  )
}

ReportSummaryRow.propTypes = {
  report: PropTypes.object.isRequired
}

export default ReportSummary
