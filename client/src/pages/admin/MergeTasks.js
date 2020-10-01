import { Button, Callout } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import { TaskDetailedOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import TaskField from "components/MergeField"
import Messages from "components/Messages"
import { MODEL_TO_OBJECT_TYPE } from "components/Model"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import useMergeValidation, {
  areAllSet,
  getActionButton,
  getActivationButton,
  getClearButton,
  getInfoButton,
  getLeafletMap
} from "mergeUtils"
import { Task } from "models"
import GeoLocation from "pages/locations/GeoLocation"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Col, Grid, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import { toast } from "react-toastify"
import TASKS_ICON from "resources/tasks.png"

const GQL_MERGE_TASK = gql`
  mutation($loserUuid: String!, $winnerTask: TaskInput!) {
    mergeTask(loserUuid: $loserUuid, winnerTask: $winnerTask) {
      uuid
    }
  }
`
const TASK_FIELDS = `
  uuid,
  shortName,
  longName,
  responsiblePositions,

`

const tasksFilters = {
  allAdvisorTasks: {
    label: "All",
    queryVars: {
      status: Task.STATUS.ACTIVE
    }
  }
}

const MergeTasks = ({ pageDispatchers }) => {
  const history = useHistory()
  const [saveError, setSaveError] = useState(null)
  const [
    [task1, task2, mergedTask],
    [setTask1, setTask2, setMergedTask]
  ] = useMergeValidation(null, null, new Task(), MODEL_TO_OBJECT_TYPE.Task)

  console.dir(tasksFilters)
  console.dir(TASK_FIELDS)
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  return (
    <Grid fluid>
      <Row>
        <Messages error={saveError} />
        <h2>Merge Tasks Tool</h2>
      </Row>
      <Row>
        <Col md={4}>
          <TaskColumn
            task={task1}
            setTask={setTask1}
            setFieldValue={setFieldValue}
            align="left"
            label="Task 1"
          />
        </Col>
        <Col md={4}>
          <MidColTitle>
            {getActionButton(
              () => setAllFields(task1),
              "left",
              !areAllSet(task1, task2),
              "Use All"
            )}
            <h4 style={{ margin: "0" }}>Merged Task</h4>
            {getActionButton(
              () => setAllFields(task2),
              "right",
              !areAllSet(task1, task2),
              "Use All"
            )}
          </MidColTitle>
          {!areAllSet(task1, task2) && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent="warning">
                Please select <strong>both</strong> tasks to proceed...
              </Callout>
            </div>
          )}
          {areAllSet(task1, task2, !mergedTask?.name) && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent="primary">
                Please choose a <strong>name</strong> to proceed...
              </Callout>
            </div>
          )}
          {areAllSet(task1, task2, mergedTask?.name) && (
            <>
              <TaskField
                label="Name"
                value={mergedTask.name}
                align="center"
                action={getInfoButton("Name is required.")}
              />
              <TaskField
                label="Type"
                value={mergedTask.type}
                align="center"
                action={getClearButton(() => {
                  setFieldValue("type", Task.TYPE.ADVISOR)
                })}
              />
              <TaskField
                label="Code"
                value={mergedTask.code}
                align="center"
                action={getClearButton(() => {
                  setFieldValue("code", "")
                })}
              />
              <TaskField
                label="Status"
                value={mergedTask.status}
                align="center"
                action={getActivationButton(
                  mergedTask.isActive(),
                  () => {
                    setFieldValue(
                      "status",
                      mergedTask.isActive()
                        ? Task.STATUS.INACTIVE
                        : Task.STATUS.ACTIVE
                    )
                  },
                  "task"
                )}
              />
              <TaskField
                label="Associated Tasks"
                value={mergedTask.associatedTasks}
                align="center"
                action={getClearButton(() => {
                  setFieldValue("associatedTasks", "")
                })}
              />
              <TaskField
                label="Previous People"
                value={mergedTask.previousPeople}
                align="center"
                action={getClearButton(() => {
                  setFieldValue("previousPeople", "")
                })}
              />
              <TaskField
                label="Organization"
                value={mergedTask.organization.shortName}
                align="center"
                action={getClearButton(() => {
                  setFieldValue("organization", {})
                })}
              />
              <TaskField
                label="Person"
                value={mergedTask.person.name}
                align="center"
                action={getClearButton(() => {
                  setFieldValue("person", "")
                })}
              />
              <TaskField
                label="Location"
                value={
                  <GeoLocation
                    lat={mergedTask.location.lat}
                    lng={mergedTask.location.lng}
                  />
                }
                align="center"
                action={getClearButton(() => {
                  setFieldValue("location", "")
                })}
              />
              {getLeafletMap("merged-location", mergedTask.location)}
            </>
          )}
        </Col>
        <Col md={4}>
          <TaskColumn
            task={task2}
            setTask={setTask2}
            setFieldValue={setFieldValue}
            align="right"
            label="Task 2"
          />
        </Col>
      </Row>
      <Row>
        <Button
          style={{ width: "98%", margin: "16px 1%" }}
          large
          intent="primary"
          text="Merge Tasks"
          onClick={mergeTask}
          disabled={!areAllSet(task1, task2, mergedTask?.name)}
        />
      </Row>
    </Grid>
  )

  function mergeTask() {
    if (unassignedPerson()) {
      return
    }
    let loser
    if (mergedTask.uuid) {
      // uuid only gets set by person field, loser must be the task with different uuid
      loser = mergedTask.uuid === task1.uuid ? task2 : task1
    } else {
      // if not set, means no person in both tasks, doesn't matter which one is loser
      mergedTask.uuid = task1.uuid
      loser = task2
    }

    API.mutation(GQL_MERGE_TASK, {
      loserUuid: loser.uuid,
      winnerTask: mergedTask
    })
      .then(res => {
        if (res.mergeTask) {
          history.push(Task.pathFor({ uuid: res.mergeTask.uuid }), {
            success: "Tasks merged. Displaying merged Task below."
          })
        }
      })
      .catch(error => {
        setSaveError(error)
        jumpToTop()
      })
  }

  function setFieldValue(field, value) {
    setMergedTask(oldState => new Task({ ...oldState, [field]: value }))
  }

  function setAllFields(task) {
    setMergedTask(new Task({ ...task }))
  }

  function unassignedPerson() {
    const msg = "You can't merge if a person is left unassigned"
    // both tasks having a person is validated in useMergeValidation, can't happen
    // warn when one of them has it and merged doesn't
    if (
      // only task1 has it
      !mergedTask.person.uuid &&
      task1.person.uuid &&
      !task2.person.uuid
    ) {
      toast(msg)
      return true
    } else if (
      // only task2 has it
      !mergedTask.person.uuid &&
      !task1.person.uuid &&
      task2.person.uuid
    ) {
      toast(msg)
      return true
    } else {
      return false
    }
  }
}

