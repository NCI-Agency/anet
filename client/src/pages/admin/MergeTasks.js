import { Button, Callout } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import { TaskSimpleOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
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
  getInfoButton
} from "mergeUtils"
import { Task } from "models"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Col, FormGroup, Grid, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import { toast } from "react-toastify"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"

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
  responsiblePositions {
    uuid
  }
`

const tasksFilters = {
  allAdvisorTasks: {
    label: "All",
    queryVars: {
      status: Task.STATUS.ACTIVE
    }
  }
}

const taskLabel = Settings.fields.task.shortLabel
const taskLabelPlural = pluralize(taskLabel)

const MergeTasks = ({ pageDispatchers }) => {
  const history = useHistory()
  const [saveError, setSaveError] = useState(null)
  const [
    [task1, task2, mergedTask],
    [setTask1, setTask2, setMergedTask]
  ] = useMergeValidation({}, {}, new Task(), MODEL_TO_OBJECT_TYPE.Task)

  console.dir({
    task1,
    task2,
    mergedTask
  })
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  return (
    <Grid fluid>
      <Row>
        <Messages error={saveError} />
        <h2>Merge {taskLabelPlural} Tool</h2>
      </Row>
      <Row>
        <Col md={4}>
          <TaskColumn
            task={task1}
            setTask={setTask1}
            setFieldValue={setFieldValue}
            align="left"
            label={`${taskLabel} 1`}
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
            <h4 style={{ margin: "0" }}>Merged {taskLabel}</h4>
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
                Please select <strong>both</strong> {taskLabelPlural} to
                proceed...
              </Callout>
            </div>
          )}
          {areAllSet(task1, task2, !mergedTask.longName) && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent="primary">
                Please choose a <strong>name</strong> to proceed...
              </Callout>
            </div>
          )}
          {areAllSet(task1, task2, mergedTask.longName) && (
            <>
              <TaskField
                label="Name"
                value={`${mergedTask.shortName} ${mergedTask.longName}`}
                align="center"
                action={getInfoButton("Name is required.")}
              />
            </>
          )}
        </Col>
        <Col md={4}>
          <TaskColumn
            task={task2}
            setTask={setTask2}
            setFieldValue={setFieldValue}
            align="right"
            label={`${taskLabel} 2`}
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
          disabled={!areAllSet(task1, task2, mergedTask?.longName)}
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
            success: `${taskLabelPlural} merged successfully. Displaying merged ${taskLabel} below.`
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
      <label htmlFor={label.replace(/ /g, "")} style={{ textAlign: align }}>
        {label}
      </label>
      <FormGroup controlId={label.replace(/ /g, "")}>
        <AdvancedSingleSelect
          fieldName={label.replace(/ /g, "")}
          fieldLabel={`Select an ${taskLabel}`}
          placeholder={`Select an ${taskLabel} to merge`}
          value={task}
          overlayColumns={["Name"]}
          overlayRenderRow={TaskSimpleOverlayRow}
          filterDefs={tasksFilters}
          onChange={value => {
            return setTask(value)
          }}
          objectType={Task}
          valueKey="longName"
          fields={TASK_FIELDS}
          addon={TASKS_ICON}
          vertical
        />
      </FormGroup>

      {areAllSet(task) && (
        <>
          <TaskField
            label="Name"
            value={`${task.shortName} ${task.longName}`}
            align={align}
            action={getActionButton(() => {
              setFieldValue("longName", task.longName)
              setFieldValue("shortName", task.shortName)
              // setting name should also set uuid
              setFieldValue("uuid", task.uuid)
            }, align)}
          />
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
  task: PropTypes.object,
  setTask: PropTypes.func.isRequired,
  setFieldValue: PropTypes.func.isRequired,
  align: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired
}

const MidColTitle = styled.div`
  display: flex;
  height: 39px;
  margin-top: 25px;
  border-bottom: 1px solid #cccccc;
  border-top: 1px solid #cccccc;
  justify-content: space-between;
  align-items: center;
`

MergeTasks.propTypes = {
  pageDispatchers: PageDispatchersPropType
}
export default connect(null, mapPageDispatchersToProps)(MergeTasks)
