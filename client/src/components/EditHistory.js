import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import { Field, Form, Formik } from "formik"
import { getOverlappingPeriodIndexes } from "periodUtils"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Col, Container, Modal, Row } from "react-bootstrap"
import Settings from "settings"
import uuidv4 from "uuid/v4"
import "./EditHistory.css"

function EditHistory({
  history1,
  history2,
  initialHistory,
  setHistory,
  historyEntityType,
  historyComp: HistoryComp,
  // currentlyOccupyingEntity used to assert the last item in the history and end time
  currentlyOccupyingEntity,
  title
}) {
  const [showModal, setShowModal] = useState(false)
  const [finalHistory, setFinalHistory] = useState(getInitialState)

  return (
    <div
      className="edit-history"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Button
        variant="secondary"
        onClick={() => {
          // Set the state to initial value first if there were any changes
          setFinalHistory(getInitialState())
          setShowModal(true)
        }}
      >
        Edit History Manually
      </Button>
      <Modal
        centered
        show={showModal}
        onHide={onHide}
        size="lg"
        dialogClassName="edit-history-dialog"
      >
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            enableReinitialize
            initialValues={{
              history: finalHistory
            }}
          >
            {({ values, setFieldValue, setValues }) => {
              // Get overlapping items' indexes, e.g.[ [0,1], [2,3] ] means 0th and 1st overlaps, 2nd and 3rd overlaps
              const overlapArrays = getOverlappingDateIndexes(values.history)
              // Flatten the above array for getting unique indexes, e.g. [[0, 1], [0,2]] => [0,1,2]
              const overlappingIndexesSet = new Set(overlapArrays.flat())
              const invalidDateIndexesSet = new Set(
                getInvalidDateIndexes(values.history)
              )

              const lastItem = values.history[values.history.length - 1]
              // For last item to be valid:
              // 1- If there is no currently occupying entity
              //    a- The end time of last item shouldn't be null
              // 2- If there is a currently occupying entity
              //    a- The last entity should be same with currently occupying
              //    b- The end time of last entity should be null or undefined ( meaning continuing range)
              const validWhenNoOccupant =
                !currentlyOccupyingEntity && lastItem?.endTime
              const validWhenOccupant =
                currentlyOccupyingEntity &&
                currentlyOccupyingEntity?.uuid ===
                  lastItem?.[historyEntityType]?.uuid &&
                // eslint-disable-next-line eqeqeq
                lastItem?.endTime == null
              const validLastItem = validWhenNoOccupant || validWhenOccupant

              return (
                <Container fluid>
                  <Row>
                    <Col sm={4}>
                      <HistoryComp
                        history={history1}
                        action={(item, index) => (
                          <Button
                            onClick={() => addItem(item)}
                            variant="outline-secondary"
                          >
                            Insert To End
                          </Button>
                        )}
                      />
                    </Col>
                    <Col sm={history2 ? 4 : 8}>
                      <Form className="form-horizontal">
                        <div>
                          <ValidationMessages
                            overlapArrays={overlapArrays}
                            isInvalidLastItem={!validLastItem}
                            invalidDateIndexesSet={invalidDateIndexesSet}
                            historyEntityType={historyEntityType}
                          />
                        </div>
                        <h2 style={{ textAlign: "center" }}>Merged History</h2>
                        {values.history.map((item, idx) => {
                          // To be able to set fields inside the array state
                          const startTimeFieldName = `history[${idx}].startTime`
                          const endTimeFieldName = `history[${idx}].endTime`

                          return (
                            <div key={item.uuid}>
                              <Fieldset
                                title={`${idx + 1}-) ${
                                  item[historyEntityType].name
                                }`}
                                action={
                                  <Button
                                    variant="danger"
                                    onClick={() => removeItemFromHistory(idx)}
                                  >
                                    Remove From History
                                  </Button>
                                }
                              />
                              <div
                                style={getStyle(
                                  idx,
                                  overlappingIndexesSet,
                                  invalidDateIndexesSet,
                                  !validLastItem &&
                                    idx === values.history.length - 1
                                )}
                              >
                                <Field
                                  name={startTimeFieldName}
                                  label="Start Time"
                                  value={values.history[idx].startTime}
                                  onChange={value =>
                                    setFieldValue(
                                      startTimeFieldName,
                                      value?.valueOf()
                                    )
                                  }
                                  component={FieldHelper.SpecialField}
                                  widget={
                                    <CustomDateInput
                                      id={startTimeFieldName}
                                      withTime={
                                        Settings.engagementsIncludeTimeAndDuration
                                      }
                                    />
                                  }
                                />
                                <Field
                                  name={endTimeFieldName}
                                  label="End Time"
                                  value={values.history[idx].endTime}
                                  onChange={value =>
                                    setFieldValue(
                                      endTimeFieldName,
                                      value?.valueOf()
                                    )
                                  }
                                  component={FieldHelper.SpecialField}
                                  widget={
                                    <CustomDateInput
                                      id={endTimeFieldName}
                                      withTime={
                                        Settings.engagementsIncludeTimeAndDuration
                                      }
                                    />
                                  }
                                />
                              </div>
                            </div>
                          )
                        })}
                        <div className="submit-buttons">
                          <div>
                            <Button
                              id="editHistoryModalSubmitButton"
                              variant="primary"
                              onClick={() => onSave(values)}
                              disabled={
                                invalidDateIndexesSet.size ||
                                overlapArrays.length ||
                                !validLastItem
                              }
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </Form>
                    </Col>
                    {history2 && (
                      <Col sm={4}>
                        <HistoryComp
                          history={history2}
                          action={(item, index) => (
                            <Button
                              onClick={() => addItem(item)}
                              variant="outline-secondary"
                            >
                              Insert To End
                            </Button>
                          )}
                        />
                      </Col>
                    )}
                  </Row>
                </Container>
              )

              function removeItemFromHistory(idx) {
                setValues({
                  history: values.history.filter((item, index) => index !== idx)
                })
              }

              function addItem(item) {
                setValues({
                  history: [...values.history, { ...item, uuid: uuidv4() }]
                })
              }
            }}
          </Formik>
        </Modal.Body>
      </Modal>
    </div>
  )

  function getInitialState() {
    return giveEachItemUuid(initialHistory || history1 || [])
  }

  function onHide() {
    setShowModal(false)
    // Set the state to initial value
    setFinalHistory(getInitialState())
  }

  function onSave(values) {
    setFinalHistory([...values.history])
    // Shouldn't have uuid, that was for item listing
    const savedHistory = values.history.map(item =>
      Object.without(item, "uuid")
    )
    setHistory(savedHistory)
    setShowModal(false)
  }
}

