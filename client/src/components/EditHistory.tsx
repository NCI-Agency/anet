import {
  gqlEntityFieldsMap,
  gqlPreviousPeopleFields,
  gqlPreviousPositionsFields
} from "constants/GraphQLDefinitions"
import {
  PersonSimpleOverlayRow,
  PositionOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import RemoveButton from "components/RemoveButton"
import { FastField, Field, Form, Formik } from "formik"
import { Person, Position } from "models"
import moment from "moment"
import { timesOverlap } from "periodUtils"
import React, { useCallback, useEffect, useState } from "react"
import { Alert, Badge, Button, Container, Modal, Row } from "react-bootstrap"
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
  fields: `${gqlEntityFieldsMap.Person} position { ${gqlEntityFieldsMap.Position} } previousPositions { ${gqlPreviousPositionsFields} position { uuid } }`,
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
  fields: `${gqlEntityFieldsMap.Position} organization { ${gqlEntityFieldsMap.Organization} } person { ${gqlEntityFieldsMap.Person} } previousPeople { ${gqlPreviousPeopleFields} person { uuid } }`,
  addon: POSITIONS_ICON
}

const INVALID_ENTRY_STYLE = { borderRadius: "4px", backgroundColor: "#F2DEDE" }
type HistoryConflictType =
  | "PRIMARY_OVERLAP"
  | "SAME_POSITION_OVERLAP"
  | "ALREADY_OCCUPIED"

interface HistoryConflictWatcherProps {
  history: any[]
  parentEntityUuid: string
  setPeriodsOverlapping: (value: any[]) => void
  setAlreadyOccupiedEntity: (entity: any[]) => void
  isCheckingPerson: boolean
}

const HistoryConflictWatcher = ({
  history,
  parentEntityUuid,
  setPeriodsOverlapping,
  setAlreadyOccupiedEntity,
  isCheckingPerson
}: HistoryConflictWatcherProps) => {
  useEffect(() => {
    const conflicts = getHistoryConflicts(
      history,
      parentEntityUuid,
      isCheckingPerson
    )

    setPeriodsOverlapping(
      conflicts
        .filter(
          c =>
            c.types.has("PRIMARY_OVERLAP") ||
            c.types.has("SAME_POSITION_OVERLAP")
        )
        .map(c => c.item)
    )

    setAlreadyOccupiedEntity(
      conflicts.filter(c => c.types.has("ALREADY_OCCUPIED")).map(c => c.item)
    )
  }, [
    history,
    isCheckingPerson,
    parentEntityUuid,
    setAlreadyOccupiedEntity,
    setPeriodsOverlapping
  ])

  return null
}

function getMaxDate(item) {
  if (item.endTime) {
    return new Date(item.endTime)
  } else {
    return new Date()
  }
}

interface EditHistoryProps {
  historyEntityType?: string
  parentEntityUuid: string
  mainTitle?: string
  initialHistory?: any[]
  setHistory: (...args: unknown[]) => unknown
  showModal: boolean
  setShowModal: (...args: unknown[]) => unknown
}

