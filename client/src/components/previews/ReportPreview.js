import API from "api"
import { gql } from "apollo-boost"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkToNotPreviewed from "components/LinkToNotPreviewed"
import PlanningConflictForReport from "components/PlanningConflictForReport"
import Tag from "components/Tag"
import { Field, Form, Formik } from "formik"
import { Person, Report, Task } from "models"
import moment from "moment"
import { CompactReadonlyReportPeople } from "pages/reports/ReportPeople"
import PropTypes from "prop-types"
import React from "react"
import Settings from "settings"
import utils from "utils"

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
        avatar(size: 32)
        position {
          uuid
          name
          type
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
    }
  }
`

const ReportPreview = ({ className, uuid, previewId }) => {
  const { data } = API.useApiQuery(GQL_GET_REPORT, {
    uuid
  })

  if (!data) {
    return null
  }

  let report

  data.report.cancelled = !!data.report.cancelledReason
  data.report.reportTags = (data.report.tags || []).map(tag => ({
    id: tag.uuid.toString(),
    text: tag.name
  }))
  data.report.tasks = Task.fromArray(data.report.tasks)
  data.report.reportPeople = Person.fromArray(data.report.reportPeople)
  data.report.to = ""
  report = new Report(data.report)
  const reportType = report.isFuture() ? "planned engagement" : "report"

  // Get initial tasks/people instant assessments values
  const hasAssessments = report.engagementDate && !report.isFuture()
  if (hasAssessments) {
    report = Object.assign(report, report.getTasksEngagementAssessments())
    report = Object.assign(report, report.getAttendeesEngagementAssessments())
  }

  return (
    <Formik
      enableReinitialize
      validationSchema={Report.yupSchema}
      validateOnMount
      initialValues={report}
    >
      {({ values }) => {
        return (
          <div className={`report-preview ${className || ""}`}>
            {report.isPublished() && (
              <Fieldset style={{ textAlign: "center" }}>
                <h4 className="text-danger">This {reportType} is PUBLISHED.</h4>
              </Fieldset>
            )}

            {report.isRejected() && (
              <Fieldset style={{ textAlign: "center" }}>
                <h4 className="text-danger">
                  This {reportType} has CHANGES REQUESTED.
                </h4>
              </Fieldset>
            )}

            {report.isDraft() && (
              <Fieldset style={{ textAlign: "center" }}>
                <h4 className="text-danger">
                  This is a DRAFT {reportType} and hasn't been submitted.
                </h4>
              </Fieldset>
            )}

            {report.isPending() && (
              <Fieldset style={{ textAlign: "center" }}>
                <h4 className="text-danger">
                  This {reportType} is PENDING approvals.
                </h4>
              </Fieldset>
            )}

            {report.isApproved() && (
              <Fieldset style={{ textAlign: "center" }}>
                <h4 className="text-danger">This {reportType} is APPROVED.</h4>
              </Fieldset>
            )}

            <Form className="form-horizontal">
              <Fieldset title={`Report #${uuid}`} />
              <Fieldset className="show-report-overview">
                <Field
                  name="intent"
                  label="Summary"
                  component={FieldHelper.SpecialField}
                  widget={
                    <div
                      id={`${previewId}-intent`}
                      className="form-control-static"
                    >
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
                    <>
                      {report.engagementDate &&
                        moment(report.engagementDate).format(
                          Report.getEngagementDateFormat()
                        )}
                      <PlanningConflictForReport report={report} largeIcon />
                    </>
                  }
                />

                {Settings.engagementsIncludeTimeAndDuration &&
                  report.duration && (
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
                      <LinkToNotPreviewed
                        modelType="Location"
                        model={report.location}
                      />
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
                  name="authors"
                  component={FieldHelper.ReadonlyField}
                  humanValue={report.authors?.map((a, index) => (
                    <React.Fragment key={a.uuid}>
                      <LinkToNotPreviewed modelType="Person" model={a} />
                      {index !== report.authors.length - 1 ? ", " : ""}
                    </React.Fragment>
                  ))}
                />

                <Field
                  name="advisorOrg"
                  label={Settings.fields.advisor.org.name}
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    <LinkToNotPreviewed
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
                    <LinkToNotPreviewed
                      modelType="Organization"
                      model={report.principalOrg}
                    />
                  }
                />
              </Fieldset>
              <Fieldset
                title={
                  report.isFuture()
                    ? "People who will attend to this planned engagement"
                    : "People attended in this engagement"
                }
              >
                <CompactReadonlyReportPeople
                  reportPeople={report.reportPeople}
                  linkToComp={LinkToNotPreviewed}
                />
              </Fieldset>
            </Form>
          </div>
        )
      }}
    </Formik>
  )
}

ReportPreview.propTypes = {
  className: PropTypes.string,
  previewId: PropTypes.string,
  uuid: PropTypes.string
}

export default ReportPreview
