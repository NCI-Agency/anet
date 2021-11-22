import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import AssessmentModal from "components/assessments/AssessmentModal"
import ValidationBar from "components/assessments/OnDemandAssessments/ValidationBar"
import ConfirmDestructive from "components/ConfirmDestructive"
import { ReadonlyCustomFields } from "components/CustomFields"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Model, {
  ENTITY_ON_DEMAND_EXPIRATION_DATE,
  NOTE_TYPE
} from "components/Model"
import PeriodsNavigation from "components/PeriodsNavigation"
import { Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import { PeriodsDetailsPropType, RECURRENCE_TYPE } from "periodUtils"
import PropTypes from "prop-types"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Card, Col, Row, Table } from "react-bootstrap"
import { toast } from "react-toastify"
import Settings from "settings"
import utils from "utils"
import QuestionSet from "../QuestionSet"
import "./Ondemand.css"

const GQL_DELETE_NOTE = gql`
  mutation($uuid: String!) {
    deleteNote(uuid: $uuid)
  }
`

const OnDemandAssessment = ({
  entity,
  entityType,
  style,
  periodsDetails,
  canAddAssessment,
  onUpdateAssessment
}) => {
  /* recurrence has the value 'ondemand' for this specific assessment type and
      numberOfPeriods is a property of the parent component (AssessmentResultsContainer)
      which is used to determine how many columns should be displayed inside of the
      ondemand assessment table. Recalculated according to the screensize. */
  const { recurrence, numberOfPeriods } = periodsDetails
  // Button text.
  const addAssessmentLabel = `Make a new ${entity?.toString()} assessment`
  const [showModal, setShowModal] = useState(false)
  // Used to determine if the AssessmentModal is in edit mode or create mode.
  const [editModeObject, setEditModeObject] = useState({
    questionnaireResults: {},
    uuid: ""
  })
  // 'assessmentConfig' has question set for ondemand assessments defined in the dictionary
  // and 'assessmentYupSchema' used for this question set.
  const { assessmentConfig, assessmentYupSchema } = useMemo(
    () => entity.getPeriodicAssessmentDetails(recurrence),
    [entity, recurrence]
  )

  const filteredAssessmentConfig = useMemo(
    () => Model.filterAssessmentConfig(assessmentConfig, entity),
    [assessmentConfig, entity]
  )

  if (filteredAssessmentConfig.questions[ENTITY_ON_DEMAND_EXPIRATION_DATE]) {
    filteredAssessmentConfig.questions[
      ENTITY_ON_DEMAND_EXPIRATION_DATE
    ].helpText = `
      If this field is left empty, the assessment will be valid for
      ${Settings.fields.principal.onDemandAssessmentExpirationDays} days.
    `
  }

  // Cards array updated before loading the page & after every save of ondemand assessment.
  const assessmentCards = useMemo(() => {
    const cards = []
    const sortedOnDemandNotes = entity.getOndemandAssessments()
    sortedOnDemandNotes.forEach((note, index) => {
      const parentFieldName = `assessment-${note.uuid}`
      const assessmentFieldsObject = utils.parseJsonSafe(note.text)

      cards.push(
        <React.Fragment>
          <ValidationBar
            assessmentExpires={
              !!Settings.fields.principal.onDemandAssessmentExpirationDays
            }
            index={index}
            assessmentFieldsObject={assessmentFieldsObject}
            sortedOnDemandNotes={sortedOnDemandNotes}
          />
          <Card key={index}>
            <Card.Header>
              <Row>
                <Col xs={8}>
                  <Row>
                    <i>
                      {moment(note.updatedAt).format(
                        Settings.dateFormats.forms.displayShort.withTime
                      )}
                    </i>{" "}
                  </Row>
                  <Row>
                    <LinkTo modelType="Person" model={note.author} />
                  </Row>
                </Col>
                <Col xs={4} className="text-end">
                  {canAddAssessment && (
                    <>
                      <Button
                        title="Edit assessment"
                        onClick={() => {
                          setEditModeObject({
                            questionnaireResults: assessmentFieldsObject,
                            uuid: note.uuid
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
                            deleteNote(note.uuid)
                            setTableLocation(
                              assessmentCards.length > numberOfPeriods
                                ? numberOfPeriods - assessmentCards.length + 1
                                : 0
                            )
                          }}
                          objectType="note"
                          objectDisplay={"#" + note.uuid}
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
                        {!_isEmpty(filteredAssessmentConfig.questions) && (
                          <ReadonlyCustomFields
                            parentFieldName={parentFieldName}
                            fieldsConfig={filteredAssessmentConfig.questions}
                            values={{
                              [parentFieldName]: assessmentFieldsObject
                            }}
                            vertical
                          />
                        )}
                        {!_isEmpty(filteredAssessmentConfig.questionSets) && (
                          <QuestionSet
                            parentFieldName={`${parentFieldName}.questionSets`}
                            questionSets={
                              filteredAssessmentConfig?.questionSets
                            }
                            formikProps={{
                              values: {
                                [parentFieldName]: assessmentFieldsObject
                              }
                            }}
                            readonly={true}
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
        </React.Fragment>
      )
    })
    return cards

    function deleteNote(uuid) {
      API.mutation(GQL_DELETE_NOTE, { uuid })
        .then(() => {
          onUpdateAssessment()
          toast.success("Successfully deleted")
        })
        .catch(error => {
          toast.error(error.message.split(":").pop())
        })
    }
  }, [
    filteredAssessmentConfig,
    entity,
    onUpdateAssessment,
    canAddAssessment,
    numberOfPeriods
  ])
  // Holds JSX element array (assessment cards).
  const [onDemandAssessmentCards, setOnDemandAssessmentCards] = useState(
    assessmentCards
  )
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
  } else {
    return (
      <div style={{ ...style }}>
        <Fieldset
          title={"Assessment results - on demand"}
          id={`entity-assessments-results-${recurrence}`}
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
            <Button onClick={() => setShowModal(true)}>
              {addAssessmentLabel}
            </Button>
          </div>
        </Fieldset>

        {/* If 'uuid' has a value of empty string, it means AssessmentModal is in
            create mode. If it has the value of the note uuid, then the AssessmentModal
            is in edit mode.
            If the 'assessment' has an empty object, it means AsessmentModal is in
            create mode. If it has the ondemand assessment values, AssessmentModal
            is in edit mode.
            The above conditions should be satisfied at the same time. */}
        <AssessmentModal
          showModal={showModal}
          note={{
            type: NOTE_TYPE.ASSESSMENT,
            noteRelatedObjects: [
              {
                relatedObjectType: entityType.relatedObjectType,
                relatedObjectUuid: entity.uuid
              }
            ],
            uuid:
              Object.keys(editModeObject.questionnaireResults).length > 0
                ? editModeObject.uuid
                : ""
          }}
          assessment={editModeObject.questionnaireResults}
          entity={entity}
          title={`Assessment for ${entity.toString()}`}
          assessmentYupSchema={assessmentYupSchema}
          recurrence={recurrence}
          assessmentPeriod={{
            start: moment() // This prop is required but has no impact on this component.
          }}
          assessmentConfig={filteredAssessmentConfig}
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
            setEditModeObject({ questionnaireResults: {}, uuid: "" })
          }}
          onCancel={() => {
            setShowModal(false)
            setEditModeObject({ questionnaireResults: {}, uuid: "" })
          }}
        />
      </div>
    )
  }
}
OnDemandAssessment.propTypes = {
  style: PropTypes.object,
  entity: PropTypes.object.isRequired,
  entityType: PropTypes.func.isRequired,
  periodsDetails: PeriodsDetailsPropType.isRequired,
  onUpdateAssessment: PropTypes.func.isRequired,
  canAddAssessment: PropTypes.bool
}

export default OnDemandAssessment
