import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import AssessmentModal from "components/assessments/AssessmentModal"
import ConfirmDestructive from "components/ConfirmDestructive"
import { ReadonlyCustomFields } from "components/CustomFields"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Model, { NOTE_TYPE } from "components/Model"
import PeriodsNavigation from "components/PeriodsNavigation"
import { Formik } from "formik"
import moment from "moment"
import { PeriodsDetailsPropType, RECURRENCE_TYPE } from "periodUtils"
import PropTypes from "prop-types"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Panel, Table } from "react-bootstrap"
import { toast } from "react-toastify"
import REMOVE_ICON from "resources/delete.png"
import Settings from "settings"

const GQL_DELETE_NOTE = gql`
  mutation($uuid: String!) {
    deleteNote(uuid: $uuid)
  }
`

const OnDemandAssessments = ({
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
  const {
    assessmentConfig,
    assessmentYupSchema
  } = entity.getPeriodicAssessmentDetails(recurrence)

  const filteredAssessmentConfig = Model.filterAssessmentConfig(
    assessmentConfig,
    entity
  )

  // Cards array updated before loading the page & after every save of ondemand assessment.
  const assessmentCards = useMemo(() => {
    const cards = []
    const sortedOnDemandNotes = entity.getOndemandAssessments()
    sortedOnDemandNotes.forEach((note, index) => {
      const parentFieldName = `assessment-${note.uuid}`
      const assessmentFieldsObject = JSON.parse(note.text)
      cards.push(
        <>
          <div
            style={
              index !== sortedOnDemandNotes.length - 1
                ? {
                  color: "red",
                  paddingBottom: "3px",
                  margin: "0 -1rem 1rem 0",
                  borderBottom: "2px solid lightgrey"
                }
                : moment(assessmentFieldsObject.assessmentDate)
                  .add(
                    Settings.fields.principal
                      .onDemandAssessmentExpirationDays,
                    "days"
                  )
                  .isBefore(moment())
                  ? {
                    color: "red",
                    paddingBottom: "3px",
                    marginBottom: "1rem",
                    borderBottom: "2px solid lightgrey"
                  }
                  : {
                    paddingBottom: "3px",
                    marginBottom: "1rem",
                    borderBottom: "2px solid lightgrey"
                  }
            }
          >
            <b>
              {/* Only the last object in the sortedOnDemandNotes can be valid.
                  If the expiration date of the last object is older than NOW,
                  it is also expired. */}
              {index !== sortedOnDemandNotes.length - 1
                ? "Expired"
                : `${
                  moment(assessmentFieldsObject.assessmentDate)
                    .add(
                      Settings.fields.principal
                        .onDemandAssessmentExpirationDays,
                      "days"
                    )
                    .isBefore(moment())
                    ? "Expired"
                    : "Valid until " +
                        moment(assessmentFieldsObject.assessmentDate)
                          .add(
                            Settings.fields.principal
                              .onDemandAssessmentExpirationDays,
                            "days"
                          )
                          .format("DD MMMM YYYY")
                }`}{" "}
            </b>
          </div>
          <Panel key={index} bsStyle="primary" style={{ borderRadius: "15px" }}>
            <Panel.Heading
              style={{
                padding: "1px 1px",
                borderTopLeftRadius: "15px",
                borderTopRightRadius: "15px",
                paddingRight: "10px",
                paddingLeft: "10px",
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-end"
              }}
            >
              <i>
                {moment(note.updatedAt).format(
                  Settings.dateFormats.forms.displayShort.withTime
                )}
              </i>{" "}
              <LinkTo
                modelType="Person"
                model={note.author}
                style={{ color: "white" }}
              />
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
                    bsSize="xsmall"
                    bsStyle="primary"
                  >
                    <Icon icon={IconNames.EDIT} />
                  </Button>
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
                    bsSize="xsmall"
                    bsStyle="primary"
                  >
                    <img src={REMOVE_ICON} height={14} alt="Delete" />
                  </ConfirmDestructive>
                </>
              )}
            </Panel.Heading>
            <Panel.Body>
              <div>
                <Formik
                  enableReinitialize
                  initialValues={{
                    [parentFieldName]: assessmentFieldsObject
                  }}
                >
                  {() => {
                    return (
                      <ReadonlyCustomFields
                        parentFieldName={parentFieldName}
                        fieldsConfig={assessmentConfig}
                        values={{
                          [parentFieldName]: assessmentFieldsObject
                        }}
                        vertical
                      />
                    )
                  }}
                </Formik>
              </div>
            </Panel.Body>
          </Panel>
        </>
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
    entity,
    assessmentConfig,
    onUpdateAssessment,
    canAddAssessment,
    numberOfPeriods
  ])
  // Holds JSX elements (assessment cards). 'vs' stands for 'Vetting & Screening'.
  const [vsCards, setVSCards] = useState(assessmentCards)
  /* Used for navigating when PeriodsNavigation buttons are pressed. Initial value
      should show the valid card in the table to the user when the page is loaded. */
  const [tableLocation, setTableLocation] = useState(
    vsCards.length >= numberOfPeriods ? numberOfPeriods - vsCards.length : 0
  )

  /**
   * Puts the top three elements of vsCards into table columns. If the number
   * of cards in the vsCards array is smaller than 'numberOfPeriods', then
   * empty columns are placed into the table.
   * @param {number} numberOfPeriods How many columns should be displayed inside of the table.
   * @returns {JSX.Element[]}
   */
  const createColumns = useCallback(
    numberOfPeriods => {
      const columns = []
      for (let index = 0; index < numberOfPeriods; index++) {
        columns.push(<td key={index}>{vsCards[index - tableLocation]}</td>)
      }
      return columns
    },
    [vsCards, tableLocation]
  )

  // Trigger re-render of cards after a save of ondemand assessments.
  useEffect(() => {
    setVSCards(assessmentCards)
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
              vsCards.length + tableLocation === numberOfPeriods ||
              vsCards.length < numberOfPeriods
            }
          />
          <div style={{ display: "flex" }}>
            <Table
              condensed
              className="assessments-table"
              style={{ tableLayout: "fixed" }}
            >
              <tbody>
                <tr>{createColumns(numberOfPeriods)}</tr>
              </tbody>
            </Table>
          </div>
          <div style={{ textAlign: "center" }}>
            <Button bsStyle="primary" onClick={() => setShowModal(true)}>
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
                latest card in the table after addition of an ondemand assessment. */
            setTableLocation(
              vsCards.length >= numberOfPeriods
                ? numberOfPeriods - vsCards.length - 1
                : 0
            )
            setEditModeObject({ questionnaireResults: {}, uuid: {} })
          }}
          onCancel={() => {
            setShowModal(false)
            setEditModeObject({ questionnaireResults: {}, uuid: {} })
          }}
        />
      </div>
    )
  }
}
OnDemandAssessments.propTypes = {
  style: PropTypes.object,
  entity: PropTypes.object.isRequired,
  entityType: PropTypes.func.isRequired,
  periodsDetails: PeriodsDetailsPropType.isRequired,
  onUpdateAssessment: PropTypes.func.isRequired,
  canAddAssessment: PropTypes.bool
}

export default OnDemandAssessments
