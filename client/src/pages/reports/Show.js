import { SEARCH_OBJECT_TYPES, setSearchQuery } from "actions"
import API, { Settings } from "api"
import AppContext from "components/AppContext"
import ConfirmDelete from "components/ConfirmDelete"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages, { setMessages } from "components/Messages"
import Page, {
  AnchorLink,
  jumpToTop,
  mapDispatchToProps as pageMapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { ReportFullWorkflow } from "components/ReportWorkflow"
import Tag from "components/Tag"
import TaskTable from "components/TaskTable"
import { Field, Form, Formik } from "formik"
import _concat from "lodash/concat"
import _isEmpty from "lodash/isEmpty"
import { Comment, Person, Position, Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { Alert, Button, Col, HelpBlock, Modal } from "react-bootstrap"
import Confirm from "react-confirm-bootstrap"
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"
import { toast } from "react-toastify"
import { deserializeQueryParams } from "searchUtils"
import utils from "utils"
import AttendeesTable from "./AttendeesTable"
import AuthorizationGroupTable from "./AuthorizationGroupTable"

class BaseReportShow extends Page {
  static propTypes = {
    ...pagePropTypes,
    setSearchQuery: PropTypes.func.isRequired,
    currentUser: PropTypes.instanceOf(Person)
  }

  static modelName = "Report"

  state = {
    report: new Report(),
    validationErrors: null,
    validationWarnings: null,
    success: null,
    error: null,
    showEmailModal: false
  }

  constructor(props) {
    super(props)
    setMessages(props, this.state)
  }

  fetchData(props) {
    return API.query(
      /* GraphQL */ `
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
          authorizationGroups {
            uuid
            name
            description
          }
          ${GRAPHQL_NOTES_FIELDS}
        }
      `,
      { uuid: props.match.params.uuid },
      "($uuid: String!)"
    ).then(data => {
      data.report.cancelled = !!data.report.cancelledReason
      data.report.to = ""
      const report = new Report(data.report)
      this.setState({ report })
      Report.yupSchema
        .validate(report, { abortEarly: false })
        .catch(e => this.setState({ validationErrors: e.errors }))
      Report.yupWarningSchema
        .validate(report, { abortEarly: false })
        .catch(e => this.setState({ validationWarnings: e.errors }))
    })
  }

  renderNoPositionAssignedText() {
    const { currentUser } = this.props
    const alertStyle = { top: 132, marginBottom: "1rem", textAlign: "center" }
    const supportEmail = Settings.SUPPORT_EMAIL_ADDR
    const supportEmailMessage = supportEmail ? `at ${supportEmail}` : ""
    const advisorPositionSingular = Settings.fields.advisor.position.name
    if (!currentUser.hasAssignedPosition()) {
      return (
        <div className="alert alert-warning" style={alertStyle}>
          You cannot submit a report: you are not assigned to a{" "}
          {advisorPositionSingular} position.
          <br />
          Please contact your organization's super user(s) and request to be
          assigned to a {advisorPositionSingular} position.
          <br />
          If you are unsure, you can also contact the support team{" "}
          {supportEmailMessage}.
        </div>
      )
    } else {
      return (
        <div className="alert alert-warning" style={alertStyle}>
          You cannot submit a report: your assigned {advisorPositionSingular}{" "}
          position has an inactive status.
          <br />
          Please contact your organization's super users and request them to
          assign you to an active {advisorPositionSingular} position.
          <br />
          If you are unsure, you can also contact the support team{" "}
          {supportEmailMessage}.
        </div>
      )
    }
  }

  render() {
    const { report } = this.state
    const { currentUser } = this.props
    const isAdmin = currentUser && currentUser.isAdmin()
    const isAuthor = Person.isEqual(currentUser, report.author)

    // When either admin or not the author, user can approve if report is pending approval and user is one of the approvers in the current approval step
    const canApprove =
      (isAdmin || !isAuthor) &&
      report.isPending() &&
      currentUser.position &&
      report.approvalStep &&
      report.approvalStep.approvers.find(member =>
        Position.isEqual(member, currentUser.position)
      )
    const canRequestChanges = canApprove || (report.isApproved() && isAdmin)
    const canPublish = report.isApproved() && isAdmin
    // Warn admins when they try to approve their own report
    const warnApproveOwnReport = canApprove && isAuthor

    // Authors can edit in draft mode (also future engagements) or rejected mode
    let canEdit =
      isAuthor && (report.isDraft() || report.isFuture() || report.isRejected())
    // Approvers can edit.
    canEdit = canEdit || canApprove

    // Only the author can submit when report is in draft or rejected AND author has a position
    const hasAssignedPosition = currentUser.hasAssignedPosition()
    const hasActivePosition = currentUser.hasActivePosition()
    const canSubmit =
      isAuthor && hasActivePosition && (report.isDraft() || report.isRejected())

    // Anybody can email a report as long as it's not in draft.
    const canEmail = !report.isDraft()
    const hasAuthorizationGroups =
      report.authorizationGroups && report.authorizationGroups.length > 0
    return (
      <Formik
        enableReinitialize
        validationSchema={Report.yupSchema}
        isInitialValid={() => Report.yupSchema.isValidSync(report)}
        initialValues={report}
      >
        {({ isSubmitting, setSubmitting, isValid, setFieldValue, values }) => {
          const action = (
            <div>
              {canEmail && (
                <Button onClick={this.toggleEmailModal}>Email report</Button>
              )}
              {canEdit && (
                <LinkTo report={report} edit button="primary">
                  Edit
                </LinkTo>
              )}
              {canSubmit &&
                this.renderSubmitButton(isSubmitting || !isValid, () =>
                  setSubmitting(false)
                )}
            </div>
          )
          return (
            <div className="report-show">
              {this.renderEmailModal(values, setFieldValue)}

              <RelatedObjectNotes
                notes={report.notes}
                relatedObject={
                  report.uuid && {
                    relatedObjectType: "reports",
                    relatedObjectUuid: report.uuid
                  }
                }
              />
              <Messages success={this.state.success} error={this.state.error} />

              {report.isPublished() && (
                <Fieldset style={{ textAlign: "center" }}>
                  <h4 className="text-danger">This report is PUBLISHED.</h4>
                  <p>
                    This report has been approved and published to the ANET
                    community on{" "}
                    {moment(report.releasedAt).format(
                      Settings.dateFormats.forms.displayShort.withTime
                    )}
                  </p>
                </Fieldset>
              )}

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
                  {(!hasAssignedPosition || !hasActivePosition) &&
                    this.renderNoPositionAssignedText()}
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

              {report.isApproved() && (
                <Fieldset style={{ textAlign: "center" }}>
                  <h4 className="text-danger">This report is APPROVED.</h4>
                  <p>
                    This report has been approved and will be automatically
                    published to the ANET community in{" "}
                    {moment(report.getReportApprovedAt())
                      .add(
                        Settings.reportWorkflow.nbOfHoursQuarantineApproved,
                        "hours"
                      )
                      .toNow(true)}
                  </p>
                  {canPublish && (
                    <p>
                      You can also{" "}
                      {this.renderPublishButton(isSubmitting || !isValid, () =>
                        setSubmitting(false)
                      )}{" "}
                      it immediately.
                    </p>
                  )}
                </Fieldset>
              )}

              {report.isFuture() && (
                <Fieldset style={{ textAlign: "center" }}>
                  <h4 className="text-success">
                    This report is for an UPCOMING engagement.
                  </h4>
                  <p>
                    After your engagement has taken place, edit and submit this
                    document as an engagement report.
                  </p>
                  <div style={{ textAlign: "left" }}>
                    {this.renderValidationMessages()}
                  </div>
                </Fieldset>
              )}

              <Form className="form-horizontal" method="post">
                <Fieldset title={`Report #${report.uuid}`} action={action} />
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
                    {(hasAuthorizationGroups && (
                      <div>
                        <h5>Authorized groups:</h5>
                        <AuthorizationGroupTable
                          authorizationGroups={values.authorizationGroups}
                        />
                      </div>
                    )) || <h5>No groups are authorized!</h5>}
                  </Fieldset>
                )}

                {report.showWorkflow() && (
                  <ReportFullWorkflow report={report} />
                )}

                {canSubmit && (
                  <Fieldset>
                    <Col md={9}>
                      {_isEmpty(this.state.validationErrors) && (
                        <p>
                          By pressing submit, this report will be sent to
                          <strong>
                            {" "}
                            {Object.get(
                              report,
                              "author.position.organization.name"
                            ) || "your organization approver"}{" "}
                          </strong>
                          to go through the approval workflow.
                        </p>
                      )}
                      {this.renderValidationMessages()}
                    </Col>

                    <Col md={3}>
                      {this.renderSubmitButton(
                        isSubmitting || !isValid,
                        () => setSubmitting(false),
                        "large",
                        "submitReportButton"
                      )}
                    </Col>
                  </Fieldset>
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

                  <Field
                    name="newComment"
                    label="Add a comment"
                    component={FieldHelper.renderInputField}
                    componentClass="textarea"
                    placeholder="Type a comment here"
                    className="add-new-comment"
                  />
                  <div className="right-button">
                    <Button
                      bsStyle="primary"
                      type="button"
                      onClick={() =>
                        this.submitComment(values.newComment, setFieldValue)
                      }
                    >
                      Save comment
                    </Button>
                  </div>
                </Fieldset>

                {canApprove &&
                  this.renderApprovalForm(
                    values,
                    !_isEmpty(this.state.validationErrors),
                    warnApproveOwnReport,
                    () => setSubmitting(false)
                  )}
                {!canApprove &&
                  canRequestChanges &&
                  this.renderRequestChangesForm(
                    values,
                    !_isEmpty(this.state.validationErrors),
                    warnApproveOwnReport,
                    () => setSubmitting(false)
                  )}
              </Form>

              {currentUser.isAdmin() && (
                <div className="submit-buttons">
                  <div>
                    <ConfirmDelete
                      onConfirmDelete={this.onConfirmDelete}
                      objectType="report"
                      objectDisplay={"#" + report.uuid}
                      bsStyle="warning"
                      buttonLabel="Delete report"
                      className="pull-right"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        }}
      </Formik>
    )
  }

  onConfirmDelete = () => {
    const operation = "deleteReport"
    let graphql = /* GraphQL */ `
      ${operation}(uuid: $uuid)
    `
    const variables = { uuid: this.state.report.uuid }
    const variableDef = "($uuid: String!)"
    API.mutation(graphql, variables, variableDef)
      .then(data => {
        this.props.history.push({
          pathname: "/",
          state: { success: "Report deleted" }
        })
      })
      .catch(error => {
        this.setState({ success: null, error: error })
        jumpToTop()
      })
  }

  renderApprovalForm = (
    values,
    disabled,
    warnApproveOwnReport,
    cancelHandler
  ) => {
    return (
      <Fieldset className="report-sub-form" title="Report approval">
        <h5>You can approve, request changes to, or edit this report</h5>
        {this.renderValidationMessages("approving")}

        <Field
          name="approvalComment"
          label="Approval comment"
          component={FieldHelper.renderInputField}
          componentClass="textarea"
          placeholder="Type a comment here; required when requesting changes"
        />

        {this.renderRejectButton(
          warnApproveOwnReport,
          "Request changes",
          () => this.rejectReport(values.approvalComment),
          cancelHandler
        )}
        <div className="right-button">
          <LinkTo report={this.state.report} edit button>
            Edit report
          </LinkTo>
          {this.renderApproveButton(
            warnApproveOwnReport,
            disabled,
            () => this.approveReport(values.approvalComment),
            cancelHandler
          )}
        </div>
      </Fieldset>
    )
  }

  renderRequestChangesForm = (
    values,
    disabled,
    warnApproveOwnReport,
    cancelHandler
  ) => {
    return (
      <Fieldset className="report-sub-form" title="Request changes">
        <h5>You can request changes to this report</h5>
        <Field
          name="requestChangesComment"
          label="Request changes comment"
          component={FieldHelper.renderInputField}
          componentClass="textarea"
          placeholder="Type a comment here; required when requesting changes"
        />

        {this.renderRejectButton(
          warnApproveOwnReport,
          "Request changes",
          () => this.rejectReport(values.requestChangesComment),
          cancelHandler
        )}
      </Fieldset>
    )
  }

  renderEmailModal = (values, setFieldValue) => {
    return (
      <Modal show={this.state.showEmailModal} onHide={this.toggleEmailModal}>
        <Modal.Header closeButton>
          <Modal.Title>Email Report</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Field
            name="to"
            component={FieldHelper.renderInputField}
            validate={email => this.handleEmailValidation(email)}
            vertical
          >
            <HelpBlock>
              One or more email addresses, comma separated, e.g.:
              <br />
              <em>
                jane@nowhere.invalid, John Doe &lt;john@example.org&gt;, "Mr. X"
                &lt;x@example.org&gt;
              </em>
            </HelpBlock>
          </Field>

          <Field
            name="comment"
            component={FieldHelper.renderInputField}
            componentClass="textarea"
            vertical
          />
        </Modal.Body>

        <Modal.Footer>
          <Button
            bsStyle="primary"
            onClick={() => this.emailReport(values, setFieldValue)}
          >
            Send Email
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }

  toggleEmailModal = () => {
    this.setState({ showEmailModal: !this.state.showEmailModal })
  }

  handleEmailValidation = value => {
    const r = utils.parseEmailAddresses(value)
    return r.isValid ? null : r.message
  }

  emailReport = (values, setFieldValue) => {
    const r = utils.parseEmailAddresses(values.to)
    if (!r.isValid) {
      return
    }
    const emailDelivery = {
      toAddresses: r.to,
      comment: values.comment
    }

    let graphql = /* GraphQL */ `
      emailReport(uuid: $uuid, email: $email)
    `
    const variables = {
      uuid: this.state.report.uuid,
      email: emailDelivery
    }
    const variableDef = "($uuid: String!, $email: AnetEmailInput!)"
    API.mutation(graphql, variables, variableDef)
      .then(data => {
        setFieldValue("to", "")
        setFieldValue("comment", "")
        this.setState({
          success: "Email successfully sent",
          error: null,
          showEmailModal: false
        })
      })
      .catch(error => {
        this.setState({
          showEmailModal: false
        })
        this.handleError(error)
      })
  }

  submitDraft = () => {
    let graphql = /* GraphQL */ `
      submitReport(uuid: $uuid) {
        uuid
      }
    `
    const variables = {
      uuid: this.state.report.uuid
    }
    const variableDef = "($uuid: String!)"
    API.mutation(graphql, variables, variableDef)
      .then(data => {
        this.updateReport()
        this.setState({ success: "Report submitted", error: null })
      })
      .catch(error => {
        this.handleError(error)
      })
  }

  publishReport = () => {
    const graphql = /* GraphQL */ `
      publishReport(uuid: $uuid) {
        uuid
      }
    `
    const variables = {
      uuid: this.state.report.uuid
    }
    const variableDef = "($uuid: String!)"
    API.mutation(graphql, variables, variableDef)
      .then(data => {
        this.updateReport()
        this.setState({ success: "Report published", error: null })
      })
      .catch(error => {
        this.handleError(error)
      })
  }

  submitComment = (text, setFieldValue) => {
    if (_isEmpty(text)) {
      return
    }
    let graphql = /* GraphQL */ `
      addComment(uuid: $uuid, comment: $comment) {
        uuid
      }
    `
    const variables = {
      uuid: this.state.report.uuid,
      comment: new Comment({ text })
    }
    const variableDef = "($uuid: String!, $comment: CommentInput!)"
    API.mutation(graphql, variables, variableDef)
      .then(data => {
        setFieldValue("newComment", "")
        this.updateReport()
        this.setState({ success: "Comment saved", error: null })
      })
      .catch(error => {
        this.handleError(error)
      })
  }

  rejectReport = rejectionComment => {
    if (_isEmpty(rejectionComment)) {
      this.handleError({
        message: "Please include a comment when requesting changes."
      })
      return
    }

    const text = "REQUESTED CHANGES: " + rejectionComment
    let graphql = /* GraphQL */ `
      rejectReport(uuid: $uuid, comment: $comment) {
        uuid
      }
    `
    const variables = {
      uuid: this.state.report.uuid,
      comment: new Comment({ text })
    }
    const variableDef = "($uuid: String!, $comment: CommentInput!)"
    API.mutation(graphql, variables, variableDef)
      .then(data => {
        const queryDetails = this.pendingMyApproval(this.props.currentUser)
        const message = "Successfully requested changes."
        deserializeQueryParams(
          SEARCH_OBJECT_TYPES.REPORTS,
          queryDetails.query,
          this.deserializeCallback.bind(this, message)
        )
      })
      .catch(error => {
        this.handleError(error)
      })
  }

  pendingMyApproval = currentUser => {
    return {
      title: "Reports pending my approval",
      query: { pendingApprovalOf: currentUser.uuid }
    }
  }

  deserializeCallback = (message, objectType, filters, text) => {
    // We update the Redux state
    this.props.setSearchQuery({
      objectType: objectType,
      filters: filters,
      text: text
    })
    toast.success(message, { toastId: "success-message" })
    this.props.history.push({
      pathname: "/search"
    })
  }

  approveReport = text => {
    let graphql = /* GraphQL */ `
      approveReport(uuid: $uuid, comment: $comment) {
        uuid
      }
    `
    const variables = {
      uuid: this.state.report.uuid,
      comment: new Comment({ text })
    }
    const variableDef = "($uuid: String!, $comment: CommentInput!)"
    API.mutation(graphql, variables, variableDef)
      .then(data => {
        const queryDetails = this.pendingMyApproval(this.props.currentUser)
        const lastApproval = this.state.report.approvalStep.nextStepId === null
        const message =
          "Successfully approved report." +
          (lastApproval ? " It has been added to the daily rollup" : "")
        deserializeQueryParams(
          SEARCH_OBJECT_TYPES.REPORTS,
          queryDetails.query,
          this.deserializeCallback.bind(this, message)
        )
      })
      .catch(error => {
        this.handleError(error)
      })
  }

  updateReport = () => {
    this.fetchData(this.props)
    jumpToTop()
  }

  handleError = response => {
    this.setState({ success: null, error: response })
    jumpToTop()
  }

  renderRejectButton = (
    warnApproveOwnReport,
    label,
    confirmHandler,
    cancelHandler
  ) => {
    const validationWarnings = warnApproveOwnReport
      ? ["You are requesting changes to your own report"]
      : []
    return _isEmpty(validationWarnings) ? (
      <Button bsStyle="warning" onClick={confirmHandler}>
        {label}
      </Button>
    ) : (
      <Confirm
        onConfirm={confirmHandler}
        onClose={cancelHandler}
        title="Request changes?"
        body={this.renderValidationWarnings(validationWarnings, "rejecting")}
        confirmText="Request changes anyway"
        cancelText="Cancel change request"
        dialogClassName="react-confirm-bootstrap-modal"
        confirmBSStyle="primary"
      >
        <Button bsStyle="warning" onClick={confirmHandler}>
          {label}
        </Button>
      </Confirm>
    )
  }

  renderSubmitButton = (disabled, cancelHandler, size, id) => {
    return this.renderValidationButton(
      false,
      disabled,
      "submitting",
      "Submit report?",
      "Submit report",
      "Submit anyway",
      this.submitDraft,
      "Cancel submit",
      cancelHandler,
      size,
      id
    )
  }

  renderApproveButton = (
    warnApproveOwnReport,
    disabled,
    confirmHandler,
    cancelHandler,
    size,
    id
  ) => {
    return this.renderValidationButton(
      warnApproveOwnReport,
      disabled,
      "approving",
      "Approve report?",
      "Approve",
      "Approve anyway",
      confirmHandler,
      "Cancel approve",
      cancelHandler,
      size,
      id,
      "approve-button"
    )
  }

  renderPublishButton = (disabled, cancelHandler, size, id) => {
    return this.renderValidationButton(
      false,
      disabled,
      "publishing",
      "Publish report?",
      "Publish",
      "Publish anyway",
      this.publishReport,
      "Cancel publish",
      cancelHandler,
      size,
      id,
      "publish-button"
    )
  }

  renderValidationButton = (
    warnApproveOwnReport,
    disabled,
    submitType,
    title,
    label,
    confirmText,
    confirmHandler,
    cancelText,
    cancelHandler,
    size,
    id,
    className
  ) => {
    let validationWarnings = warnApproveOwnReport
      ? ["You are approving your own report"]
      : []
    if (!_isEmpty(this.state.validationWarnings)) {
      validationWarnings = _concat(
        validationWarnings,
        this.state.validationWarnings
      )
    }
    return _isEmpty(validationWarnings) ? (
      <Button
        type="button"
        bsStyle="primary"
        bsSize={size}
        className={className}
        onClick={confirmHandler}
        disabled={disabled}
        id={id}
      >
        {label}
      </Button>
    ) : (
      <Confirm
        onConfirm={confirmHandler}
        onClose={cancelHandler}
        title={title}
        body={this.renderValidationWarnings(validationWarnings, submitType)}
        confirmText={confirmText}
        cancelText={cancelText}
        dialogClassName="react-confirm-bootstrap-modal"
        confirmBSStyle="primary"
      >
        <Button
          type="button"
          bsStyle="primary"
          bsSize={size}
          className={className}
          disabled={disabled}
          id={id}
        >
          {label}
        </Button>
      </Confirm>
    )
  }

  renderValidationMessages = submitType => {
    submitType = submitType || "submitting"
    return (
      <React.Fragment>
        {this.renderValidationErrors(submitType)}
        {this.renderValidationWarnings(
          this.state.validationWarnings,
          submitType
        )}
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

  renderValidationWarnings = (validationWarnings, submitType) => {
    if (_isEmpty(validationWarnings)) {
      return null
    }
    return (
      <Alert bsStyle="warning">
        The following warnings should be addressed before {submitType} this
        report:
        <ul>
          {validationWarnings.map((warning, idx) => (
            <li key={idx}>{warning}</li>
          ))}
        </ul>
      </Alert>
    )
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchToProps = pageMapDispatchToProps(dispatch, ownProps)
  return {
    setSearchQuery: searchQuery => dispatch(setSearchQuery(searchQuery)),
    ...pageDispatchToProps
  }
}

const ReportShow = props => (
  <AppContext.Consumer>
    {context => <BaseReportShow currentUser={context.currentUser} {...props} />}
  </AppContext.Consumer>
)

export default connect(
  null,
  mapDispatchToProps
)(withRouter(ReportShow))
