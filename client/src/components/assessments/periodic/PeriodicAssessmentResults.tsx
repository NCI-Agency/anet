import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import AppContext from "components/AppContext"
import ConfirmDestructive from "components/ConfirmDestructive"
import { ReadonlyCustomFields } from "components/CustomFields"
import LinkTo from "components/LinkTo"
import { GQL_DELETE_ASSESSMENT } from "components/Model"
import { Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import {
  AssessmentPeriodPropType,
  AssessmentPeriodsConfigPropType,
  periodToString
} from "periodUtils"
import React, { useContext, useMemo, useState } from "react"
import { Button, Card, Col, Row } from "react-bootstrap"
import { toast } from "react-toastify"
import Settings from "settings"
import AssessmentModal from "../AssessmentModal"
import QuestionSet from "../QuestionSet"

interface PeriodicAssessmentProps {
  assessmentKey: string
  assessmentValues: any
  assessmentConfig: AssessmentPeriodsConfigPropType
  assessmentYupSchema: any
  assessment: Model.assessmentPropType
  entity: any
  period: AssessmentPeriodPropType
  recurrence: string
  canEditAssessment?: boolean
  onUpdateAssessment: (...args: unknown[]) => unknown
}

const PeriodicAssessment = ({
  assessmentKey,
  assessmentValues,
  assessmentYupSchema,
  assessmentConfig,
  assessment,
  entity,
  period,
  recurrence,
  canEditAssessment,
  onUpdateAssessment
}: PeriodicAssessmentProps) => {
  const [showAssessmentModalKey, setShowAssessmentModalKey] = useState(null)
  const parentFieldName = `assessment-${assessment.uuid}`
  const periodDisplay = periodToString(period)

  return (
    <Card>
      <Card.Header>
        <Row>
          <Col xs={8}>
            <Row>
              <i>
                {moment(assessment.updatedAt).format(
                  Settings.dateFormats.forms.displayShort.withTime
                )}
              </i>{" "}
            </Row>
            <Row>
              <LinkTo modelType="Person" model={assessment.author} />
            </Row>
          </Col>
          <Col xs={4} className="text-end">
            {canEditAssessment && (
              <>
                <Button
                  title="Edit assessment"
                  onClick={() => setShowAssessmentModalKey(assessment.uuid)}
                  size="xs"
                  variant="outline-secondary"
                >
                  <Icon icon={IconNames.EDIT} />
                </Button>
                <AssessmentModal
                  showModal={showAssessmentModalKey === assessment.uuid}
                  assessment={assessment}
                  assessmentKey={assessmentKey}
                  assessmentValues={assessmentValues}
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
                  entity={entity}
                />
                <span style={{ marginLeft: "5px" }}>
                  <ConfirmDestructive
                    onConfirm={() => deleteAssessment(assessment.uuid)}
                    objectType="assessment"
                    objectDisplay={"#" + assessment.uuid}
                    title="Delete assessment"
                    variant="outline-danger"
                    buttonSize="xs"
                  >
                    <Icon icon={IconNames.TRASH} />
                  </ConfirmDestructive>
                </span>
              </>
            )}
          </Col>
        </Row>
      </Card.Header>
      <Card.Body>
        <div
          style={{
            overflowWrap: "break-word",
            /* IE: */ wordWrap: "break-word"
          }}
        >
          <Formik
            enableReinitialize
            initialValues={{
              [parentFieldName]: assessmentValues
            }}
          >
            {({ values }) => {
              return (
                <>
                  {!_isEmpty(assessmentConfig.questions) && (
                    <ReadonlyCustomFields
                      parentFieldName={parentFieldName}
                      fieldsConfig={assessmentConfig.questions}
                      values={values}
                      vertical
                    />
                  )}
                  {!_isEmpty(assessmentConfig.questionSets) && (
                    <QuestionSet
                      entity={entity}
                      questionSets={assessmentConfig.questionSets}
                      parentFieldName={`${parentFieldName}.questionSets`}
                      formikProps={{ values }}
                      readonly
                      vertical
                    />
                  )}
                </>
              )
            }}
          </Formik>
        </div>
      </Card.Body>
    </Card>
  )

  function deleteAssessment(uuid) {
    API.mutation(GQL_DELETE_ASSESSMENT, { uuid })
      .then(() => {
        onUpdateAssessment()
        toast.success("Successfully deleted")
      })
      .catch(error => {
        toast.error(error.message.split(":").pop())
      })
  }
}

interface PeriodicAssessmentsRowsProps {
  assessmentKey: string
  entity: any
  entityType: (...args: unknown[]) => unknown
  periodsConfig: AssessmentPeriodsConfigPropType
  canAddAssessment?: boolean
  onUpdateAssessment: (...args: unknown[]) => unknown
}

export const PeriodicAssessmentsRows = ({
  assessmentKey,
  entity,
  entityType,
  periodsConfig,
  canAddAssessment,
  onUpdateAssessment
}: PeriodicAssessmentsRowsProps) => {
  const { currentUser } = useContext(AppContext)
  const [showAssessmentModalKey, setShowAssessmentModalKey] = useState(null)
  const { hasReadAccess, hasWriteAccess } = useMemo(() => {
    const hasReadAccess = entity.isAuthorizedForAssessment(
      currentUser,
      assessmentKey,
      true
    )
    const hasWriteAccess =
      canAddAssessment ||
      entity.isAuthorizedForAssessment(currentUser, assessmentKey, false)
    return { hasReadAccess, hasWriteAccess }
  }, [assessmentKey, canAddAssessment, currentUser, entity])
  if (!hasReadAccess) {
    return null
  }

  const { recurrence, periods } = periodsConfig
  if (_isEmpty(periods)) {
    return null
  }

  const { assessmentConfig, assessmentYupSchema } =
    entity.getAssessmentDetails(assessmentKey)
  if (_isEmpty(assessmentConfig)) {
    return null
  }

  const periodsAssessments = []
  const periodsAllowNewAssessment = []
  periods.forEach(period => {
    const periodAssessments = entity.getPeriodAssessments(assessmentKey, period)

    periodsAssessments.push(periodAssessments)
    // Only allow adding new assessments for a period if the user has the rights
    // for it, if the period is configured to allow adding new assessments
    // If there is already an assessment, don't allow to create a new one
    periodsAllowNewAssessment.push(
      period.allowNewAssessments && _isEmpty(periodAssessments)
    )
  })
  const hasAddAssessmentRow = !_isEmpty(
    periodsAllowNewAssessment.filter(x => x)
  )
  return (
    <>
      <tr>
        {periodsAssessments.map((periodAssessments, index) => {
          return (
            <td key={index}>
              {!_isEmpty(periodAssessments) ? (
                periodAssessments.map(({ assessment, assessmentValues }) => (
                  <div key={assessment.uuid}>
                    <PeriodicAssessment
                      assessment={assessment}
                      assessmentKey={assessmentKey}
                      assessmentValues={assessmentValues}
                      assessmentYupSchema={assessmentYupSchema}
                      assessmentConfig={assessmentConfig}
                      entity={entity}
                      period={periods[index]}
                      recurrence={recurrence}
                      canEditAssessment={hasWriteAccess}
                      onUpdateAssessment={onUpdateAssessment}
                    />
                  </div>
                ))
              ) : (
                <em>No periodic assessments</em>
              )}
            </td>
          )
        })}
      </tr>
      {hasAddAssessmentRow && hasWriteAccess && (
        <tr>
          {periods.map((period, index) => {
            const periodDisplay = periodToString(period)
            const addAssessmentLabel = `Add ${
              assessmentConfig.label || "a new assessment"
            } for ${periodDisplay}`
            const modalKey = `${entity.uuid}-${periodDisplay}`
            return (
              <td key={index}>
                {periodsAllowNewAssessment[index] && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => setShowAssessmentModalKey(modalKey)}
                    >
                      {addAssessmentLabel}
                    </Button>
                    <AssessmentModal
                      showModal={showAssessmentModalKey === modalKey}
                      assessmentKey={assessmentKey}
                      assessment={{
                        assessmentRelatedObjects: [
                          {
                            relatedObjectType: entityType.relatedObjectType,
                            relatedObjectUuid: entity.uuid
                          }
                        ]
                      }}
                      title={`Assessment for ${entity.toString()} for ${periodDisplay}`}
                      addAssessmentLabel={addAssessmentLabel}
                      assessmentYupSchema={assessmentYupSchema}
                      recurrence={recurrence}
                      assessmentPeriod={period}
                      assessmentConfig={assessmentConfig}
                      onSuccess={() => {
                        setShowAssessmentModalKey(null)
                        onUpdateAssessment()
                      }}
                      onCancel={() => setShowAssessmentModalKey(null)}
                      entity={entity}
                    />
                  </>
                )}
              </td>
            )
          })}
        </tr>
      )}
    </>
  )
}