const EditHistory = ({
  historyEntityType = "person",
  parentEntityUuid,
  mainTitle = "Edit History",
  initialHistory = null,
  setHistory,
  showModal,
  setShowModal
}: EditHistoryProps) => {
  const getInitialState = useCallback(() => {
    const withUuid = populateHistory(initialHistory)
    return sortHistory(historyEntityType, withUuid)
  }, [initialHistory, historyEntityType])

  const [finalHistory, setFinalHistory] = useState(getInitialState)
  const [periodsOverlapping, setPeriodsOverlapping] = useState([])
  const [alreadyOccupiedEntity, setAlreadyOccupiedEntity] = useState([])
  const [invalidFromDates, setInvalidFromDates] = useState<string[]>([])
  const [invalidToDates, setInvalidToDates] = useState<string[]>([])

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
      <Modal
        backdrop="static"
        centered
        size="xl"
        show={showModal}
        onHide={onHide}
        dialogClassName={`edit-history-dialog ${initialHistory && "merge"}`}
        style={{ zIndex: "1300" }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{mainTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik enableReinitialize initialValues={{ history: finalHistory }}>
            {({ values, setFieldValue, setValues }) => {
              function removeItemFromHistory(idx) {
                setValues({
                  history: values.history.filter((_, i) => i !== idx)
                })
              }

              function addItem(item) {
                setValues({
                  history: sortHistory(historyEntityType, [
                    {
                      ...item,
                      uuid: uuidv4(),
                      primary: true,
                      startTime: moment().valueOf(),
                      endTime: moment().valueOf()
                    },
                    ...values.history
                  ])
                })
              }

              return (
                <>
                  <HistoryConflictWatcher
                    history={values.history}
                    parentEntityUuid={parentEntityUuid}
                    setPeriodsOverlapping={setPeriodsOverlapping}
                    setAlreadyOccupiedEntity={setAlreadyOccupiedEntity}
                    isCheckingPerson={historyEntityType === "position"}
                  />
                  <Container fluid>
                    <Row>
                      <Form className="form-horizontal">
                        <div>
                          <ValidationMessages
                            overlappingPositions={periodsOverlapping}
                            alreadyOccupiedPositions={alreadyOccupiedEntity}
                            invalidFromDates={invalidFromDates}
                            invalidToDates={invalidToDates}
                            historyEntityType={historyEntityType}
                          />
                        </div>
                        <AdvancedSingleSelect
                          fieldName={singleSelectParameters.fieldName}
                          placeholder={singleSelectParameters.placeholder}
                          overlayColumns={singleSelectParameters.overlayColumns}
                          overlayRenderRow={
                            singleSelectParameters.overlayRenderRow
                          }
                          filterDefs={singleSelectParameters.filterDefs}
                          onChange={value =>
                            singleSelectParameters.onChange(value, addItem)
                          }
                          objectType={singleSelectParameters.objectType}
                          valueKey="name"
                          fields={singleSelectParameters.fields}
                          addon={singleSelectParameters.addon}
                        />
                        {values.history.map((item, idx) => {
                          const isError =
                            periodsOverlapping.some(
                              o => o.uuid === item.uuid
                            ) ||
                            alreadyOccupiedEntity.some(
                              o => o.uuid === item.uuid
                            ) ||
                            invalidFromDates.includes(item.uuid) ||
                            invalidToDates.includes(item.uuid)

                          // To be able to set fields inside the array state
                          const startTimeFieldName = `history[${idx}].startTime`
                          const endTimeFieldName = `history[${idx}].endTime`

                          return (
                            <div key={item.uuid} style={getStyle(isError)}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem"
                                }}
                              >
                                <Fieldset
                                  title={
                                    <span
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        flexWrap: "wrap"
                                      }}
                                    >
                                      {`${idx + 1}-) ${item[historyEntityType].name}`}
                                      {item.primary && (
                                        <Badge bg="primary">Primary</Badge>
                                      )}
                                      {item.endTime == null && (
                                        <Badge bg="success">Current</Badge>
                                      )}
                                    </span>
                                  }
                                  action={
                                    !item.isCurrent && (
                                      <RemoveButton
                                        title="Remove Item"
                                        onClick={() =>
                                          removeItemFromHistory(idx)
                                        }
                                      >
                                        Remove
                                      </RemoveButton>
                                    )
                                  }
                                />
                              </div>
                              <div className="date-container">
                                <div className="inner-container">
                                  {!item.isCurrent && (
                                    <>
                                      <div className="date-text">Primary</div>
                                      <FastField
                                        name={`history[${idx}].primary`}
                                        label=""
                                        component={
                                          FieldHelper.RadioButtonToggleGroupField
                                        }
                                        buttons={[
                                          {
                                            id: "yes",
                                            value: true,
                                            label: "Yes"
                                          },
                                          {
                                            id: "no",
                                            value: false,
                                            label: "No"
                                          }
                                        ]}
                                        onChange={value => {
                                          const updatedHistory =
                                            values.history.map((h, i) =>
                                              i === idx
                                                ? { ...h, primary: value }
                                                : h
                                            )
                                          setFieldValue(
                                            "history",
                                            sortHistory(
                                              historyEntityType,
                                              updatedHistory
                                            )
                                          )
                                        }}
                                      />
                                    </>
                                  )}
                                  <div className="date-text">From</div>
                                  <Field
                                    name={startTimeFieldName}
                                    label={null}
                                    value={item.startTime}
                                    onChange={value => {
                                      if (
                                        value == null &&
                                        values.history[idx].startTime != null
                                      ) {
                                        markInvalid(
                                          setInvalidFromDates,
                                          item.uuid
                                        )
                                        return
                                      }
                                      clearInvalid(
                                        setInvalidFromDates,
                                        item.uuid
                                      )

                                      const newValue =
                                        value && moment(value).valueOf()

                                      const updatedHistory = values.history.map(
                                        (h, i) =>
                                          i === idx
                                            ? { ...h, startTime: newValue }
                                            : h
                                      )

                                      setFieldValue(
                                        "history",
                                        sortHistory(
                                          historyEntityType,
                                          updatedHistory
                                        )
                                      )
                                    }}
                                    component={FieldHelper.SpecialField}
                                    widget={
                                      <CustomDateInput
                                        id={startTimeFieldName}
                                        maxDate={getMaxDate(item)}
                                        onInvalidChange={isInvalid => {
                                          if (isInvalid) {
                                            markInvalid(
                                              setInvalidFromDates,
                                              item.uuid
                                            )
                                          } else {
                                            clearInvalid(
                                              setInvalidFromDates,
                                              item.uuid
                                            )
                                          }
                                        }}
                                      />
                                    }
                                  />
                                </div>
                                <div className="inner-container">
                                  <div className="date-text">to</div>
                                  {item.isCurrent ? (
                                    <div className="date-input">present</div>
                                  ) : (
                                    <Field
                                      name={endTimeFieldName}
                                      label={null}
                                      value={values.history[idx].endTime}
                                      onChange={value => {
                                        if (
                                          value == null &&
                                          values.history[idx].endTime != null
                                        ) {
                                          markInvalid(
                                            setInvalidToDates,
                                            item.uuid
                                          )
                                          return
                                        }
                                        clearInvalid(
                                          setInvalidToDates,
                                          item.uuid
                                        )

                                        const newValue =
                                          value && moment(value).valueOf()

                                        const updatedHistory =
                                          values.history.map((h, i) =>
                                            i === idx
                                              ? { ...h, endTime: newValue }
                                              : h
                                          )

                                        setFieldValue(
                                          "history",
                                          sortHistory(
                                            historyEntityType,
                                            updatedHistory
                                          )
                                        )
                                      }}
                                      component={FieldHelper.SpecialField}
                                      widget={
                                        <CustomDateInput
                                          id={endTimeFieldName}
                                          maxDate={moment().toDate()}
                                          minDate={new Date(item.startTime)}
                                          onInvalidChange={isInvalid => {
                                            if (isInvalid) {
                                              markInvalid(
                                                setInvalidToDates,
                                                item.uuid
                                              )
                                            } else {
                                              clearInvalid(
                                                setInvalidToDates,
                                                item.uuid
                                              )
                                            }
                                          }}
                                        />
                                      }
                                    />
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
                                periodsOverlapping.length > 0 ||
                                invalidFromDates.length > 0 ||
                                invalidToDates.length > 0
                              }
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </Form>
                    </Row>
                  </Container>
                </>
              )
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
      Object.without(item, "uuid", "isCurrent")
    )
    setHistory(savedHistory)
  }
}

export default EditHistory

interface ValidationMessagesProps {
  overlappingPositions: any
  alreadyOccupiedPositions: any
  invalidFromDates: any
  invalidToDates: any
  historyEntityType?: string
}

const ValidationMessages = ({
  overlappingPositions,
  alreadyOccupiedPositions,
  historyEntityType,
  invalidFromDates,
  invalidToDates
}: ValidationMessagesProps) => {
  if (
    overlappingPositions.length === 0 &&
    alreadyOccupiedPositions.length === 0 &&
    invalidFromDates.length === 0 &&
    invalidToDates.length === 0
  ) {
    return null
  }

  return (
    <Alert variant="danger">
      {invalidFromDates.length > 0 && <p>Some start dates are not valid</p>}
      {invalidToDates.length > 0 && <p>Some end dates are not valid</p>}
      {overlappingPositions.length > 0 && (
        <>
          <legend>{`Overlapping ${historyEntityType}s error`}</legend>
          <ul>
            {overlappingPositions.map((item, index) => (
              <li key={item.uuid ?? index}>
                <strong>{item[historyEntityType]?.name}</strong> (
                {moment(item.startTime).format("DD MMM YYYY")} –{" "}
                {item.endTime
                  ? moment(item.endTime).format("DD MMM YYYY")
                  : "present"}
                )
              </li>
            ))}
          </ul>
        </>
      )}
      {alreadyOccupiedPositions.length > 0 && (
        <>
          <legend>{`This ${historyEntityType} is already occupied in these dates`}</legend>
          <ul>
            {alreadyOccupiedPositions.map((item, index) => (
              <li key={item.uuid ?? index}>
                <strong>{item[historyEntityType]?.name}</strong> (
                {moment(item.startTime).format("DD MMM YYYY")} –{" "}
                {item.endTime
                  ? moment(item.endTime).format("DD MMM YYYY")
                  : "present"}
                )
              </li>
            ))}
          </ul>
        </>
      )}
    </Alert>
  )
}

function getStyle(isOverlap: boolean) {
  if (isOverlap) {
    return {
      ...INVALID_ENTRY_STYLE,
      border: "1px solid red",
      padding: "8px",
      marginBottom: "6px"
    }
  }
  return {}
}

function populateHistory(history) {
  return history.map(item => ({
    ...item,
    uuid: uuidv4(),
    isCurrent: item.endTime == null
  }))
}

function getSingleSelectParameters(historyEntityType) {
  if (historyEntityType === "person") {
    const personFilters = {
      allPersons: {
        label: "All",
        queryVars: {
          pendingVerification: false
        }
      }
    }
    return { ...PERSON_SINGLE_SELECT_PARAMETERS, filterDefs: personFilters }
  } else if (historyEntityType === "position") {
    const positionsFilters = {
      allPositions: {
        label: "All"
      }
    }
    return {
      ...POSITION_SINGLE_SELECT_PARAMETERS,
      filterDefs: positionsFilters
    }
  }
}

function compareHistory(entity: string, a: any, b: any) {
  // 1) Primary first
  if (a.primary && !b.primary) {
    return -1
  }
  if (!a.primary && b.primary) {
    return 1
  }

  // 2) Sort by endTime descending
  // Positions with null endTime come first (current positions)
  const aEnd = a.endTime ?? Infinity // null means current → Infinity → comes first
  const bEnd = b.endTime ?? Infinity
  if (aEnd !== bEnd) {
    return bEnd - aEnd
  }

  // 3) Tie-breaker: entity UUID
  const aUuid = a[entity]?.uuid ?? ""
  const bUuid = b[entity]?.uuid ?? ""
  const cmpEntity = aUuid.localeCompare(bUuid)
  if (cmpEntity !== 0) {
    return cmpEntity
  }

  // 4) Final tie-breaker: item UUID
  return (a.uuid ?? "").localeCompare(b.uuid ?? "")
}

function sortHistory(historyEntityType: string, history: any[]) {
  return [...history].sort((a, b) => compareHistory(historyEntityType, a, b))
}

function getHistoryConflicts(
  history: any[],
  parentEntityUuid: string,
  isCheckingPerson: boolean
) {
  const conflicts = new Map<
    string,
    { item: any; types: Set<HistoryConflictType> }
  >()

  function addConflict(item: any, type: HistoryConflictType) {
    if (!conflicts.has(item.uuid)) {
      conflicts.set(item.uuid, { item, types: new Set() })
    }
    conflicts.get(item.uuid)?.types.add(type)
  }

  history.forEach((current, i) => {
    if (current.startTime == null) {
      return
    }

    // Rule 1: no period interval overlaps
    history.forEach((other, j) => {
      if (i === j) {
        return
      }
      if (other.startTime == null) {
        return
      }

      const overlap = timesOverlap(
        current.startTime,
        current.endTime,
        other.startTime,
        other.endTime
      )

      if (!overlap) {
        return
      }

      // No overlap at all allowed when checking position history
      // Only primary positions can not overlap when checking person
      if (!isCheckingPerson || (current.primary && other.primary)) {
        addConflict(current, "PRIMARY_OVERLAP")
        addConflict(other, "PRIMARY_OVERLAP")
      }
      if (
        current.position?.uuid &&
        current.position.uuid === other.position?.uuids
      ) {
        addConflict(current, "SAME_POSITION_OVERLAP")
        addConflict(other, "SAME_POSITION_OVERLAP")
      }
    })

    // Rule 2: no entity already occupied
    if (current.position?.previousPeople && parentEntityUuid) {
      const occupied = current.position.previousPeople.some(pp => {
        if (pp.person.uuid === parentEntityUuid) {
          return false
        }

        return timesOverlap(
          current.startTime,
          current.endTime,
          pp.startTime,
          pp.endTime
        )
      })

      if (occupied) {
        addConflict(current, "ALREADY_OCCUPIED")
      }
    }
  })

  return Array.from(conflicts.values())
}
function markInvalid(setter, uuid) {
  setter(prev => (prev.includes(uuid) ? prev : [...prev, uuid]))
}

function clearInvalid(setter, uuid) {
  setter(prev => prev.filter(id => id !== uuid))
}
