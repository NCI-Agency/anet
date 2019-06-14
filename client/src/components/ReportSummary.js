import { Settings } from "api"
import LinkTo from "components/LinkTo"
import { ReportCompactWorkflow } from "components/ReportWorkflow"
import Tag from "components/Tag"
import _isEmpty from "lodash/isEmpty"
import { Report } from "models"
import moment from "moment"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Col, Grid, Label, Row } from "react-bootstrap"
import utils from "utils"

export default class ReportSummary extends Component {
  static propTypes = {
    report: PropTypes.object.isRequired
  }

  render() {
    let report = new Report(this.props.report)

    return (
      <Grid fluid className="report-summary">
        {report.state === Report.STATE.DRAFT && (
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
              )}
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

        {report.isPending() && (
          <p className="report-pending">
            <strong>Pending Approval</strong>
          </p>
        )}

        {report.isFuture() && (
          <p className="report-future">
            <strong>Upcoming Engagement</strong>
          </p>
        )}

        {report.isPending() && (
          <Row>
            <Col md={12}>
              <ReportCompactWorkflow workflow={report.workflow} />
            </Col>
          </Row>
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
                <strong>{Settings.fields.report.intent}:</strong>{" "}
                {report.intent}
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
}
