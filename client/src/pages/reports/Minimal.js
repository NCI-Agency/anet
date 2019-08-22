import { PAGE_PROPS_MIN_HEAD } from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Page, {
  AnchorLink,
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import { ReportCompactWorkflow } from "components/ReportWorkflow"
import Tag from "components/Tag"
import TaskTable from "components/TaskTable"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Report } from "models"
import moment from "moment"
import React from "react"
import { Alert } from "react-bootstrap"
import { connect } from "react-redux"
import utils from "utils"
import AttendeesTable from "./AttendeesTable"

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
        responsibleOrg {
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

class ReportMinimal extends Page {
  static propTypes = {
    ...pagePropTypes
  }

  static modelName = "Report"

  state = {
    report: new Report(),
    validationErrors: null,
    validationWarnings: null
  }

  constructor(props) {
    super(props, PAGE_PROPS_MIN_HEAD)
  }

  fetchData(props) {
    return API.query(GQL_GET_REPORT, { uuid: props.match.params.uuid }).then(
      data => {
        data.report.cancelled = !!data.report.cancelledReason
        const report = new Report(data.report)
        this.setState({ report })
        Report.yupSchema
          .validate(report, { abortEarly: false })
          .catch(e => this.setState({ validationErrors: e.errors }))
        Report.yupWarningSchema
          .validate(report, { abortEarly: false })
          .catch(e => this.setState({ validationWarnings: e.errors }))
      }
    )
  }

  render() {
    const { report } = this.state

    return (
      <Formik enableReinitialize initialValues={report}>
        {({ values }) => {
          return (
            <div className="report-show">
              <Messages success={this.state.success} error={this.state.error} />

              {report.isRejected() && (
                <Fieldset style={{ textAlign: "center" }}>
                  <h4 className="text-danger">
                    This report has CHANGES REQUESTED.
                  </h4>
                  <p>
                    You can review the comments below, fix the report and
                    re-submit
                  </p>
                  <div style={{ textAlign: "left" }}>
                    {this.renderValidationMessages()}
                  </div>
                </Fieldset>
              )}

              {report.isDraft() && (
                <Fieldset style={{ textAlign: "center" }}>
                  <h4 className="text-danger">
                    This is a DRAFT report and hasn't been submitted.
                  </h4>
                  <p>
                    You can review the draft below to make sure all the details
                    are correct.
                  </p>
                  <div style={{ textAlign: "left" }}>
                    {this.renderValidationMessages()}
                  </div>
                </Fieldset>
              )}

              {report.isPending() && (
                <Fieldset style={{ textAlign: "center" }}>
                  <h4 className="text-danger">
                    This report is PENDING approvals.
                  </h4>
                  <p>
                    It won't be available in the ANET database until your{" "}
                    <AnchorLink to="workflow">approval organization</AnchorLink>{" "}
                    marks it as approved.
                  </p>
                  <div style={{ textAlign: "left" }}>
                    {this.renderValidationMessages("approving")}
                  </div>
                </Fieldset>
              )}
              <Form className="form-horizontal" method="post">
                <Fieldset title={`Report #${report.uuid}`} />
                <Fieldset className="show-report-overview">
                  <Field
                    name="intent"
                    label="Summary"
                    component={FieldHelper.renderSpecialField}
                    widget={
                      <div id="intent" className="form-control-static">
                        <p>
                          <strong>{Settings.fields.report.intent}:</strong>{" "}
                          {report.intent}
                        </p>
                        {report.keyOutcomes && (
                          <p>
                            <span>
                              <strong>
                                {Settings.fields.report.keyOutcomes}:
                              </strong>{" "}
                              {report.keyOutcomes}&nbsp;
                            </span>
                          </p>
                        )}
                        <p>
                          <strong>{Settings.fields.report.nextSteps}:</strong>{" "}
                          {report.nextSteps}
                        </p>
                      </div>
                    }
                  />

                  <Field
                    name="engagementDate"
                    component={FieldHelper.renderReadonlyField}
                    humanValue={
                      report.engagementDate &&
                      moment(report.engagementDate).format(
                        Report.getEngagementDateFormat()
                      )
                    }
                  />

                  {Settings.engagementsIncludeTimeAndDuration && (
                    <Field
                      name="duration"
                      label="Duration (minutes)"
                      component={FieldHelper.renderReadonlyField}
                    />
                  )}

                  <Field
                    name="location"
                    component={FieldHelper.renderReadonlyField}
                    humanValue={
                      report.location && (
                        <LinkTo anetLocation={report.location} />
                      )
                    }
                  />

                  {report.cancelled && (
                    <Field
                      name="cancelledReason"
                      label="Cancelled Reason"
                      component={FieldHelper.renderReadonlyField}
                      humanValue={utils.sentenceCase(report.cancelledReason)}
                    />
                  )}

                  {!report.cancelled && (
                    <Field
                      name="atmosphere"
                      label={Settings.fields.report.atmosphere}
                      component={FieldHelper.renderReadonlyField}
                      humanValue={
                        <React.Fragment>
                          {utils.sentenceCase(report.atmosphere)}
                          {report.atmosphereDetails &&
                            ` – ${report.atmosphereDetails}`}
                        </React.Fragment>
                      }
                    />
                  )}

                  {Settings.fields.report.reportTags && (
                    <Field
                      name="reportTags"
                      label={Settings.fields.report.reportTags}
                      component={FieldHelper.renderReadonlyField}
                      humanValue={
                        report.tags &&
                        report.tags.map((tag, i) => (
                          <Tag key={tag.uuid} tag={tag} />
                        ))
                      }
                    />
                  )}

                  <Field
                    name="author"
                    component={FieldHelper.renderReadonlyField}
                    humanValue={<LinkTo person={report.author} />}
                  />

                  <Field
                    name="advisorOrg"
                    label={Settings.fields.advisor.org.name}
                    component={FieldHelper.renderReadonlyField}
                    humanValue={<LinkTo organization={report.advisorOrg} />}
                  />

                  <Field
                    name="principalOrg"
                    label={Settings.fields.principal.org.name}
                    component={FieldHelper.renderReadonlyField}
                    humanValue={<LinkTo organization={report.principalOrg} />}
                  />
                </Fieldset>

                <Fieldset title="Meeting attendees">
                  <AttendeesTable attendees={report.attendees} disabled />
                </Fieldset>

                <Fieldset title={Settings.fields.task.longLabel}>
                  <TaskTable tasks={report.tasks} showOrganization />
                </Fieldset>

                {report.reportText && (
                  <Fieldset title={Settings.fields.report.reportText}>
                    <div
                      dangerouslySetInnerHTML={{ __html: report.reportText }}
                    />
                  </Fieldset>
                )}

                {report.reportSensitiveInformation &&
                  report.reportSensitiveInformation.text && (
                  <Fieldset title="Sensitive information">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: report.reportSensitiveInformation.text
                      }}
                    />
                  </Fieldset>
                )}

                {report.showWorkflow() && (
                  <ReportCompactWorkflow report={report} />
                )}

                <Fieldset className="report-sub-form" title="Comments">
                  {report.comments.map(comment => {
                    let createdAt = moment(comment.createdAt)
                    return (
                      <p key={comment.uuid}>
                        <LinkTo person={comment.author} />,
                        <span
                          title={createdAt.format(
                            Settings.dateFormats.forms.displayShort.withTime
                          )}
                        >
                          {" "}
                          {createdAt.fromNow()}:{" "}
                        </span>
                        "{comment.text}"
                      </p>
                    )
                  })}

                  {!report.comments.length && <p>There are no comments yet.</p>}
                </Fieldset>
              </Form>
            </div>
          )
        }}
      </Formik>
    )
  }

  renderValidationMessages = submitType => {
    submitType = submitType || "submitting"
    return (
      <React.Fragment>
        {this.renderValidationErrors(submitType)}
        {this.renderValidationWarnings(submitType)}
      </React.Fragment>
    )
  }

  renderValidationErrors = submitType => {
    if (_isEmpty(this.state.validationErrors)) {
      return null
    }
    const warning = this.state.report.isFuture()
      ? "You'll need to fill out these required fields before you can submit your final report:"
      : `The following errors must be fixed before ${submitType} this report:`
    const style = this.state.report.isFuture() ? "info" : "danger"
    return (
      <Alert bsStyle={style}>
        {warning}
        <ul>
          {this.state.validationErrors.map((error, idx) => (
            <li key={idx}>{error}</li>
          ))}
        </ul>
      </Alert>
    )
  }

  renderValidationWarnings = submitType => {
    if (_isEmpty(this.state.validationWarnings)) {
      return null
    }
    return (
      <Alert bsStyle="warning">
        The following warnings should be addressed before {submitType} this
        report:
        <ul>
          {this.state.validationWarnings.map((warning, idx) => (
            <li key={idx}>{warning}</li>
          ))}
        </ul>
      </Alert>
    )
  }
}

export default connect(
  null,
  mapDispatchToProps
)(ReportMinimal)
