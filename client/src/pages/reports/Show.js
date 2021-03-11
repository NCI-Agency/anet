import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  SEARCH_OBJECT_TYPES,
  setSearchQuery
} from "actions"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import InstantAssessmentsContainerField from "components/assessments/InstantAssessmentsContainerField"
import ConfirmDelete from "components/ConfirmDelete"
import { ReadonlyCustomFields } from "components/CustomFields"
import { parseHtmlWithLinkTo } from "components/editor/LinkAnet"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import NoPaginationTaskTable from "components/NoPaginationTaskTable"
import {
  AnchorLink,
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import PlanningConflictForReport from "components/PlanningConflictForReport"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { ReportFullWorkflow } from "components/ReportWorkflow"
import { deserializeQueryParams } from "components/SearchFilters"
import { Field, Form, Formik } from "formik"
import _concat from "lodash/concat"
import _isEmpty from "lodash/isEmpty"
import _upperFirst from "lodash/upperFirst"
import { Comment, Person, Position, Report, Task } from "models"
import moment from "moment"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import { Alert, Button, Col, HelpBlock, Modal } from "react-bootstrap"
import Confirm from "react-confirm-bootstrap"
import { connect } from "react-redux"
import { useHistory, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import Settings from "settings"
import utils from "utils"
import AuthorizationGroupTable from "./AuthorizationGroupTable"
import ReportPeople from "./ReportPeople"

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
      reportPeople {
        uuid
        name
        author
        primary
        attendee
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
            identificationCode
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

const ReportShow = ({ setSearchQuery, pageDispatchers }) => {
  const { currentUser } = useContext(AppContext)
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
    data.report.tasks = Task.fromArray(data.report.tasks)
    data.report.reportPeople = Person.fromArray(data.report.reportPeople)
    data.report.to = ""
    data.report[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.report.customFields
    )
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
  const isAdmin = currentUser && currentUser.isAdmin()
  const isAuthor = report.authors?.find(a => Person.isEqual(currentUser, a))
  const isAttending = report.reportPeople?.find(rp =>
    Person.isEqual(currentUser, rp)
  )
  const tasksLabel = pluralize(Settings.fields.task.subLevel.shortLabel)

  // User can approve if report is pending approval and user is one of the approvers in the current approval step
  const canApprove =
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

  // Attending authors can edit if report is not published
  // Non-attending authors can only edit if it is future
  let canEdit =
    isAuthor && !report.isPublished() && (report.isFuture() || isAttending)
  // Approvers can edit
  canEdit = canEdit || canApprove

  // Only an author can submit when report is in draft or rejected AND author has a position
  const hasActivePosition = currentUser.hasActivePosition()
  const canSubmit =
    isAuthor && hasActivePosition && (report.isDraft() || report.isRejected())

  const hasAssignedPosition = currentUser.hasAssignedPosition()

  // Anybody can email a report as long as it's not in draft.
  const canEmail = !report.isDraft()
  const hasAuthorizationGroups =
    report.authorizationGroups && report.authorizationGroups.length > 0

  // Get initial tasks/people instant assessments values
  const hasAssessments = report.engagementDate && !report.isFuture()
  let relatedObject
  if (hasAssessments) {
    report = Object.assign(report, report.getTasksEngagementAssessments())
    report = Object.assign(report, report.getAttendeesEngagementAssessments())
    relatedObject = Report.getCleanReport(report)
  }

  return (
    <Formik
      enableReinitialize
      validationSchema={Report.yupSchema}
      validateOnMount
      initialValues={report}
    >
      {({ isValid, setFieldValue, values }) => {
        const action = (
          <div>
            {canEmail && (
              <Button onClick={toggleEmailModal}>Email report</Button>
            )}
            <Button
              value="compactView"
              type="button"
              bsStyle="primary"
              onClick={onCompactClick}
            >
              Summary / Print
            </Button>
            {canEdit && (
              <LinkTo modelType="Report" model={report} edit button="primary">
                Edit
              </LinkTo>
            )}
            {canSubmit && renderSubmitButton(!isValid)}
          </div>
        )

        return (
          <div className="report-show">
            {renderEmailModal(values, setFieldValue)}

            <RelatedObjectNotes
              notes={report.notes}
              relatedObject={
                uuid && {
                  relatedObjectType: Report.relatedObjectType,
                  relatedObjectUuid: uuid,
                  relatedObject: report
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
                    You can also {renderPublishButton(!isValid)} it immediately.
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
                              {Settings.fields.report.keyOutcomes ||
                                "Key outcomes"}
                              :
                            </strong>{" "}
                            {report.keyOutcomes}&nbsp;
                          </span>
                        </p>
                      )}
                      <p>
                        <strong>
                          {Settings.fields.report.nextSteps.label}:
                        </strong>{" "}
                        {report.nextSteps}
                      </p>
                    </div>
                  }
                />

                <Field
                  name="engagementDate"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    <>
                      {report.engagementDate &&
                        moment(report.engagementDate).format(
                          Report.getEngagementDateFormat()
                        )}
                      <PlanningConflictForReport report={report} largeIcon />
                    </>
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
                    report.location && (
                      <LinkTo modelType="Location" model={report.location} />
                    )
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

                <Field
                  name="authors"
                  component={FieldHelper.ReadonlyField}
                  humanValue={report.authors?.map(a => (
                    <React.Fragment key={a.uuid}>
                      <LinkTo modelType="Person" model={a} />
                      <br />
                    </React.Fragment>
                  ))}
                />

                <Field
                  name="advisorOrg"
                  label={Settings.fields.advisor.org.name}
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    <LinkTo
                      modelType="Organization"
                      model={report.advisorOrg}
                    />
                  }
                />

                <Field
                  name="principalOrg"
                  label={Settings.fields.principal.org.name}
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    <LinkTo
                      modelType="Organization"
                      model={report.principalOrg}
                    />
                  }
                />
              </Fieldset>
              <Fieldset
                title={
                  report.isFuture()
                    ? "People who will be involved in this planned engagement"
                    : "People involved in this engagement"
                }
              >
                <ReportPeople report={report} disabled />
              </Fieldset>
              <Fieldset title={Settings.fields.task.subLevel.longLabel}>
                <NoPaginationTaskTable
                  tasks={report.tasks}
                  showParent
                  noTasksMessage={`No ${tasksLabel} selected`}
                />
              </Fieldset>
              {report.reportText && (
                <Fieldset title={Settings.fields.report.reportText}>
                  {parseHtmlWithLinkTo(report.reportText)}
                </Fieldset>
              )}
              {report.reportSensitiveInformation?.text && (
                <Fieldset title="Sensitive information">
                  {parseHtmlWithLinkTo(report.reportSensitiveInformation.text)}
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
              {Settings.fields.report.customFields && (
                <Fieldset title="Engagement information" id="custom-fields">
                  <ReadonlyCustomFields
                    fieldsConfig={Settings.fields.report.customFields}
                    values={values}
                  />
                </Fieldset>
              )}
              {hasAssessments && (
                <>
                  <Fieldset
                    title="Attendees engagement assessments"
                    id="attendees-engagement-assessments"
                  >
                    <InstantAssessmentsContainerField
                      entityType={Person}
                      entities={values.reportPeople?.filter(rp => rp.attendee)}
                      relatedObject={relatedObject}
                      parentFieldName={
                        Report.ATTENDEES_ASSESSMENTS_PARENT_FIELD
                      }
                      formikProps={{
                        values
                      }}
                      readonly
                    />
                  </Fieldset>

                  <Fieldset
                    title={`${Settings.fields.task.subLevel.longLabel} engagement assessments`}
                    id="tasks-engagement-assessments"
                  >
                    <InstantAssessmentsContainerField
                      entityType={Task}
                      entities={values.tasks}
                      relatedObject={relatedObject}
                      parentFieldName={Report.TASKS_ASSESSMENTS_PARENT_FIELD}
                      formikProps={{
                        values
                      }}
                      readonly
                    />
                  </Fieldset>
                </>
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
                          {Object.get(report, "advisorOrg.shortName") ||
                            "your organization approver"}{" "}
                        </strong>
                        to go through the approval workflow.
                      </p>
                    )}
                    {renderValidationMessages()}
                  </Col>

                  <Col md={3}>
                    {renderSubmitButton(
                      !isValid,
                      "large",
                      "submitReportButton"
                    )}
                  </Col>
                </Fieldset>
              )}
              <Fieldset className="report-sub-form" title="Comments">
                {report.comments.map(comment => {
                  const createdAt = moment(comment.createdAt)
                  return (
                    <p key={comment.uuid}>
                      <LinkTo modelType="Person" model={comment.author} />,
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
                  component={FieldHelper.InputField}
                  componentClass="textarea"
                  placeholder="Type a comment here"
                  className="add-new-comment"
                />
                <div className="right-button">
                  <Button
                    bsStyle="primary"
                    type="button"
                    onClick={() =>
                      submitComment(values.newComment, setFieldValue)
                    }
                  >
                    Save comment
                  </Button>
                </div>
              </Fieldset>
              {canApprove &&
                renderApprovalForm(
                  values,
                  !_isEmpty(validationErrors),
                  warnApproveOwnReport
                )}
              {!canApprove &&
                canRequestChanges &&
                renderRequestChangesForm(
                  values,
                  !_isEmpty(validationErrors),
                  warnApproveOwnReport
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

  function renderApprovalForm(values, disabled, warnApproveOwnReport) {
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
          component={FieldHelper.InputField}
          componentClass="textarea"
          placeholder="Type a comment here; required when requesting changes"
        />

        {renderRejectButton(warnApproveOwnReport, "Request changes", () =>
          rejectReport(values.approvalComment)
        )}
        <div className="right-button">
          <LinkTo modelType="Report" model={report} edit button>
            Edit {reportType}
          </LinkTo>
          {renderApproveButton(warnApproveOwnReport, disabled, () =>
            approveReport(values.approvalComment)
          )}
        </div>
      </Fieldset>
    )
  }

  function renderRequestChangesForm(values, disabled, warnApproveOwnReport) {
    return (
      <Fieldset className="report-sub-form" title="Request changes">
        <h5>You can request changes to this {reportType}</h5>
        <Field
          name="requestChangesComment"
          label="Request changes comment"
          component={FieldHelper.InputField}
          componentClass="textarea"
          placeholder="Type a comment here; required when requesting changes"
        />

        {renderRejectButton(warnApproveOwnReport, "Request changes", () =>
          rejectReport(values.requestChangesComment)
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
            component={FieldHelper.InputField}
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
            component={FieldHelper.InputField}
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

  function onCompactClick() {
    if (!_isEmpty(report)) {
      history.push(`${report.uuid}/compact`)
    }
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
    setSearchQuery({
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

  function renderRejectButton(warnApproveOwnReport, label, confirmHandler) {
    const warnings = _concat(
      validationWarnings || [],
      warnApproveOwnReport
        ? [`You are requesting changes to your own ${reportType}`]
        : []
    )
    return _isEmpty(warnings) ? (
      <Button bsStyle="warning" onClick={confirmHandler}>
        {label}
      </Button>
    ) : (
      <Confirm
        onConfirm={confirmHandler}
        title="Request changes?"
        body={renderValidationWarnings(warnings, "rejecting")}
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

  function renderSubmitButton(disabled, size, id) {
    return renderValidationButton(
      false,
      disabled,
      "submitting",
      `Submit ${reportType}?`,
      `Submit ${reportType}`,
      "Submit anyway",
      submitDraft,
      "Cancel submit",
      size,
      id
    )
  }

  function renderApproveButton(
    warnApproveOwnReport,
    disabled,
    confirmHandler,
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
      size,
      id,
      "approve-button"
    )
  }

  function renderPublishButton(disabled, size, id) {
    return renderValidationButton(
      false,
      disabled,
      "publishing",
      `Publish ${reportType}?`,
      "Publish",
      "Publish anyway",
      publishReport,
      "Cancel publish",
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
    size,
    id,
    className
  ) {
    const warnings = _concat(
      validationWarnings || [],
      warnApproveOwnReport ? [`You are approving your own ${reportType}`] : []
    )
    return _isEmpty(warnings) ? (
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
        title={title}
        body={renderValidationWarnings(warnings, submitType)}
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
        The following warnings should be addressed before {submitType} this{" "}
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

ReportShow.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  setSearchQuery: PropTypes.func.isRequired
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    setSearchQuery: searchQuery => dispatch(setSearchQuery(searchQuery)),
    ...pageDispatchers
  }
}

export default connect(null, mapDispatchToProps)(ReportShow)
