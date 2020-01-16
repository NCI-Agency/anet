import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_MIN_HEAD } from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import {
  AnchorLink,
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
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
import { useParams } from "react-router-dom"
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

const ReportMinimal = props => {
  const { uuid } = useParams()
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Report",
    uuid,
    pageProps: PAGE_PROPS_MIN_HEAD,
    searchProps: DEFAULT_SEARCH_PROPS,
    ...props
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

  return (
    <Formik enableReinitialize initialValues={report}>
      {({ values }) => {
        return (
          <div className="report-show">
            {report.isRejected() && (
              <Fieldset style={{ textAlign: "center" }}>
                <h4 className="text-danger">
                  This {reportType} has CHANGES REQUESTED.
                </h4>
                <p>
                  You can review the comments below, fix the report and
                  re-submit
                </p>
                <div style={{ textAlign: "left" }}>
                  {renderValidationMessages()}
                </div>
              </Fieldset>
            )}

            {report.isDraft() && (
              <Fieldset style={{ textAlign: "center" }}>
                <h4 className="text-danger">
                  This is a DRAFT {reportType} and hasn't been submitted.
                </h4>
                <p>
                  You can review the draft below to make sure all the details
                  are correct.
                </p>
                <div style={{ textAlign: "left" }}>
                  {renderValidationMessages()}
                </div>
              </Fieldset>
            )}

            {report.isPending() && (
              <Fieldset style={{ textAlign: "center" }}>
                <h4 className="text-danger">
                  This {reportType} is PENDING approvals.
                </h4>
                <p>
                  It won't be available in the ANET database until your{" "}
                  <AnchorLink to="workflow">approval organization</AnchorLink>{" "}
                  marks it as approved.
                </p>
                <div style={{ textAlign: "left" }}>
                  {renderValidationMessages("approving")}
                </div>
              </Fieldset>
            )}
            <Form className="form-horizontal" method="post">
              <Fieldset title={`Report #${report.uuid}`} />
              <Fieldset className="show-report-overview">
                <Field
                  name="intent"
                  label="Summary"
                  component={FieldHelper.SpecialField}
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
                  component={FieldHelper.ReadonlyField}
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
                    component={FieldHelper.ReadonlyField}
                  />
                )}

                <Field
                  name="location"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    report.location && <LinkTo anetLocation={report.location} />
                  }
                />

                {report.cancelled && (
                  <Field
                    name="cancelledReason"
                    label="Cancelled Reason"
                    component={FieldHelper.ReadonlyField}
                    humanValue={utils.sentenceCase(report.cancelledReason)}
                  />
                )}

                {!report.cancelled && (
                  <Field
                    name="atmosphere"
                    label={Settings.fields.report.atmosphere}
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      <>
                        {utils.sentenceCase(report.atmosphere)}
                        {report.atmosphereDetails &&
                          ` – ${report.atmosphereDetails}`}
                      </>
                    }
                  />
                )}

                {Settings.fields.report.reportTags && (
                  <Field
                    name="reportTags"
                    label={Settings.fields.report.reportTags}
                    component={FieldHelper.ReadonlyField}
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
                  component={FieldHelper.ReadonlyField}
                  humanValue={<LinkTo person={report.author} />}
                />

                <Field
                  name="advisorOrg"
                  label={Settings.fields.advisor.org.name}
                  component={FieldHelper.ReadonlyField}
                  humanValue={<LinkTo organization={report.advisorOrg} />}
                />

                <Field
                  name="principalOrg"
                  label={Settings.fields.principal.org.name}
                  component={FieldHelper.ReadonlyField}
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
                <ReportCompactWorkflow workflow={report.workflow} />
              )}

              <Fieldset className="report-sub-form" title="Comments">
                {report.comments.map(comment => {
                  const createdAt = moment(comment.createdAt)
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

ReportMinimal.propTypes = {
  ...pagePropTypes
}

export default connect(null, mapDispatchToProps)(ReportMinimal)