EditHistory.propTypes = {
  history1: PropTypes.array.isRequired,
  history2: PropTypes.array,
  initialHistory: PropTypes.array,
  setHistory: PropTypes.func.isRequired,
  historyEntityType: PropTypes.string,
  historyComp: PropTypes.func.isRequired,
  currentlyOccupyingEntity: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  title: PropTypes.string
}
EditHistory.defaultProps = {
  history2: null,
  initialHistory: null,
  historyEntityType: "person",
  title: "Pick and Choose History Items",
  currentlyOccupyingEntity: null
}

export default EditHistory

function ValidationMessages({
  invalidDateIndexesSet,
  overlapArrays,
  historyEntityType,
  isInvalidLastItem
}) {
  const showInvalidMessage = invalidDateIndexesSet.size
  /* Don't even show overlaps if there are invalid date ranges */
  const showOverlappingMessage =
    !invalidDateIndexesSet.size && overlapArrays.length

  // This is the last warning, if everything is fixed, show it
  const showLastItemInvalid =
    !showInvalidMessage && !showOverlappingMessage && isInvalidLastItem

  return (
    <>
      {showInvalidMessage ? (
        <fieldset style={getIvalidDateWarningStyle()}>
          <legend>Invalid date ranges errors</legend>
          <ul>
            {Array.from(invalidDateIndexesSet).map(val => (
              <li key={val}>
                {historyEntityType} #{val + 1}'s start time is later than end
                time
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}
      {showOverlappingMessage ? (
        <fieldset style={getOverlapWarningStyle()}>
          <legend>Overlapping {historyEntityType}s error</legend>
          <ul>
            {overlapArrays.map(o => (
              <li key={`${o[0]}-${o[1]}`}>
                {historyEntityType} #{o[0] + 1} overlaps with{" "}
                {historyEntityType} #{o[1] + 1}
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}
      {showLastItemInvalid ? (
        <fieldset style={getLastItemInvalidStyle()}>
          <legend>Last {historyEntityType} invalid error</legend>
          <p>
            Last {historyEntityType} should be consistent with currently
            assigned {historyEntityType}. If there is an active{" "}
            {historyEntityType}, there should be at least one{" "}
            {historyEntityType} in history.Also, last {historyEntityType}'s end
            time should be empty. If there is no assigned {historyEntityType},
            it shouldn't be empty
          </p>
        </fieldset>
      ) : null}
    </>
  )
}

ValidationMessages.propTypes = {
  invalidDateIndexesSet: PropTypes.object,
  overlapArrays: PropTypes.array,
  historyEntityType: PropTypes.string,
  isInvalidLastItem: PropTypes.bool
}

// Returns indexes of the overlapping items
function getOverlappingDateIndexes(history = []) {
  // one of them falsy, we don't have overlapping
  if (!history) {
    return null
  }

  return getOverlappingPeriodIndexes(history)
}

function getInvalidDateIndexes(inputHistory) {
  const invalidIndexes = []
  const history = inputHistory || []
  history.forEach((item, index) => {
    const endTime = item.endTime || Infinity
    if (item.startTime >= endTime) {
      invalidIndexes.push(index)
    }
  })

  return invalidIndexes
}

function getIvalidDateWarningStyle() {
  return { outline: "2px dashed red" }
}

function getOverlapWarningStyle() {
  return { outline: "2px dashed orange" }
}

function getLastItemInvalidStyle() {
  return { outline: "2px dashed darkred" }
}

function getStyle(index, overlapSet, invalidDatesSet, isInvalidLastItem) {
  if (invalidDatesSet.has(index)) {
    return getIvalidDateWarningStyle()
    // If there is an invalid date, we shouldn't even check for overlaps
  } else if (!invalidDatesSet.size && overlapSet.has(index)) {
    return getOverlapWarningStyle()
    // If both of the warnings dealt with, show this last
  } else if (!invalidDatesSet.size && !overlapSet.size && isInvalidLastItem) {
    return getLastItemInvalidStyle()
  }
}

function giveEachItemUuid(history) {
  return history.map(item => {
    const newItem = { ...item, uuid: uuidv4() }
    return newItem
  })
}
