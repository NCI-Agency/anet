import { gql } from "@apollo/client"
import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  SEARCH_OBJECT_TYPES,
  setSearchQuery
} from "actions"
import API from "api"
import AppContext from "components/AppContext"
import InstantAssessmentsContainerField from "components/assessments/instant/InstantAssessmentsContainerField"
import AttachmentsDetailView from "components/Attachment/AttachmentsDetailView"
import ConfirmDestructive from "components/ConfirmDestructive"
import { ReadonlyCustomFields } from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import FindObjectsButton from "components/FindObjectsButton"
import LinkTo from "components/LinkTo"
import ListItems from "components/ListItems"
import Messages from "components/Messages"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  GRAPHQL_ASSESSMENTS_FIELDS,
  GRAPHQL_ENTITY_AVATAR_FIELDS,
  GRAPHQL_NOTES_FIELDS
} from "components/Model"
import NoPaginationTaskTable from "components/NoPaginationTaskTable"
import {
  AnchorLink,
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import PlanningConflictForReport from "components/PlanningConflictForReport"
import RelatedObjectNotes from "components/RelatedObjectNotes"
import { ReportFullWorkflow } from "components/ReportWorkflow"
import RichTextEditor from "components/RichTextEditor"
import { deserializeQueryParams } from "components/SearchFilters"
import TriggerableConfirm from "components/TriggerableConfirm"
import { Field, Form, Formik } from "formik"
import _concat from "lodash/concat"
import _isEmpty from "lodash/isEmpty"
import _upperFirst from "lodash/upperFirst"
import { Attachment, Comment, Person, Position, Report, Task } from "models"
import moment from "moment"
import pluralize from "pluralize"
import React, { useContext, useEffect, useState } from "react"
import { Alert, Button, Col, FormText, Modal } from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
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
      classification
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
      isSubscribed
      updatedAt
      location {
        uuid
        name
        lat
        lng
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
      authors {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        position {
          uuid
          organization {
            uuid
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
                  ${GRAPHQL_ENTITY_AVATAR_FIELDS}
                }
              }
            }
          }
        }
      }
      reportPeople {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        status
        author
        primary
        attendee
        interlocutor
        user
        endOfTourDate
        position {
          uuid
          name
          type
          role
          code
          status
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          organization {
            uuid
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          location {
            uuid
            name
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
        }
        previousPositions {
          startTime
          endTime
          position {
            uuid
            name
            code
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            organization {
              uuid
              shortName
              longName
              identificationCode
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
            location {
              uuid
              name
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
          }
        }
      }
      primaryAdvisor {
        uuid
      }
      primaryInterlocutor {
        uuid
      }
      tasks {
        uuid
        shortName
        longName
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
        taskedOrganizations {
          uuid
          shortName
          longName
          identificationCode
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
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
      interlocutorOrg {
        uuid
        shortName
        longName
        identificationCode
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
      advisorOrg {
        uuid
        shortName
        longName
        identificationCode
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
          }
        }
        person {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
      attachments {
        ${Attachment.basicFieldsQuery}
      }
      event {
        uuid
        name
        startDate
        endDate
      }
      customFields
      ${GRAPHQL_ASSESSMENTS_FIELDS}
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`
const GQL_DELETE_REPORT = gql`
  mutation ($uuid: String!) {
    deleteReport(uuid: $uuid)
  }
`
const GQL_UNPUBLISH_REPORT = gql`
  mutation ($uuid: String!) {
    unpublishReport(uuid: $uuid)
  }
`
const GQL_EMAIL_REPORT = gql`
  mutation ($uuid: String!, $email: AnetEmailInput!) {
    emailReport(uuid: $uuid, email: $email)
  }
`
const GQL_SUBMIT_REPORT = gql`
  mutation ($uuid: String!) {
    submitReport(uuid: $uuid)
  }
`
const GQL_PUBLISH_REPORT = gql`
  mutation ($uuid: String!) {
    publishReport(uuid: $uuid)
  }
`
const GQL_ADD_REPORT_COMMENT = gql`
  mutation ($uuid: String!, $comment: CommentInput!) {
    addComment(uuid: $uuid, comment: $comment) {
      uuid
    }
  }
`
const GQL_REJECT_REPORT = gql`
  mutation ($uuid: String!, $comment: CommentInput!) {
    rejectReport(uuid: $uuid, comment: $comment)
  }
`
const GQL_APPROVE_REPORT = gql`
  mutation ($uuid: String!, $comment: CommentInput!) {
    approveReport(uuid: $uuid, comment: $comment)
  }
`

interface ReportShowProps {
  pageDispatchers?: PageDispatchersPropType
  setSearchQuery: (...args: unknown[]) => unknown
}

const ReportShow = ({ setSearchQuery, pageDispatchers }: ReportShowProps) => {
  const { currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [saveSuccess, setSaveSuccess] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showCustomFields, setShowCustomFields] = useState(
    !!Settings.fields.report.customFields
  )
  const [attachments, setAttachments] = useState([])
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
  usePageTitle(data?.report?.intent || data?.report?.uuid)
  useEffect(() => {
    setAttachments(data?.report?.attachments || [])
  }, [data])
  if (done) {
    return result
  }

  let hasAssessments
  let report, validationErrors, validationWarnings, reportSchema
  if (!data) {
    report = new Report()
  } else {
    data.report.cancelled = !!data.report.cancelledReason
    data.report.tasks = Task.fromArray(data.report.tasks)
    data.report.reportPeople = Report.sortReportPeople(
      Person.fromArray(data.report.reportPeople)
    )
    data.report.to = ""
    data.report[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.report.customFields
    )
    report = new Report(data.report)
    // Get initial tasks/people instant assessments values
    hasAssessments = report.engagementDate && !report.isFuture()
    if (hasAssessments) {
      report = Object.assign(report, report.getTasksEngagementAssessments())
      report = Object.assign(report, report.getAttendeesEngagementAssessments())
    }

    reportSchema = Report.getReportSchema(
      data.report,
      data.report.tasks,
      data.report.reportPeople
    )
    try {
      reportSchema.validateSync(report, { abortEarly: false })
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
  const isAuthor = report.authors?.some(a => Person.isEqual(currentUser, a))
  const isAttending = report.reportPeople?.some(rp =>
    Person.isEqual(currentUser, rp)
  )
  const tasksLabel = pluralize(Settings.fields.task.shortLabel)

  // User can approve when report is pending approval,
  // and user is admin or user is one of the approvers in the current approval step
  const canApprove =
    report.isPending() &&
    (isAdmin ||
      report.approvalStep?.approvers?.some(member =>
        Position.isEqual(member, currentUser?.position)
      ))
  // Approved reports may be published by an admin user
  const canPublish = report.isApproved() && isAdmin
  // Approvers and publishers can request changes
  const canRequestChanges = canApprove || canPublish
  // Warn authors when they try to approve their own report
  const warnApproveOwnReport = canApprove && isAuthor

  // Attending authors can edit if report is not published
  // Non-attending authors can only edit if it is future
  let canEdit =
    isAuthor && !report.isPublished() && (report.isFuture() || isAttending)
  // Approvers and admins can also edit
  canEdit = canEdit || canApprove || isAdmin
  // Authors, approvers and admins can always read assessments
  const canReadAssessments = isAuthor || canApprove || isAdmin

  // Only an admin or an author can submit when report is in draft or rejected AND author has an active position
  const hasActivePosition = currentUser.hasActivePosition()
  const canSubmit =
    (isAdmin || (isAuthor && hasActivePosition)) &&
    (report.isDraft() || report.isRejected())

  const hasAssignedPosition = currentUser.hasAssignedPosition()

  // Anybody can email a report as long as it's not in draft.
  const canEmail = !report.isDraft()
  const hasAuthorizationGroups =
    report.authorizationGroups && report.authorizationGroups.length > 0
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled

  return (
    <Formik
      enableReinitialize
      validationSchema={reportSchema}
      validateOnMount
      initialValues={report}
    >
      {({ isValid, setFieldValue, values }) => {
        const searchText = report.intent ?? report.uuid
        const action = (
          <>
            {canEmail && (
              <Button onClick={toggleEmailModal} variant="outline-secondary">
                Email report
              </Button>
            )}
            <Button
              value="compactView"
              variant="primary"
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
            <FindObjectsButton objectLabel="Report" searchText={searchText} />
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
          </>
        )

        const reportTitle = report.intent || `#${report.uuid}`
        return (
          <div className="report-show">
            {renderEmailModal(values, setFieldValue)}

            <Messages success={saveSuccess} error={saveError} />

            {report.classification && (
              <div
                style={{ width: "100%", fontSize: "18px", textAlign: "center" }}
              >
                <span className="fw-bold me-1" id="report-classification">
                  {utils.getPolicyAndClassificationForChoice(
                    report.classification
                  )}
                </span>
                <span>
                  {utils.getReleasableToForChoice(report.classification)}
                </span>
              </div>
            )}

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
                    You can also {renderPublishButton(!isValid)} it immediately.
                  </p>
                )}
              </Fieldset>
            )}

            <Form className="form-horizontal" method="post">
              <Fieldset
                title={
                  <>
                    {(report.isPublished() || report.isCancelled()) && (
                      <SubscriptionIcon
                        subscribedObjectType="reports"
                        subscribedObjectUuid={report.uuid}
                        isSubscribed={report.isSubscribed}
                        updatedAt={report.updatedAt}
                        refetch={refetch}
                        setError={error => {
                          setSaveError(error)
                          jumpToTop()
                        }}
                        persistent
                      />
                    )}{" "}
                    Report {reportTitle}
                  </>
                }
                action={action}
              />
              <Fieldset className="show-report-overview">
                <Field
                  label="Summary"
                  name="summary"
                  component={FieldHelper.SpecialField}
                  widget={
                    <div id="report-summary">
                      <DictionaryField
                        wrappedComponent={Field}
                        dictProps={Settings.fields.report.intent}
                        name="intent"
                        component={FieldHelper.ReadonlyField}
                        style={{ marginBottom: 0 }}
                      />
                      <DictionaryField
                        wrappedComponent={Field}
                        dictProps={Settings.fields.report.keyOutcomes}
                        name="keyOutcomes"
                        component={FieldHelper.ReadonlyField}
                        style={{ marginBottom: 0 }}
                        humanValue={<ListItems value={report.keyOutcomes} />}
                      />
                      <DictionaryField
                        wrappedComponent={Field}
                        dictProps={Settings.fields.report.nextSteps}
                        name="nextSteps"
                        component={FieldHelper.ReadonlyField}
                        style={{ marginBottom: 0 }}
                        humanValue={<ListItems value={report.nextSteps} />}
                      />
                    </div>
                  }
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.report.engagementDate}
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
                  <DictionaryField
                    wrappedComponent={Field}
                    dictProps={Settings.fields.report.duration}
                    name="duration"
                    component={FieldHelper.ReadonlyField}
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
                  name="interlocutorOrg"
                  label={Settings.fields.interlocutor.org.name}
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    <LinkTo
                      modelType="Organization"
                      model={report.interlocutorOrg}
                    />
                  }
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.report.event}
                  name="event"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    report.event && (
                      <LinkTo modelType="Event" model={report.event} />
                    )
                  }
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.report.location}
                  name="location"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    report.location && (
                      <LinkTo modelType="Location" model={report.location} />
                    )
                  }
                />

                {report.cancelled && (
                  <DictionaryField
                    wrappedComponent={Field}
                    dictProps={Settings.fields.report.cancelledReason}
                    name="cancelledReason"
                    component={FieldHelper.ReadonlyField}
                    humanValue={utils.sentenceCase(report.cancelledReason)}
                  />
                )}

                {!report.cancelled && (
                  <>
                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.fields.report.atmosphere}
                      name="atmosphere"
                      component={FieldHelper.ReadonlyField}
                      humanValue={utils.sentenceCase(report.atmosphere)}
                    />
                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.fields.report.atmosphereDetails}
                      name="atmosphereDetails"
                      component={FieldHelper.ReadonlyField}
                    />
                  </>
                )}

                {attachmentsEnabled && (
                  <Field
                    name="attachments"
                    label="Attachments"
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      <AttachmentsDetailView
                        attachments={attachments}
                        updateAttachments={setAttachments}
                        relatedObjectType={Report.relatedObjectType}
                        relatedObjectUuid={values.uuid}
                        allowEdit={canEdit}
                      />
                    }
                  />
                )}
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
              <Fieldset title={Settings.fields.task.longLabel}>
                <NoPaginationTaskTable
                  tasks={report.tasks}
                  noTasksMessage={`No ${tasksLabel} selected`}
                />
              </Fieldset>
              {report.reportText && (
                <Fieldset
                  title={Settings.fields.report.reportText?.label}
                  id="report-text"
                >
                  <RichTextEditor readOnly value={report.reportText} />
                </Fieldset>
              )}
              {report.reportSensitiveInformation?.text && (
                <Fieldset title="Sensitive information">
                  <RichTextEditor
                    readOnly
                    value={report.reportSensitiveInformation.text}
                  />
                  {(hasAuthorizationGroups && (
                    <div>
                      <h5>Authorized communities:</h5>
                      <AuthorizationGroupTable
                        authorizationGroups={values.authorizationGroups}
                      />
                    </div>
                  )) || (
                    <h5 className="alert alert-warning">
                      No communities are authorized!
                    </h5>
                  )}
                </Fieldset>
              )}
              {showCustomFields && (
                <Fieldset title="Engagement information" id="custom-fields">
                  <ReadonlyCustomFields
                    fieldsConfig={Settings.fields.report.customFields}
                    values={values}
                    setShowCustomFields={setShowCustomFields}
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
                      relatedObject={report}
                      parentFieldName={
                        Report.ATTENDEES_ASSESSMENTS_PARENT_FIELD
                      }
                      formikProps={{
                        values
                      }}
                      canRead={canReadAssessments}
                      readonly
                    />
                  </Fieldset>

                  <Fieldset
                    title={`${Settings.fields.task.longLabel} engagement assessments`}
                    id="tasks-engagement-assessments"
                  >
                    <InstantAssessmentsContainerField
                      entityType={Task}
                      entities={values.tasks}
                      relatedObject={report}
                      parentFieldName={Report.TASKS_ASSESSMENTS_PARENT_FIELD}
                      formikProps={{
                        values
                      }}
                      canRead={canReadAssessments}
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
                        {createdAt.format(
                          Settings.dateFormats.forms.displayShort.withTime
                        )}
                        :{" "}
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
                  asA="textarea"
                  placeholder="Type a comment here"
                  className="add-new-comment"
                />
                <div className="right-button">
                  <Button
                    variant="primary"
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
                {report.isPublished() &&
                  Settings.fields.report.canUnpublishReports && (
                    <div>
                      <ConfirmDestructive
                        onConfirm={onConfirmUnpublish}
                        objectType="report"
                        operation="unpublish"
                        objectDisplay={"#" + uuid}
                        variant="warning"
                        buttonLabel={`Unpublish ${reportType}`}
                        buttonClassName="float-start"
                      />
                    </div>
                )}
                <div>
                  <ConfirmDestructive
                    onConfirm={onConfirmDelete}
                    objectType="report"
                    objectDisplay={"#" + uuid}
                    variant="danger"
                    buttonLabel={`Delete ${reportType}`}
                    buttonClassName="float-end"
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
    const alertStyle = {
      marginBottom: "1rem",
      textAlign: "center",
      zIndex: "-1"
    }
    const supportEmail = Settings.SUPPORT_EMAIL_ADDR
    const supportEmailMessage = supportEmail ? `at ${supportEmail}` : ""
    if (!currentUser.hasAssignedPosition()) {
      return (
        <div className="alert alert-warning" style={alertStyle}>
          You cannot submit a report: you are not assigned to a position.
          <br />
          Please contact your organization's superuser(s) and request to be
          assigned to a position.
          <br />
          If you are unsure, you can also contact the support team{" "}
          {supportEmailMessage}.
        </div>
      )
    } else {
      return (
        <div className="alert alert-warning" style={alertStyle}>
          You cannot submit a report: your assigned position has an inactive
          status.
          <br />
          Please contact your organization's superusers and request them to
          assign you to an active position.
          <br />
          If you are unsure, you can also contact the support team{" "}
          {supportEmailMessage}.
        </div>
      )
    }
  }
  function onConfirmUnpublish() {
    API.mutation(GQL_UNPUBLISH_REPORT, { uuid })
      .then(data => {
        navigate("/", {
          state: { success: `${reportTypeUpperFirst} unpublished` }
        })
      })
      .catch(error => {
        setSaveSuccess(null)
        setSaveError(error)
        jumpToTop()
      })
  }

  function onConfirmDelete() {
    API.mutation(GQL_DELETE_REPORT, { uuid })
      .then(data => {
        navigate("/", {
          state: { success: `${reportTypeUpperFirst} deleted` }
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
          asA="textarea"
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
          asA="textarea"
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
      <Modal centered show={showEmailModal} onHide={toggleEmailModal}>
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
            <FormText>
              One or more email addresses, comma separated, e.g.:
              <br />
              <em>
                jane@nowhere.invalid, John Doe &lt;john@example.org&gt;, "Mr. X"
                &lt;x@example.org&gt;
              </em>
            </FormText>
          </Field>

          <Field
            name="comment"
            component={FieldHelper.InputField}
            asA="textarea"
            vertical
          />
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="primary"
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
      navigate("compact")
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
      objectType,
      filters,
      text
    })
    toast.success(message, { toastId: "success-message" })
    navigate("/search")
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
      <Button variant="warning" onClick={confirmHandler}>
        {label}
      </Button>
    ) : (
      <TriggerableConfirm
        onConfirm={confirmHandler}
        title="Request changes?"
        body={renderValidationWarnings(warnings, "rejecting")}
        confirmText="Request changes anyway"
        cancelText="Cancel change request"
        variant="warning"
        buttonLabel={label}
      />
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
        variant="primary"
        size={size}
        className={className}
        onClick={confirmHandler}
        disabled={disabled}
        id={id}
      >
        {label}
      </Button>
    ) : (
      <TriggerableConfirm
        onConfirm={confirmHandler}
        title={title}
        body={renderValidationWarnings(warnings, submitType)}
        confirmText={confirmText}
        cancelText={cancelText}
        variant="primary"
        buttonLabel={label}
        buttonSize={size}
        buttonClassName={className}
        buttonDisabled={disabled}
        buttonId={id}
      />
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
      <Alert variant={style}>
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
      <Alert variant="warning">
        You may want to review the following warnings before {submitType} this{" "}
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

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    setSearchQuery: searchQuery => dispatch(setSearchQuery(searchQuery)),
    ...pageDispatchers
  }
}

export default connect(null, mapDispatchToProps)(ReportShow)
