import {
  PersonSimpleOverlayRow,
  PositionOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Model, { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import RemoveButton from "components/RemoveButton"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Person, Position } from "models"
import moment from "moment"
import { getOverlappingPeriodIndexes } from "periodUtils"
import React, { useCallback, useEffect, useState } from "react"
import { Alert, Button, Col, Container, Modal, Row } from "react-bootstrap"
import PEOPLE_ICON from "resources/people.png"
import POSITIONS_ICON from "resources/positions.png"
import { v4 as uuidv4 } from "uuid"
import "./EditHistory.css"

const PERSON_SINGLE_SELECT_PARAMETERS = {
  fieldName: "person",
  placeholder: "Insert another person in this position's history",
  overlayColumns: ["Name"],
  overlayRenderRow: PersonSimpleOverlayRow,
  onChange: (value, cb) => {
    const newEntry = {
      endTime: null,
      person: new Person(value).filterClientSideFields(),
      startTime: null
    }
    cb(newEntry)
  },
  objectType: Person,
  fields: `uuid name rank ${GRAPHQL_ENTITY_AVATAR_FIELDS} position { uuid name type organization {uuid} } previousPositions { startTime endTime position { uuid }}`,
  addon: PEOPLE_ICON
}

const POSITION_SINGLE_SELECT_PARAMETERS = {
  fieldName: "position",
  placeholder: "Insert another position in this person's history",
  overlayColumns: ["Position", "Organization", "Current Occupant"],
  overlayRenderRow: PositionOverlayRow,
  onChange: (value, cb) => {
    const newEntry = {
      startTime: null,
      endTime: null,
      position: new Position(value).filterClientSideFields()
    }
    cb(newEntry)
  },
  objectType: Position,
  fields: `uuid name code type organization { uuid shortName longName identificationCode } person { uuid name rank ${GRAPHQL_ENTITY_AVATAR_FIELDS} } previousPeople { startTime endTime person {uuid} }`,
  addon: POSITIONS_ICON
}

const INVALID_ENTRY_STYLE = { borderRadius: "4px", backgroundColor: "#F2DEDE" }

interface EditHistoryProps {
  history1: any[]
  history2?: any[]
  initialHistory?: any[]
  setHistory: (...args: unknown[]) => unknown
  historyEntityType?: string
  parentEntityUuid1: string
  parentEntityUuid2?: string
  historyComp?: (...args: unknown[]) => unknown
  showEditButton?: boolean
  showModal: boolean
  setShowModal: (...args: unknown[]) => unknown
  currentlyOccupyingEntity?: string | any
  midColTitle?: string
  mainTitle?: string
}

function EditHistory({
  history1,
  history2,
  initialHistory,
  setHistory,
  historyEntityType,
  parentEntityUuid1,
  parentEntityUuid2,
  historyComp: HistoryComp,
  showEditButton,
  showModal,
  setShowModal,
  currentlyOccupyingEntity, // currentlyOccupyingEntity used to assert the last item in the history and end time
  midColTitle,
  mainTitle
}: EditHistoryProps) {
  const getInitialState = useCallback(() => {
    return giveEachItemUuid(initialHistory || history1 || [])
  }, [initialHistory, history1])
  const [finalHistory, setFinalHistory] = useState(getInitialState)

  const singleSelectParameters = getSingleSelectParameters(historyEntityType)

  // Update finalHistory every time the modal is opened to check if the history is changed by changing the current entity.
  useEffect(() => {
    if (showModal) {
      setFinalHistory(getInitialState())
    }
  }, [getInitialState, showModal])

  return (
    <div
      className="edit-history"
      style={{ display: "flex", flexDirection: "column" }}
    >
      {showEditButton && (
        <Button
          variant="outline-secondary"
          disabled={_isEmpty(history1) && _isEmpty(history2) && !!history2}
          onClick={() => {
            setShowModal(true)
          }}
        >
          Edit History Manually
        </Button>
      )}
      <Modal
        centered
        size="xl"
        show={showModal}
        onHide={onHide}
        dialogClassName={`edit-history-dialog ${history2 && "merge"}`}
        style={{ zIndex: "1300" }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{mainTitle}</Modal.Title>
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
              const occupiedEntityIndexesSet = new Set(
                getOccupiedEntityIndexes(
                  values.history,
                  historyEntityType,
                  parentEntityUuid1,
                  parentEntityUuid2
                )
              )
              const hasCurrent = !_isEmpty(currentlyOccupyingEntity)
              const lastItem = values.history[values.history.length - 1]
              // For last item to be valid:
              // 1- If there is no currently occupying entity
              //    a- The end time of last item shouldn't be null
              // 2- If there is a currently occupying entity
              //    a- The last entity should be same with currently occupying
              //    b- The end time of last entity should be null or undefined ( meaning continuing range)
              const validWhenNoOccupant =
                !hasCurrent && (!lastItem || lastItem?.endTime)
              const validWhenOccupant =
                hasCurrent &&
                currentlyOccupyingEntity?.uuid ===
                  lastItem?.[historyEntityType]?.uuid &&
                // eslint-disable-next-line eqeqeq
                lastItem?.endTime == null
              const validLastItem = validWhenNoOccupant || validWhenOccupant

              return (
                <Container fluid>
                  <Row>
                    {history2 && (
                      <Col md={4}>
                        <HistoryComp
                          history={history1}
                          action={(item, index) => (
                            <Button
                              variant="outline-secondary"
                              onClick={() => addItem(item)}
                            >
                              Add
                            </Button>
                          )}
                        />
                      </Col>
                    )}
                    <Col md={history2 ? 4 : 12}>
                      <Form className="form-horizontal">
                        <div>
                          <ValidationMessages
                            overlapArrays={overlapArrays}
                            isInvalidLastItem={!validLastItem}
                            invalidDateIndexesSet={invalidDateIndexesSet}
                            occupiedEntityIndexesSet={occupiedEntityIndexesSet}
                            historyEntityType={historyEntityType}
                          />
                        </div>
                        <h4 style={{ textAlign: "center" }}>{midColTitle}</h4>
                        {!history2 && (
                          <AdvancedSingleSelect
                            fieldName={singleSelectParameters.fieldName}
                            fieldLabel="Select a person"
                            placeholder={singleSelectParameters.placeholder}
                            overlayColumns={
                              singleSelectParameters.overlayColumns
                            }
                            overlayRenderRow={
                              singleSelectParameters.overlayRenderRow
                            }
                            filterDefs={singleSelectParameters.filterDefs}
                            onChange={value =>
                              singleSelectParameters.onChange(value, addItem)}
                            objectType={singleSelectParameters.objectType}
                            valueKey="name"
                            fields={singleSelectParameters.fields}
                            addon={singleSelectParameters.addon}
                            vertical
                          />
                        )}
                        {values.history.map((item, idx) => {
                          // To be able to set fields inside the array state
                          const startTimeFieldName = `history[${idx}].startTime`
                          const endTimeFieldName = `history[${idx}].endTime`
                          const isCurrent =
                            hasCurrent &&
                            idx === values.history.length - 1 &&
                            item[historyEntityType]?.uuid ===
                              currentlyOccupyingEntity.uuid

                          if (isCurrent) {
                            item.endTime = null
                          }

                          return (
                            <div
                              key={item.uuid}
                              style={getStyle(
                                idx,
                                overlappingIndexesSet,
                                invalidDateIndexesSet,
                                !validLastItem &&
                                  idx === values.history.length - 1,
                                occupiedEntityIndexesSet
                              )}
                            >
                              <Fieldset
                                title={`${idx + 1}-) ${
                                  item[historyEntityType].name
                                } ${
                                  isCurrent
                                    ? `(Current ${historyEntityType})`
                                    : ""
                                }`}
                                action={
                                  !isCurrent && (
                                    <RemoveButton
                                      title="Remove Item"
                                      onClick={() => removeItemFromHistory(idx)}
                                    >
                                      Remove
                                    </RemoveButton>
                                  )
                                }
                              />
                              <div className="date-container">
                                <div className="inner-container">
                                  <div className="date-text">From</div>
                                  <Field
                                    name={startTimeFieldName}
                                    label={null}
                                    value={values.history[idx].startTime}
                                    onChange={value => {
                                      const startTime =
                                        value && moment(value).valueOf()
                                      setFieldValue(
                                        startTimeFieldName,
                                        startTime
                                      )
                                      setFinalHistory(
                                        sortHistory(
                                          historyEntityType,
                                          values.history.map((item, index) =>
                                            index === idx
                                              ? {
                                                ...item,
                                                startTime
                                              }
                                              : item
                                          ),
                                          hasCurrent
                                        )
                                      )
                                    }}
                                    component={FieldHelper.SpecialField}
                                    widget={
                                      <CustomDateInput
                                        id={startTimeFieldName}
                                        maxDate={moment().toDate()}
                                      />
                                    }
                                  />
                                </div>
                                <div className="inner-container">
                                  <div className="date-text">to</div>
                                  {!isCurrent ? (
                                    <Field
                                      name={endTimeFieldName}
                                      label={null}
                                      value={values.history[idx].endTime}
                                      onChange={value =>
                                        setFieldValue(
                                          endTimeFieldName,
                                          value && moment(value).valueOf()
                                        )}
                                      component={FieldHelper.SpecialField}
                                      widget={
                                        <CustomDateInput
                                          id={endTimeFieldName}
                                          maxDate={moment().toDate()}
                                        />
                                      }
                                    />
                                  ) : (
                                    <div className="date-input">present</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        <div className="submit-buttons">
                          <div>
                            <Button
                              onClick={onHide}
                              variant="outline-secondary"
                            >
                              Cancel
                            </Button>
                          </div>
                          <div>
                            <Button
                              id="editHistoryModalSubmitButton"
                              variant="primary"
                              onClick={() => onSave(values)}
                              disabled={
                                !!(
                                  invalidDateIndexesSet.size ||
                                  overlapArrays.length ||
                                  !validLastItem ||
                                  occupiedEntityIndexesSet.size
                                )
                              }
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </Form>
                    </Col>
                    {history2 && (
                      <Col md={4}>
                        <HistoryComp
                          history={history2}
                          action={(item, index) => (
                            <Button
                              variant="outline-secondary"
                              onClick={() => addItem(item)}
                            >
                              Add
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
                  history: sortHistory(
                    historyEntityType,
                    [{ ...item, uuid: uuidv4() }, ...values.history],
                    hasCurrent
                  )
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
    setFinalHistory(getInitialState())
  }

  function onSave(values) {
    setShowModal(false)
    setFinalHistory([...values.history])
    // Shouldn't have uuid, that was for item listing
    const savedHistory = values.history.map(item =>
      Object.without(item, "uuid")
    )
    setHistory(savedHistory)
  }
}

EditHistory.defaultProps = {
  history2: null,
  initialHistory: null,
  historyEntityType: "person",
  currentlyOccupyingEntity: null,
  mainTitle: "Pick and Choose History Items"
}

export default EditHistory

interface ValidationMessageProps {
  title: string
  keysAndMessages: {
    key: string
    msg: string
  }[]
}

function ValidationMessage({ title, keysAndMessages }: ValidationMessageProps) {
  return (
    <Alert variant="danger">
      <legend>{title}</legend>
      <ul>
        {keysAndMessages.map(({ key, msg }) => (
          <li key={key}>{msg}</li>
        ))}
      </ul>
    </Alert>
  )
}

interface ValidationMessagesProps {
  invalidDateIndexesSet?: any
  occupiedEntityIndexesSet?: any
  overlapArrays?: any[]
  historyEntityType?: string
  isInvalidLastItem?: boolean
}

function ValidationMessages({
  invalidDateIndexesSet,
  occupiedEntityIndexesSet,
  overlapArrays,
  historyEntityType,
  isInvalidLastItem
}: ValidationMessagesProps) {
  // Don't show all errors to the user at once.
  // Showing them according to a priority gives the user a nice path to create a valid history.
  // First; all the startTimes must be before the endTimes
  const showInvalidMessage = !!invalidDateIndexesSet.size
  // Second; all history items must be available between the specified dates
  const showOccupiedEntityMessage =
    !showInvalidMessage && !!occupiedEntityIndexesSet.size
  // Third; there must be no overlapping items in the created history
  const showOverlappingMessage =
    !showInvalidMessage && !showOccupiedEntityMessage && !!overlapArrays.length
  // This is the last warning, if everything is fixed, show it
  const showLastItemInvalid =
    !showInvalidMessage &&
    !showOccupiedEntityMessage &&
    !showOverlappingMessage &&
    isInvalidLastItem

  return (
    <>
      {showInvalidMessage && (
        <ValidationMessage
          title="Invalid date ranges errors"
          keysAndMessages={Array.from(invalidDateIndexesSet).map(val => ({
            key: `${val}`,
            msg: `${historyEntityType} #${
              val + 1
            }'s start time is later than end time`
          }))}
        />
      )}
      {showOccupiedEntityMessage && (
        <ValidationMessage
          title="Internal history conflicts"
          keysAndMessages={Array.from(occupiedEntityIndexesSet).map(val => ({
            key: `${val}`,
            msg: `${historyEntityType} #${
              val + 1
            } is occupied between specified dates`
          }))}
        />
      )}
      {showOverlappingMessage && (
        <ValidationMessage
          title={`Overlapping ${historyEntityType}s error`}
          keysAndMessages={overlapArrays.map(o => ({
            key: `${o[0]}-${o[1]}`,
            msg: `${historyEntityType} #${
              o[0] + 1
            } overlaps with ${historyEntityType} #${o[1] + 1}`
          }))}
        />
      )}
      {showLastItemInvalid && (
        <ValidationMessage
          title={`Last ${historyEntityType} invalid errorInvalid date ranges errors`}
          keysAndMessages={[
            {
              key: "0",
              msg: `Last ${historyEntityType} should be consistent with currently assigned ${historyEntityType}.
                If there is an active ${historyEntityType}, there should be at least one ${historyEntityType} in history.
                Also, last ${historyEntityType}'s end time should be empty.
                If there is no assigned ${historyEntityType}, it shouldn't be empty`
            }
          ]}
        />
      )}
    </>
  )
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
    if (item.startTime > endTime) {
      invalidIndexes.push(index)
    }
  })

  return invalidIndexes
}

function getOccupiedEntityIndexes(
  inputHistory,
  historyEntityType,
  parentEntityUuid1,
  parentEntityUuid2
) {
  const invalidIndexes = []
  let historyProp
  let selfHistoryProp
  if (historyEntityType === "position") {
    historyProp = "previousPeople"
    selfHistoryProp = "person"
  } else if (historyEntityType === "person") {
    historyProp = "previousPositions"
    selfHistoryProp = "position"
  }
  const history = inputHistory || []
  history.forEach((item, index) => {
    const selfHistory = item[historyEntityType][historyProp] || []
    const selfHistoryFiltered = selfHistory.filter(
      item =>
        item?.[selfHistoryProp]?.uuid !== parentEntityUuid1 &&
        item?.[selfHistoryProp]?.uuid !== parentEntityUuid2
    )
    const currStartTime = item.startTime
    const currEndTime = item.endTime
    // Check if the current input causes conflicts in the history
    const overlappingDateIndexes = getOverlappingPeriodIndexes([
      { startTime: currStartTime, endTime: currEndTime },
      ...selfHistoryFiltered
    ])
    !_isEmpty(overlappingDateIndexes) && invalidIndexes.push(index)
  })
  return invalidIndexes
}

function getStyle(
  index,
  overlapSet,
  invalidDatesSet,
  isInvalidLastItem,
  occupiedEntityIndexesSet
) {
  let style = {}
  if (
    invalidDatesSet.has(index) ||
    (!invalidDatesSet.size && occupiedEntityIndexesSet.has(index)) ||
    (!invalidDatesSet.size &&
      !occupiedEntityIndexesSet.size &&
      overlapSet.has(index)) ||
    (!invalidDatesSet.size &&
      !occupiedEntityIndexesSet.size &&
      !overlapSet.size &&
      isInvalidLastItem)
  ) {
    style = INVALID_ENTRY_STYLE
  }
  return style
}

function giveEachItemUuid(history) {
  return history.map(item => {
    const newItem = { ...item, uuid: uuidv4() }
    return newItem
  })
}

function getSingleSelectParameters(historyEntityType) {
  if (historyEntityType === "person") {
    const personSearchQuery = {
      status: Model.STATUS.ACTIVE,
      pendingVerification: false
    }

    const personFilters = {
      allPersons: {
        label: "All",
        queryVars: personSearchQuery
      }
    }
    return { ...PERSON_SINGLE_SELECT_PARAMETERS, filterDefs: personFilters }
  } else if (historyEntityType === "position") {
    const positionsFilters = {
      allPositions: {
        label: "All",
        queryVars: {
          status: Position.STATUS.ACTIVE
        }
      }
    }
    return {
      ...POSITION_SINGLE_SELECT_PARAMETERS,
      filterDefs: positionsFilters
    }
  }
}

function compareHistory(entity, a, b) {
  return (
    a.startTime - b.startTime ||
    a.endTime - b.endTime ||
    a[entity]?.uuid?.localeCompare(b[entity]?.uuid) ||
    a.uuid?.localeCompare(b.uuid)
  )
}

function sortHistory(historyEntityType, history, hasCurrent) {
  if (!hasCurrent) {
    return history.sort((a, b) => compareHistory(historyEntityType, a, b))
  }
  const historyWithoutCurrent = history.slice(0, history.length - 1)
  const sortedWithoutCurrent = historyWithoutCurrent.sort((a, b) =>
    compareHistory(historyEntityType, a, b)
  )
  return [...sortedWithoutCurrent, history[history.length - 1]]
}