const TaskColumn = ({ task, setTask, setFieldValue, align, label }) => {
  return (
    <TaskCol>
      {/* FIXME: label hmtlFor needs AdvancedSingleSelect id, no prop in AdvSelect to set id */}
      <label style={{ textAlign: align }}>{label}</label>
      <AdvancedSingleSelect
        fieldName="Task"
        fieldLabel="Select a Task"
        placeholder="Select a Task to merge"
        value={task}
        overlayColumns={["Task", "Organization", "Current Occupant"]}
        overlayRenderRow={TaskDetailedOverlayRow}
        filterDefs={tasksFilters}
        onChange={value => {
          return setTask(value)
        }}
        objectType={Task}
        valueKey="name"
        fields={TASK_FIELDS}
        addon={TASKS_ICON}
        vertical
      />
      {task && (
        <>
          <TaskField
            label="Name"
            value={task.name}
            align={align}
            action={getActionButton(() => {
              setFieldValue("name", Task.name)
            }, align)}
          />
          <TaskField
            label="Type"
            value={task.type}
            align={align}
            action={getActionButton(
              () => setFieldValue("type", task.type),
              align
            )}
          />
          <TaskField
            label="Code"
            value={task.code}
            align={align}
            action={getActionButton(
              () => setFieldValue("code", task.code),
              align
            )}
          />
          <TaskField
            label="Status"
            value={task.status}
            align={align}
            action={getActionButton(
              () => setFieldValue("status", task.status),
              align
            )}
          />
          <TaskField
            label="Associated Tasks"
            value={task.associatedTasks}
            align={align}
            action={getActionButton(
              () => setFieldValue("associatedTasks", task.associatedTasks),
              align
            )}
          />
          <TaskField
            label="Previous People"
            value={task.previousPeople}
            align={align}
            action={getActionButton(
              () => setFieldValue("previousPeople", task.previousPeople),
              align
            )}
          />
          <TaskField
            label="Organization"
            value={task.organization.shortName}
            align={align}
            action={getActionButton(
              () => setFieldValue("organization", task.organization),
              align
            )}
          />
          <TaskField
            label="Person"
            value={task.person.name}
            align={align}
            action={getActionButton(() => {
              setFieldValue("person", task.person)
              // setting person should also set uuid
              setFieldValue("uuid", task.uuid)
            }, align)}
          />
          <TaskField
            label="Location"
            value={
              <GeoLocation lat={task.location.lat} lng={task.location.lng} />
            }
            align={align}
            action={getActionButton(() => {
              setFieldValue("location", task.location)
            }, align)}
          />
          {getLeafletMap(task.uuid, task.location)}
        </>
      )}
    </TaskCol>
  )
}
const TaskCol = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`

TaskColumn.propTypes = {
  task: PropTypes.instanceOf(Task),
  setTask: PropTypes.func.isRequired,
  setFieldValue: PropTypes.func.isRequired,
  align: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired
}

const MidColTitle = ""

MergeTasks.propTypes = {
  pageDispatchers: PageDispatchersPropType
}
export default connect(null, mapPageDispatchersToProps)(MergeTasks)
