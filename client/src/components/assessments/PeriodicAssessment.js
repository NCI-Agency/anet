import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import AppContext from "components/AppContext"
import AssessmentModal from "components/assessments/AssessmentModal"
import { PeriodPropType, periodToString } from "components/assessments/utils"
import ConfirmDelete from "components/ConfirmDelete"
import { ReadonlyCustomFields } from "components/CustomFields"
import { Formik } from "formik"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import { Person } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Panel } from "react-bootstrap"
import REMOVE_ICON from "resources/delete.png"
import "components/assessments/AssessmentResultsTable.css"

const BasePeriodicAssessment = ({
  assessment,
  assessmentYupSchema,
  assessmentConfig,
  note,
  entity,
  period,
  recurrence,
  onUpdateAssessment,
  currentUser
}) => {
  const [showAssessmentModalKey, setShowAssessmentModalKey] = useState(null)

  const byMe = Person.isEqual(currentUser, note.author)
  const parentFieldName = `assessment-${note.uuid}`
  const periodDisplay = periodToString(period)

  return (
    <Panel bsStyle="primary" style={{ borderRadius: "15px" }}>
      <Panel.Heading
        style={{
          padding: "1px 1px",
          borderTopLeftRadius: "15px",
          borderTopRightRadius: "15px",
          paddingRight: "10px",
          paddingLeft: "10px",
          // whiteSpace: "nowrap", TODO: disabled for now as not working well in IE11
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end"
        }}
      >
        <>
          <i>{moment(note.updatedAt).fromNow()}</i>{" "}
          <LinkTo
            modelType="Person"
            model={note.author}
            style={{ color: "white" }}
          />
          {byMe && (
            <>
              <Button
                title="Edit assessment"
                onClick={() => setShowAssessmentModalKey(note.uuid)}
                bsSize="xsmall"
                bsStyle="primary"
              >
                <Icon icon={IconNames.EDIT} />
              </Button>
              <AssessmentModal
                showModal={showAssessmentModalKey === note.uuid}
                note={note}
                assessment={assessment}
                assessmentYupSchema={assessmentYupSchema}
                assessmentConfig={assessmentConfig}
                assessmentPeriod={period}
                recurrence={recurrence}
                title={`Assessment for ${entity.toString()} for ${periodDisplay}`}
                onSuccess={() => {
                  setShowAssessmentModalKey(null)
                  onUpdateAssessment()
                }}
                onCancel={() => setShowAssessmentModalKey(null)}
              />
              <ConfirmDelete
                // FIXME: implement delete assessment
                onConfirmDelete={() => console.log("to be implemented")}
                objectType="note"
                objectDisplay={"#" + note.uuid}
                title="Delete note"
                bsSize="xsmall"
                bsStyle="primary"
              >
                <img src={REMOVE_ICON} height={14} alt="Delete assessment" />
              </ConfirmDelete>
            </>
          )}
        </>
      </Panel.Heading>
      <Panel.Body>
        <div
          style={{
            overflowWrap: "break-word",
            /* IE: */ wordWrap: "break-word"
          }}
        >
          <Formik
            enableReinitialize
            initialValues={{
              [parentFieldName]: assessment
            }}
          >
            {({ values }) => {
              return (
                <ReadonlyCustomFields
                  parentFieldName={parentFieldName}
                  fieldsConfig={assessmentConfig}
                  values={values}
                  vertical
                />
              )
            }}
          </Formik>
        </div>
      </Panel.Body>
    </Panel>
  )
}
BasePeriodicAssessment.propTypes = {
  assessment: PropTypes.object.isRequired,
  assessmentConfig: PropTypes.object.isRequired,
  assessmentYupSchema: PropTypes.object.isRequired,
  note: Model.notePropTypes.isRequired,
  entity: PropTypes.object.isRequired,
  period: PeriodPropType.isRequired,
  recurrence: PropTypes.string.isRequired,
  onUpdateAssessment: PropTypes.func,
  currentUser: PropTypes.instanceOf(Person)
}

const PeriodicAssessment = props => (
  <AppContext.Consumer>
    {context => (
      <BasePeriodicAssessment currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)
export default PeriodicAssessment
