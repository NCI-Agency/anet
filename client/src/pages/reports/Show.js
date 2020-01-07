import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  SEARCH_OBJECT_TYPES,
  setSearchQuery
} from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import ConfirmDelete from "components/ConfirmDelete"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import {
  AnchorLink,
  jumpToTop,
  mapDispatchToProps as pageMapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
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
import _upperFirst from "lodash/upperFirst"
import { Comment, Person, Position, Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Alert, Button, Col, HelpBlock, Modal } from "react-bootstrap"
import Confirm from "react-confirm-bootstrap"
import { connect } from "react-redux"
import { useHistory, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import { deserializeQueryParams } from "searchUtils"
import utils from "utils"
import AttendeesTable from "./AttendeesTable"
import AuthorizationGroupTable from "./AuthorizationGroupTable"

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
      authorizationGroups {
        uuid
        name
        description
      }
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`
const GQL_DELETE_REPORT = gql`
  mutation($uuid: String!) {
    deleteReport(uuid: $uuid)
  }
`
const GQL_EMAIL_REPORT = gql`
  mutation($uuid: String!, $email: AnetEmailInput!) {
    emailReport(uuid: $uuid, email: $email)
  }
`
const GQL_SUBMIT_REPORT = gql`
  mutation($uuid: String!) {
    submitReport(uuid: $uuid) {
      uuid
    }
  }
`
const GQL_PUBLISH_REPORT = gql`
  mutation($uuid: String!) {
    publishReport(uuid: $uuid) {
      uuid
    }
  }
`
const GQL_ADD_REPORT_COMMENT = gql`
  mutation($uuid: String!, $comment: CommentInput!) {
    addComment(uuid: $uuid, comment: $comment) {
      uuid
    }
  }
`
const GQL_REJECT_REPORT = gql`
  mutation($uuid: String!, $comment: CommentInput!) {
    rejectReport(uuid: $uuid, comment: $comment) {
      uuid
    }
  }
`
const GQL_APPROVE_REPORT = gql`
  mutation($uuid: String!, $comment: CommentInput!) {
    approveReport(uuid: $uuid, comment: $comment) {
      uuid
    }
  }
`

const BaseReportShow = props => {
  const history = useHistory()
  const [saveSuccess, setSaveSuccess] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const { uuid } = useParams()
  const { loading, error, data, refetch } = API.useApiQuery(GQL_GET_REPORT, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Report",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
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
    data.report.reportTags = (data.report.tags || []).map(tag => ({
      id: tag.uuid.toString(),
      text: tag.name
    }))
    data.report.to = ""
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
  const reportTypeUpperFirst = _upperFirst(reportType)
  const { currentUser } = props
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
  // Approved reports for not future engagements may be published by an admin user
  const canPublish = !report.isFuture() && report.isApproved() && isAdmin
  // Warn admins when they try to approve their own report
  const warnApproveOwnReport = canApprove && isAuthor

  // Authors can edit if report is not published
  let canEdit = isAuthor && !report.isPublished()
  // Approvers can edit
  canEdit = canEdit || canApprove

  // Only the author can submit when report is in draft or rejected AND author has a position
  const hasActivePosition = currentUser.hasActivePosition()
  const canSubmit =
    isAuthor && hasActivePosition && (report.isDraft() || report.isRejected())

  const hasAssignedPosition = currentUser.hasAssignedPosition()

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
              <Button onClick={toggleEmailModal}>Email report</Button>
            )}
            {canEdit && (
              <LinkTo report={report} edit button="primary">
                Edit
              </LinkTo>
            )}
            {canSubmit &&
              renderSubmitButton(isSubmitting || !isValid, () =>
                setSubmitting(false)
              )}
          </div>
        )

        return (
          <div className="report-show">
            {renderEmailModal(values, setFieldValue)}

            <RelatedObjectNotes
              notes={report.notes}
              relatedObject={
                uuid && {
                  relatedObjectType: "reports",
                  relatedObjectUuid: uuid
                }
              }
            />
            <Messages success={saveSuccess} error={saveError} />

            {report.isPublished() && (
              <Fieldset style={{ textAlign: "center" }}>
                <h4 className="text-danger">This {reportType} is PUBLISHED.</h4>
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
                {(!hasAssignedPosition || !hasActivePosition) &&
                  renderNoPositionAssignedText()}
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

            {report.isApproved() && (
              <Fieldset style={{ textAlign: "center" }}>
                <h4 className="text-danger">This {reportType} is APPROVED.</h4>
                {!report.isFuture() && (
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
                )}
                {canPublish && (
                  <p>
                    You can also{" "}
                    {renderPublishButton(isSubmitting || !isValid, () =>
                      setSubmitting(false)
                    )}{" "}
                    it immediately.
                  </p>
                )}
              </Fieldset>
            )}

            <Form className="form-horizontal" method="post">
              <Fieldset title={`Report #${uuid}`} action={action} />
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
                    report.location && <LinkTo anetLocation={report.location} />
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
                <ReportFullWorkflow workflow={report.workflow} />
              )}

              {canSubmit && (
                <Fieldset>
                  <Col md={9}>
                    {_isEmpty(validationErrors) && (
                      <p>
                        By pressing submit, this {reportType} will be sent to
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
                    {renderValidationMessages()}
                  </Col>

                  <Col md={3}>
                    {renderSubmitButton(
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
                      submitComment(values.newComment, setFieldValue)}
                  >
                    Save comment
                  </Button>
                </div>
              </Fieldset>

              {canApprove &&
                renderApprovalForm(
                  values,
                  !_isEmpty(validationErrors),
                  warnApproveOwnReport,
                  () => setSubmitting(false)
                )}
              {!canApprove &&
                canRequestChanges &&
                renderRequestChangesForm(
                  values,
                  !_isEmpty(validationErrors),
                  warnApproveOwnReport,
                  () => setSubmitting(false)
                )}
            </Form>

            {currentUser.isAdmin() && (
              <div className="submit-buttons">
                <div>
                  <ConfirmDelete
                    onConfirmDelete={onConfirmDelete}
                    objectType="report"
                    objectDisplay={"#" + uuid}
                    bsStyle="warning"
                    buttonLabel={`Delete ${reportType}`}
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

  function renderNoPositionAssignedText() {
    const { currentUser } = props
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

  function onConfirmDelete() {
    API.mutation(GQL_DELETE_REPORT, { uuid })
      .then(data => {
        history.push("/", {
          success: `${reportTypeUpperFirst} deleted`
        })
      })
      .catch(error => {
        setSaveSuccess(null)
        setSaveError(error)
        jumpToTop()
      })
  }

  function renderApprovalForm(
    values,
    disabled,
    warnApproveOwnReport,
    cancelHandler
  ) {
    return (
      <Fieldset
        className="report-sub-form"
        title={`${reportTypeUpperFirst} approval`}
      >
        <h5>You can approve, request changes to, or edit this {reportType}</h5>
        {renderValidationMessages("approving")}

        <Field
          name="approvalComment"
          label="Approval comment"
          component={FieldHelper.renderInputField}
          componentClass="textarea"
          placeholder="Type a comment here; required when requesting changes"
        />

        {renderRejectButton(
          warnApproveOwnReport,
          "Request changes",
          () => rejectReport(values.approvalComment),
          cancelHandler
        )}
        <div className="right-button">
          <LinkTo report={report} edit button>
            Edit {reportType}
          </LinkTo>
          {renderApproveButton(
            warnApproveOwnReport,
            disabled,
            () => approveReport(values.approvalComment),
            cancelHandler
          )}
        </div>
      </Fieldset>
    )
  }

  function renderRequestChangesForm(
    values,
    disabled,
    warnApproveOwnReport,
    cancelHandler
  ) {
    return (
      <Fieldset className="report-sub-form" title="Request changes">
        <h5>You can request changes to this {reportType}</h5>
        <Field
          name="requestChangesComment"
          label="Request changes comment"
          component={FieldHelper.renderInputField}
          componentClass="textarea"
          placeholder="Type a comment here; required when requesting changes"
        />

        {renderRejectButton(
          warnApproveOwnReport,
          "Request changes",
          () => rejectReport(values.requestChangesComment),
          cancelHandler
        )}
      </Fieldset>
    )
  }

  function renderEmailModal(values, setFieldValue) {
    return (
      <Modal show={showEmailModal} onHide={toggleEmailModal}>
        <Modal.Header closeButton>
          <Modal.Title>Email {reportTypeUpperFirst}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Field
            name="to"
            component={FieldHelper.renderInputField}
            validate={email => handleEmailValidation(email)}
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
            onClick={() => emailReport(values, setFieldValue)}
          >
            Send Email
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }

  function toggleEmailModal() {
    setShowEmailModal(!showEmailModal)
  }

  function handleEmailValidation(value) {
    const r = utils.parseEmailAddresses(value)
    return r.isValid ? null : r.message
  }

  function emailReport(values, setFieldValue) {
    const r = utils.parseEmailAddresses(values.to)
    if (!r.isValid) {
      return
    }
    const emailDelivery = {
      toAddresses: r.to,
      comment: values.comment
    }
    API.mutation(GQL_EMAIL_REPORT, {
      uuid,
      email: emailDelivery
    })
      .then(data => {
        setFieldValue("to", "")
        setFieldValue("comment", "")
        setSaveSuccess("Email successfully sent")
        setSaveError(null)
        setShowEmailModal(false)
      })
      .catch(error => {
        setShowEmailModal(false)
        handleError(error)
      })
  }

  function submitDraft() {
    API.mutation(GQL_SUBMIT_REPORT, { uuid })
      .then(data => {
        updateReport()
        setSaveSuccess(`${reportTypeUpperFirst} submitted`)
        setSaveError(null)
      })
      .catch(error => {
        handleError(error)
      })
  }

  function publishReport() {
    API.mutation(GQL_PUBLISH_REPORT, { uuid })
      .then(data => {
        updateReport()
        setSaveSuccess("Report published")
        setSaveSuccess(`${reportTypeUpperFirst} published`)
        setSaveError(null)
      })
      .catch(error => {
        handleError(error)
      })
  }

  function submitComment(text, setFieldValue) {
    if (_isEmpty(text)) {
      return
    }
    API.mutation(GQL_ADD_REPORT_COMMENT, {
      uuid,
      comment: new Comment({ text })
    })
      .then(data => {
        setFieldValue("newComment", "")
        updateReport()
        setSaveSuccess("Comment saved")
        setSaveError(null)
      })
      .catch(error => {
        handleError(error)
      })
  }

  function rejectReport(rejectionComment) {
    if (_isEmpty(rejectionComment)) {
      handleError({
        message: "Please include a comment when requesting changes."
      })
      return
    }

    const text = "REQUESTED CHANGES: " + rejectionComment
    API.mutation(GQL_REJECT_REPORT, {
      uuid,
      comment: new Comment({ text })
    })
      .then(data => {
        const queryDetails = pendingMyApproval(currentUser)
        const message = "Successfully requested changes."
        deserializeQueryParams(
          SEARCH_OBJECT_TYPES.REPORTS,
          queryDetails.query,
          deserializeCallback.bind(this, message)
        )
      })
      .catch(error => {
        handleError(error)
      })
  }

  function pendingMyApproval(currentUser) {
    return {
      title: "Reports pending my approval",
      query: { pendingApprovalOf: currentUser.uuid }
    }
  }

  function deserializeCallback(message, objectType, filters, text) {
    // We update the Redux state
    props.setSearchQuery({
      objectType: objectType,
      filters: filters,
      text: text
    })
    toast.success(message, { toastId: "success-message" })
    history.push("/search")
  }

  function approveReport(text) {
    API.mutation(GQL_APPROVE_REPORT, {
      uuid,
      comment: new Comment({ text })
    })
      .then(data => {
        const queryDetails = pendingMyApproval(currentUser)
        const lastApproval = report.approvalStep.nextStepId === null
        const message =
          `Successfully approved ${reportType}.` +
          (lastApproval ? " It has been added to the daily rollup" : "")
        deserializeQueryParams(
          SEARCH_OBJECT_TYPES.REPORTS,
          queryDetails.query,
          deserializeCallback.bind(this, message)
        )
      })
      .catch(error => {
        handleError(error)
      })
  }

  function updateReport() {
    refetch()
    jumpToTop()
  }

  function handleError(response) {
    setSaveSuccess(null)
    setSaveError(response)
    jumpToTop()
  }

  function renderRejectButton(
    warnApproveOwnReport,
    label,
    confirmHandler,
    cancelHandler
  ) {
    const validationWarnings = warnApproveOwnReport
      ? [`You are requesting changes to your own ${reportType}`]
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
        body={renderValidationWarnings(validationWarnings, "rejecting")}
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

  function renderSubmitButton(disabled, cancelHandler, size, id) {
    return renderValidationButton(
      false,
      disabled,
      "submitting",
      `Submit ${reportType}?`,
      `Submit ${reportType}`,
      "Submit anyway",
      submitDraft,
      "Cancel submit",
      cancelHandler,
      size,
      id
    )
  }

  function renderApproveButton(
    warnApproveOwnReport,
    disabled,
    confirmHandler,
    cancelHandler,
    size,
    id
  ) {
    return renderValidationButton(
      warnApproveOwnReport,
      disabled,
      "approving",
      `Approve ${reportType}?`,
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

  function renderPublishButton(disabled, cancelHandler, size, id) {
    return renderValidationButton(
      false,
      disabled,
      "publishing",
      `Publish ${reportType}?`,
      "Publish",
      "Publish anyway",
      publishReport,
      "Cancel publish",
      cancelHandler,
      size,
      id,
      "publish-button"
    )
  }

  function renderValidationButton(
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
  ) {
    let validationWarnings = warnApproveOwnReport
      ? [`You are approving your own ${reportType}`]
      : []
    if (!_isEmpty(validationWarnings)) {
      validationWarnings = _concat(validationWarnings, validationWarnings)
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
        body={renderValidationWarnings(validationWarnings, submitType)}
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

  function renderValidationMessages(submitType) {
    submitType = submitType || "submitting"
    return (
      <>
        {renderValidationErrors(submitType)}
        {renderValidationWarnings(validationWarnings, submitType)}
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

  function renderValidationWarnings(validationWarnings, submitType) {
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

BaseReportShow.propTypes = {
  ...pagePropTypes,
  setSearchQuery: PropTypes.func.isRequired,
  currentUser: PropTypes.instanceOf(Person)
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

export default connect(null, mapDispatchToProps)(ReportShow)
