import { Button } from "@blueprintjs/core"
import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import { Field, Form, Formik } from "formik"
import { getOverlappingPeriodIndexes } from "periodUtils"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Col, Grid, Modal, Row } from "react-bootstrap"
import Settings from "settings"
import uuidv4 from "uuid/v4"
import "./EditHistory.css"

function EditHistory({
  history1,
  history2,
  initialHistory,
  setHistory,
  entityType,
  historyComp: HistoryComp,
  title
}) {
  const [showModal, setShowModal] = useState(false)
  const [finalHistory, setFinalHistory] = useState(() =>
    giveEachItemUuid(initialHistory || history1)
  )

  return (
    <div
      className="edit-history"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Button intent="primary" onClick={() => setShowModal(true)}>
        Edit History Manually
      </Button>
      <Modal
        show={showModal}
        onHide={onHide}
        bsSize="lg"
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
              const overlapArrays = getOverlappingDateIndexes(values.history)
              const uniqueOverlappingIndexes = new Set(overlapArrays.flat())
              const invalidDateIndexes = new Set(
                getInvalidDateIndexes(values.history)
              )
              return (
                <Grid fluid>
                  <Row>
                    <Col sm={4}>
                      <HistoryComp
                        history={history1}
                        action={(item, index) => (
                          <Button
                            onClick={() => addItem(item)}
                            intent="primary"
                          >
                            Insert To End
                          </Button>
                        )}
                      />
                    </Col>
                    <Col sm={history2 ? 4 : 8}>
                      <Form className="form-horizontal">
                        <div>
                          {invalidDateIndexes.size ? (
                            <fieldset style={getIvalidDateStyle()}>
                              <legend>Invalid Date Ranges</legend>
                              <ul>
                                {Array.from(invalidDateIndexes).map(val => (
                                  <li key={val}>
                                    Item #{val + 1}'s start time is later than
                                    end time
                                  </li>
                                ))}
                              </ul>
                            </fieldset>
                          ) : null}
                          {/* Don't even show overlaps if there are invalid date ranges */}
                          {!invalidDateIndexes.size && overlapArrays.length ? (
                            <fieldset style={getOverlapWarningStyle()}>
                              <legend>Overlapping Items:</legend>
                              <ul>
                                {overlapArrays.map(o => (
                                  <li key={`${o[0]}-${o[1]}`}>
                                    Item #{o[0] + 1} overlaps with Item #
                                    {o[1] + 1}
                                  </li>
                                ))}
                              </ul>
                            </fieldset>
                          ) : null}
                        </div>
                        <h2 style={{ textAlign: "center" }}>Merged History</h2>
                        {values.history.map((item, idx) => {
                          // To be able to set fields inside the array state
                          const startTimeFieldName = `history[${idx}].startTime`
                          const endTimeFieldName = `history[${idx}].endTime`

                          return (
                            <div key={item.uuid}>
                              <Fieldset
                                title={`${idx + 1}-) ${item[entityType].name}`}
                                action={
                                  <Button
                                    intent="danger"
                                    onClick={() => removeItemFromHistory(idx)}
                                  >
                                    Remove From History
                                  </Button>
                                }
                              />
                              <div
                                style={getStyle(
                                  idx,
                                  uniqueOverlappingIndexes,
                                  invalidDateIndexes
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
                              id="saveSearchModalSubmitButton"
                              intent="primary"
                              large
                              onClick={() => onSave(values)}
                              disabled={
                                invalidDateIndexes.size || overlapArrays.length
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
                              intent="primary"
                            >
                              Insert To End
                            </Button>
                          )}
                        />
                      </Col>
                    )}
                  </Row>
                </Grid>
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

  function onHide() {
    setShowModal(false)
    // Set the state to initial value
    setFinalHistory(giveEachItemUuid(initialHistory || history1))
  }

  function onSave(values) {
    // Shouldn't have uuid, that was for item listing
    const savedHistory = values.history.map(item =>
      Object.without(item, "uuid")
    )
    setHistory(savedHistory)
    setFinalHistory(giveEachItemUuid(savedHistory))
    setShowModal(false)
  }
}

EditHistory.propTypes = {
  history1: PropTypes.array,
  history2: PropTypes.array,
  initialHistory: PropTypes.array,
  setHistory: PropTypes.func,
  entityType: PropTypes.string,
  historyComp: PropTypes.func,
  title: PropTypes.string
}

export default EditHistory

// Returns indexes of the overlapping items
function getOverlappingDateIndexes(history) {
  // one of them falsy, we don't have overlapping
  if (!history) {
    return null
  }

  return getOverlappingPeriodIndexes(history)
}

function getInvalidDateIndexes(history) {
  const invalidIndexes = []
  history.forEach((item, index) => {
    const endTime = item.endTime || Infinity
    if (item.startTime >= endTime) {
      invalidIndexes.push(index)
    }
  })

  return invalidIndexes
}

function getOverlapWarningStyle() {
  return { outline: "2px dashed orange" }
}

function getIvalidDateStyle() {
  return { outline: "2px dashed red" }
}

function getStyle(index, overlapSet, invalidDatesSet) {
  if (invalidDatesSet.has(index)) {
    return getIvalidDateStyle()
  } else if (overlapSet.has(index) && !invalidDatesSet.size) {
    return getOverlapWarningStyle()
  }
}

function giveEachItemUuid(history) {
  return history.map(item => {
    const newItem = { ...item, uuid: uuidv4() }
    return newItem
  })
}
