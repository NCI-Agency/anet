import { FastField, Form, Formik } from "formik"
import { addNewReportAction, updateReportAction } from "low-side/actions"
import AppContext from "low-side/components/AppContext"
import * as FieldHelper from "low-side/components/FieldHelper"
import Fieldset from "low-side/components/Fieldset"
import Report from "low-side/models/Report"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { Button } from "react-bootstrap"
import { useHistory } from "react-router-dom"

const ReportForm = ({ isEdit, initialValues, title }) => {
  const history = useHistory()
  const { dispatch } = useContext(AppContext)

  const reportSchema = Report.yupSchema
  const submitText = isEdit ? "Save" : "Preview"
  return (
    <div>
      <Formik
        enableReinitialize
        validateOnChange={false}
        validationSchema={reportSchema}
        initialValues={initialValues}
      >
        {({ isSubmitting, values }) => {
          const action = (
            <div>
              <Button
                bsStyle="primary"
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
              >
                {submitText}
              </Button>
            </div>
          )
          return (
            <div className="report-form">
              <Form className="form-horizontal" method="post">
                <Fieldset title={title} action={action} />
                <Fieldset>
                  <FastField
                    name="reportingTeam"
                    label={"Reporting Team"}
                    component={FieldHelper.InputField}
                  />
                  <FastField
                    name="location"
                    component={FieldHelper.InputField}
                  />
                  <FastField
                    name="grid"
                    component={FieldHelper.InputField}
                    label="Grid"
                  />

                  <FastField
                    name="dtg"
                    label="DTG"
                    component={FieldHelper.InputField}
                  />

                  <FastField
                    name="eventHeadline"
                    component={FieldHelper.SpecialField}
                    label="Event Headline"
                    widget={
                      <FastField component="select" className="form-control">
                        {Report.eventHeadlines.map(headLine => (
                          <option key={headLine} value={headLine}>
                            {headLine}
                          </option>
                        ))}
                      </FastField>
                    }
                  />
                  {values.eventHeadline === "Domain" && (
                    <FastField
                      name="domain"
                      component={FieldHelper.SpecialField}
                      label="Domain"
                      widget={
                        <FastField
                          multiple
                          component="select"
                          className="form-control"
                        >
                          {domains.map(headLine => (
                            <option key={headLine} value={headLine}>
                              {headLine}
                            </option>
                          ))}
                        </FastField>
                      }
                    />
                  )}
                  {values.eventHeadline === "Factor" && (
                    <FastField
                      name="factor"
                      component={FieldHelper.SpecialField}
                      label="Factor"
                      widget={
                        <FastField
                          component="select"
                          multiple
                          className="form-control"
                        >
                          {factors.map(headLine => (
                            <option key={headLine} value={headLine}>
                              {headLine}
                            </option>
                          ))}
                        </FastField>
                      }
                    />
                  )}
                  <FastField
                    name="topics"
                    label={"Topics"}
                    component={FieldHelper.InputField}
                    componentClass="textarea"
                  />
                  <FastField
                    name="contacts"
                    label="Contacts/Sources"
                    component={FieldHelper.InputField}
                    componentClass="textarea"
                  />
                  <FastField
                    name="description"
                    label="Description"
                    component={FieldHelper.InputField}
                    componentClass="textarea"
                  />
                  <FastField
                    name="attitude"
                    label="Attitude/Behavior of the Contact"
                    component={FieldHelper.InputField}
                    componentClass="textarea"
                  />
                  <FastField
                    name="comments"
                    label="LMT Comments"
                    component={FieldHelper.InputField}
                    componentClass="textarea"
                  />
                  <FastField
                    name="recommendations"
                    label="RC TEC assessment and recommendations"
                    component={FieldHelper.InputField}
                    componentClass="textarea"
                  />
                </Fieldset>

                <div className="submit-buttons">
                  <div>
                    <Button onClick={onCancel}>Cancel</Button>
                  </div>
                  <div>
                    {/* Skip validation on save! */}
                    <Button
                      id="formBottomSubmit"
                      bsStyle="primary"
                      type="button"
                      onClick={onSubmit}
                      disabled={isSubmitting}
                    >
                      {submitText}
                    </Button>
                  </div>
                </div>
              </Form>
            </div>
          )
          function onSubmit() {
            console.log("OnSubmit...")
            if (!isEdit) {
              dispatch(
                addNewReportAction({
                  ...values,
                  createdAt: Date.now()
                })
              )
              history.replace(Report.pathForEdit(values))
            }
            if (isEdit) {
              dispatch(updateReportAction({ ...values }))
            }
            history.push(Report.pathFor(values), {
              success: "Report saved"
            })
          }

          function onCancel() {
            history.push("/")
          }
        }}
      </Formik>
    </div>
  )
}
ReportForm.propTypes = {
  isEdit: PropTypes.bool,
  initialValues: PropTypes.object,
  title: PropTypes.string
}
export default ReportForm

const domains = [
  "Political",
  "Military/security",
  "Economy",
  "Social",
  "Infrastructure",
  "Information"
]

const factors = [
  "None",
  "Weak institutions",
  "Inter-ethnic tensions",
  "Unilateralism",
  "Corruption and Organized Crime",
  "Radicalism",
  "Migration"
]
