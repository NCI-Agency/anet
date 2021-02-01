import ConfirmDelete from "components/ConfirmDelete"
import Messages from "components/Messages"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { deleteReportAction, updateReportAction } from "low-side/actions"
import AppContext from "low-side/components/AppContext"
import * as FieldHelper from "low-side/components/FieldHelper"
import Fieldset from "low-side/components/Fieldset"
import Report from "low-side/models/Report"
import React, { useContext } from "react"
import { Alert, Button } from "react-bootstrap"
import { useHistory, useLocation, useParams } from "react-router-dom"

const ShowReport = () => {
  const routerLocation = useLocation()
  const history = useHistory()
  const { dispatch } = useContext(AppContext)
  const { uuid } = useParams()
  const reportData = useContext(AppContext).reports.find(r => r.uuid === uuid)
  if (!reportData) {
    history.push("/")
    return null
  }

  const report = new Report(reportData)
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const stateError = routerLocation.state && routerLocation.state.error

  const reportHeader = report.isDraft() ? (
    <DraftReportHeader />
  ) : (
    <SubmittedReportHeader />
  )
  let validationErrors

  try {
    Report.yupSchema.validateSync(report, { abortEarly: false })
  } catch (e) {
    validationErrors = e.errors
  }

  return (
    <Formik
      enableReinitialize
      validationSchema={Report.yupSchema}
      validateOnMount
      initialValues={report}
    >
      {({ isSubmitting, isValid, values }) => {
        const action = report.isDraft() ? (
          <Button bsStyle="primary" onClick={onEditClick}>
            Edit
          </Button>
        ) : null

        return (
          <div className="report-show">
            <Messages success={stateSuccess} error={stateError} />
            {!_isEmpty(validationErrors) && (
              <Fieldset style={{ textAlign: "center" }}>
                <div style={{ textAlign: "left" }}>
                  {renderValidationErrors(validationErrors)}
                </div>
              </Fieldset>
            )}
            {reportHeader}
            <Form className="form-horizontal" method="post">
              <Fieldset
                title={`Report #${uuid.slice(0, 8)}...`}
                action={action}
              />
              <Fieldset>
                <Field
                  name="reportingTeam"
                  label={"Reporting Team"}
                  component={FieldHelper.ReadonlyField}
                />
                <Field name="location" component={FieldHelper.ReadonlyField} />
                <Field
                  name="grid"
                  component={FieldHelper.ReadonlyField}
                  label="Grid"
                />

                <Field
                  name="dtg"
                  label="DTG"
                  component={FieldHelper.ReadonlyField}
                />

                <Field
                  name="eventHeadline"
                  component={FieldHelper.ReadonlyField}
                  label="Event Headline"
                />
                {values.eventHeadline === "Domain" && (
                  <Field
                    name="domain"
                    component={FieldHelper.SpecialField}
                    label="Domain"
                    widget={renderMultipleItemsWithCommas(values.domain)}
                  />
                )}
                {values.eventHeadline === "Factor" && (
                  <Field
                    name="factor"
                    component={FieldHelper.ReadonlyField}
                    label="Factor"
                    widget={renderMultipleItemsWithCommas(values.factor)}
                  />
                )}
                <Field
                  name="topics"
                  label={"Topics"}
                  component={FieldHelper.ReadonlyField}
                />
                <Field
                  name="contacts"
                  label="Contacts/Sources"
                  component={FieldHelper.ReadonlyField}
                />
                <Field
                  name="description"
                  label="Description"
                  component={FieldHelper.ReadonlyField}
                />
                <Field
                  name="attitude"
                  label="Attitude/Behavior of the Contact"
                  component={FieldHelper.ReadonlyField}
                />
                <Field
                  name="comments"
                  label="LMT Comments"
                  component={FieldHelper.ReadonlyField}
                />
                <Field
                  name="recommendations"
                  label="RC TEC assessment and recommendations"
                  component={FieldHelper.ReadonlyField}
                />
              </Fieldset>
            </Form>

            <div className="submit-buttons">
              <div>
                <ConfirmDelete
                  onConfirmDelete={onConfirmDelete}
                  objectType="report"
                  objectDisplay={"#" + uuid}
                  bsStyle="warning"
                  buttonLabel="Delete report"
                  className="pull-right"
                />
              </div>
              {values.isDraft() && (
                <div>
                  <Button
                    id="formBottomSubmit"
                    bsStyle="primary"
                    type="button"
                    onClick={() => onSubmit()}
                    disabled={isSubmitting || !isValid}
                  >
                    Submit
                  </Button>
                </div>
              )}
            </div>
          </div>
        )

        function onSubmit() {
          // TODO: submit logic, api call and set state of the report SUBMITTED
          // if api returns without error, dispatch
          dispatch(
            updateReportAction({ ...values, state: Report.STATES.SUBMITTED })
          )
        }

        function onConfirmDelete() {
          dispatch(deleteReportAction(values.uuid))
          history.push("/", {
            success: "Successfuly deleted"
          })
        }

        function onEditClick() {
          history.push(Report.pathForEdit(values))
        }
      }}
    </Formik>
  )
}

export default ShowReport

const DraftReportHeader = () => (
  <Fieldset style={{ textAlign: "center" }}>
    <h4 className="text-danger">
      This is a DRAFT report and hasn't been submitted.
    </h4>
    <p>
      You can review the draft below to make sure all the details are correct.
    </p>
  </Fieldset>
)

const SubmittedReportHeader = () => (
  <Fieldset style={{ textAlign: "center" }}>
    <h4 className="text-danger">This is a SUBMITTED report.</h4>
    <p>You can review the report below</p>
  </Fieldset>
)

const renderMultipleItemsWithCommas = items => {
  // put commas until last item
  return (
    <div className="form-control-static">
      {items.map((item, idx) =>
        idx === items.length - 1 ? (
          <span key={item}>{item}</span>
        ) : (
          <span key={item}>{item}, </span>
        )
      )}
    </div>
  )
}

function renderValidationErrors(validationErrors) {
  const warning =
    "You'll need to fill out these required fields before you can submit your final Report:"
  return (
    <Alert bsStyle="danger">
      {warning}
      <ul>
        {validationErrors.map((error, idx) => (
          <li key={idx}>{error}</li>
        ))}
      </ul>
    </Alert>
  )
}
