import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import AppContext from "components/AppContext"
import ConfirmDestructive from "components/ConfirmDestructive"
import { ReadonlyCustomFields } from "components/CustomFields"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import {
  ENTITY_ON_DEMAND_EXPIRATION_DATE,
  GQL_DELETE_ASSESSMENT
} from "components/Model"
import PeriodsNavigation from "components/PeriodsNavigation"
import { Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import { PeriodsDetailsPropType, RECURRENCE_TYPE } from "periodUtils"
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react"
import { Button, Card, Col, Row, Table } from "react-bootstrap"
import { toast } from "react-toastify"
import Settings from "settings"
import utils from "utils"
import AssessmentModal from "../AssessmentModal"
import QuestionSet from "../QuestionSet"
import "./Ondemand.css"
import ValidationBar from "./ValidationBar"

interface OnDemandAssessmentProps {
  style?: any
  assessmentKey: string
  entity: any
  entityType: (...args: unknown[]) => unknown
  periodsDetails: PeriodsDetailsPropType
  onUpdateAssessment: (...args: unknown[]) => unknown
  canAddAssessment?: boolean
}

const OnDemandAssessment = ({
  assessmentKey,
  entity,
  entityType,
  style,
  periodsDetails,
  canAddAssessment,
  onUpdateAssessment
}: OnDemandAssessmentProps) => {
  const { currentUser } = useContext(AppContext)
  /* recurrence has the value 'ondemand' for this specific assessment type and
      numberOfPeriods is a property of the parent component (AssessmentResultsContainer)
      which is used to determine how many columns should be displayed inside of the
      ondemand assessment table. Recalculated according to the screensize. */
  const { recurrence, numberOfPeriods } = periodsDetails
  // Button text.
  const [showModal, setShowModal] = useState(false)
  // Used to determine if the AssessmentModal is in edit mode or create mode.
  const [editModeObject, setEditModeObject] = useState({
    questionnaireResults: {},
    uuid: "",
    updatedAt: null
  })
  // 'assessmentConfig' has question set for ondemand assessments defined in the dictionary
  // and 'assessmentYupSchema' used for this question set.
  const { assessmentConfig, assessmentYupSchema } = useMemo(
    () => entity.getAssessmentDetails(assessmentKey),
    [entity, assessmentKey]
  )
  const addAssessmentLabel = `Add ${
    assessmentConfig?.label || "a new assessment"
  }`

  if (
    assessmentConfig?.questions[ENTITY_ON_DEMAND_EXPIRATION_DATE] &&
    assessmentConfig?.onDemandAssessmentExpirationDays
  ) {
    assessmentConfig.questions[ENTITY_ON_DEMAND_EXPIRATION_DATE].helpText = `
      If this field is left empty, the assessment will be valid for
      ${assessmentConfig.onDemandAssessmentExpirationDays} days.
    `
  }

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

  // Cards array updated before loading the page & after every save of ondemand assessment.
  const assessmentCards = useMemo(() => {
    const cards = []
    if (!hasReadAccess) {
      return cards
    }
    const sortedOnDemandAssessments = entity.getOndemandAssessments(
      assessmentKey,
      entity
    )
    sortedOnDemandAssessments.forEach((assessment, index) => {
      const parentFieldName = `assessment-${assessment.uuid}`
      const assessmentFieldsObject = utils.parseJsonSafe(
        assessment.assessmentValues
      )

      cards.push(
        <>
          <ValidationBar
            assessmentExpirationDays={
              assessmentConfig?.onDemandAssessmentExpirationDays
            }
            index={index}
            assessmentFieldsObject={assessmentFieldsObject}
            sortedOnDemandAssessments={sortedOnDemandAssessments}
          />
          <Card key={assessment.uuid}>
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
                  {hasWriteAccess && (
                    <>
                      <Button
                        title="Edit assessment"
                        onClick={() => {
                          setEditModeObject({
                            questionnaireResults: assessmentFieldsObject,
                            uuid: assessment.uuid,
                            updatedAt: assessment.updatedAt
                          })
                          setShowModal(true)
                        }}
                        size="xs"
                        variant="outline-secondary"
                      >
                        <Icon icon={IconNames.EDIT} />
                      </Button>
                      <span style={{ marginLeft: "5px" }}>
                        <ConfirmDestructive
                          onConfirm={() => {
                            deleteAssessment(assessment.uuid)
                            setTableLocation(
                              assessmentCards.length > numberOfPeriods
                                ? numberOfPeriods - assessmentCards.length + 1
                                : 0
                            )
                          }}
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
              <div>
                <Formik
                  enableReinitialize
                  initialValues={{
                    [parentFieldName]: assessmentFieldsObject
                  }}
                >
                  {() => {
                    return (
                      <>
                        {!_isEmpty(assessmentConfig?.questions) && (
                          <ReadonlyCustomFields
                            parentFieldName={parentFieldName}
                            fieldsConfig={assessmentConfig.questions}
                            values={{
                              [parentFieldName]: assessmentFieldsObject
                            }}
                            vertical
                          />
                        )}
                        {!_isEmpty(assessmentConfig?.questionSets) && (
                          <QuestionSet
                            parentFieldName={`${parentFieldName}.questionSets`}
                            questionSets={assessmentConfig.questionSets}
                            formikProps={{
                              values: {
                                [parentFieldName]: assessmentFieldsObject
                              }
                            }}
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
        </>
      )
    })
    return cards

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
  }, [
    assessmentConfig,
    entity,
    onUpdateAssessment,
    hasWriteAccess,
    assessmentKey,
    numberOfPeriods,
    hasReadAccess
  ])
  // Holds JSX element array (assessment cards).
  const [onDemandAssessmentCards, setOnDemandAssessmentCards] =
    useState(assessmentCards)
  /* Used for navigating when PeriodsNavigation buttons are pressed. Initial value
      should show the valid card in the table to the user when the page is loaded. */
  const [tableLocation, setTableLocation] = useState(
    onDemandAssessmentCards.length >= numberOfPeriods
      ? numberOfPeriods - onDemandAssessmentCards.length
      : 0
  )

  /**
   * Puts the top three elements of onDemandAssessmentCards into table columns. If the number
   * of cards in the onDemandAssessmentCards array is smaller than 'numberOfPeriods', then
   * empty columns are placed into the table.
   * @param {number} numberOfPeriods How many columns should be displayed inside of the table.
   * @returns {JSX.Element[]}
   */
  const createColumns = useCallback(
    numberOfPeriods => {
      const columns = []
      for (let index = 0; index < numberOfPeriods; index++) {
        columns.push(
          <td key={index}>{onDemandAssessmentCards[index - tableLocation]}</td>
        )
      }
      return columns
    },
    [onDemandAssessmentCards, tableLocation]
  )

  // Trigger re-render of cards after a save of ondemand assessments.
  useEffect(() => {
    setOnDemandAssessmentCards(assessmentCards)
  }, [assessmentCards])

  if (recurrence !== RECURRENCE_TYPE.ON_DEMAND) {
    console.error(
      `Recurrence type is not ${RECURRENCE_TYPE.ON_DEMAND}. Component will not be rendered!`
    )
    return null
  } else if (_isEmpty(assessmentConfig)) {
    return null
  } else {
    return (
      <div style={{ ...style }}>
        <Fieldset
          title={
            assessmentConfig?.label ||
            `On-demand assessment results for ${assessmentKey}`
          }
          id={`entity-assessments-results-${assessmentKey}-${recurrence}`}
        >
          <PeriodsNavigation
            offset={tableLocation}
            onChange={setTableLocation}
            disabledLeft={tableLocation === 0}
            disabledRight={
              onDemandAssessmentCards.length + tableLocation ===
                numberOfPeriods ||
              onDemandAssessmentCards.length < numberOfPeriods
            }
          />
          <div style={{ display: "flex" }}>
            <Table
              className="assessments-table"
              style={{ tableLayout: "fixed" }}
            >
              <tbody>
                <tr>{createColumns(numberOfPeriods)}</tr>
              </tbody>
            </Table>
          </div>
          <div style={{ textAlign: "center" }}>
            {hasWriteAccess && (
              <Button onClick={() => setShowModal(true)}>
                {addAssessmentLabel}
              </Button>
            )}
          </div>
        </Fieldset>

        {/* If 'uuid' has a value of empty string, it means AssessmentModal is in
            create mode. If it has the value of the assessment uuid, then the AssessmentModal
            is in edit mode.
            If the 'assessment' has an empty object, it means AsessmentModal is in
            create mode. If it has the ondemand assessment values, AssessmentModal
            is in edit mode.
            The above conditions should be satisfied at the same time. */}
        <AssessmentModal
          showModal={showModal}
          assessmentKey={assessmentKey}
          assessment={{
            assessmentRelatedObjects: [
              {
                relatedObjectType: entityType.relatedObjectType,
                relatedObjectUuid: entity.uuid
              }
            ],
            uuid:
              Object.keys(editModeObject.questionnaireResults).length > 0
                ? editModeObject.uuid
                : "",
            updatedAt: editModeObject.updatedAt
          }}
          assessmentValues={editModeObject.questionnaireResults}
          entity={entity}
          title={`Assessment for ${entity.toString()}`}
          assessmentYupSchema={assessmentYupSchema}
          recurrence={recurrence}
          assessmentConfig={assessmentConfig}
          onSuccess={() => {
            setShowModal(false)
            onUpdateAssessment()
            /* Set the table position in a way that the user always sees the
                latest card in the table after addition of an ondemand assessment.
                Also make sure editing does not shift. */
            if (Object.keys(editModeObject.questionnaireResults).length === 0) {
              setTableLocation(
                onDemandAssessmentCards.length >= numberOfPeriods
                  ? numberOfPeriods - onDemandAssessmentCards.length - 1
                  : 0
              )
            }
            setEditModeObject({
              questionnaireResults: {},
              uuid: "",
              updatedAt: null
            })
          }}
          onCancel={() => {
            setShowModal(false)
            setEditModeObject({
              questionnaireResults: {},
              uuid: "",
              updatedAt: null
            })
          }}
        />
      </div>
    )
  }
}

export default OnDemandAssessment
