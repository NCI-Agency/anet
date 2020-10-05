import { Button, Callout } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import { TaskSimpleOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import { customFieldsJSONString } from "components/CustomFields"
import LinkTo from "components/LinkTo"
import TaskField from "components/MergeField"
import Messages from "components/Messages"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  MODEL_TO_OBJECT_TYPE
} from "components/Model"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import { GRAPHQL_NOTES_FIELDS } from "components/RelatedObjectNotes"
import useMergeValidation, {
  areAllSet,
  getActionButton,
  getActivationButton,
  getClearButton,
  getInfoButton
} from "mergeUtils"
import { Task } from "models"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Col, FormGroup, Grid, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"
import utils from "utils"

const GQL_MERGE_TASK = gql`
  mutation($loserUuid: String!, $winnerTask: TaskInput!) {
    mergeTask(loserUuid: $loserUuid, winnerTask: $winnerTask) {
      uuid
    }
  }
`
const TASK_FIELDS = `
uuid
shortName
longName
status
customField
customFieldEnum1
customFieldEnum2
plannedCompletion
projectedCompletion
taskedOrganizations {
  uuid
  shortName
  longName
  identificationCode
}
customFieldRef1 {
  uuid
  shortName
  longName
}
responsiblePositions {
  uuid
  name
  code
  type
  status
  organization {
    uuid
    shortName
  }
  person {
    uuid
    name
    rank
    role
    avatar(size: 32)
  }
}
planningApprovalSteps {
  uuid
  name
  restrictedApproval
  approvers {
    uuid
    name
    person {
      uuid
      name
      rank
      role
      avatar(size: 32)
    }
  }
}
approvalSteps {
  uuid
  name
  restrictedApproval
  approvers {
    uuid
    name
    person {
      uuid
      name
      rank
      role
      avatar(size: 32)
    }
  }
}
customFields
${GRAPHQL_NOTES_FIELDS}

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
                value={
                  <LinkTo modelType="Task" model={mergedTask}>
                    {mergedTask.shortName} {mergedTask.longName}
                  </LinkTo>
                }
                align="center"
                action={getInfoButton("Name is required.")}
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
                  Task.getInstanceName
                )}
              />
              <TaskField
                label={Settings.fields.task.customFieldRef1.label}
                value={
                  <LinkTo modelType="Task" model={mergedTask.customFieldRef1}>
                    {mergedTask.customFieldRef1.shortName}{" "}
                    {mergedTask.customFieldRef1.longName}
                  </LinkTo>
                }
                align="center"
                action={getClearButton(() => {
                  setFieldValue("customFieldRef1", {})
                })}
              />

              <TaskField
                label={Settings.fields.task.customField.label}
                value={mergedTask.customField}
                align="center"
                action={getClearButton(() => {
                  setFieldValue("customField", "")
                })}
              />
              <TaskField
                label={Settings.fields.task.taskedOrganizations.label}
                value={
                  <>
                    {mergedTask.taskedOrganizations.map(org => (
                      <LinkTo
                        modelType="Organization"
                        model={org}
                        key={`${org.uuid}`}
                      />
                    ))}
                  </>
                }
                align="center"
                action={getClearButton(() => {
                  setFieldValue("taskedOrganizations", [])
                })}
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
    const winner = { ...mergedTask }
    // winner has to have a uuid of one, setting name field forces that
    const loser = winner.uuid === task1.uuid ? task2 : task1

    // FIXME: copied from task/Form.js save function, what fields should we strip here?
    // Should we also save a change record?
    const winnerTask = Object.without(
      new Task(winner),
      "notes",
      "assessment_customFieldEnum1",
      "customFields", // initial JSON from the db
      DEFAULT_CUSTOM_FIELDS_PARENT
    )
    winnerTask.customFieldRef1 = utils.getReference(winnerTask.customFieldRef1)
    winnerTask.customFields = customFieldsJSONString({ task: winnerTask })

    API.mutation(GQL_MERGE_TASK, {
      loserUuid: loser.uuid,
      winnerTask
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
}

const TaskColumn = ({ task, setTask, setFieldValue, align, label }) => {
  const inputId = label.replace(/ /g, "")
  return (
    <TaskCol>
      <label htmlFor={inputId} style={{ textAlign: align }}>
        {label}
      </label>
      <FormGroup controlId={inputId}>
        <AdvancedSingleSelect
          fieldName={inputId}
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
            value={
              <LinkTo modelType="Task" model={task}>
                {task.shortName} {task.longName}
              </LinkTo>
            }
            align={align}
            action={getActionButton(() => {
              setFieldValue("longName", task.longName)
              setFieldValue("shortName", task.shortName)
              // setting name should also set uuid
              setFieldValue("uuid", task.uuid)
            }, align)}
          />
          <TaskField
            label="Status"
            value={task.status}
            align={align}
            action={getActionButton(() => {
              setFieldValue("status", task.status)
            }, align)}
          />
          <TaskField
            label={Settings.fields.task.customFieldRef1.label}
            value={
              <LinkTo modelType="Task" model={task.customFieldRef1}>
                {task.customFieldRef1.shortName} {task.customFieldRef1.longName}
              </LinkTo>
            }
            align={align}
            action={getActionButton(() => {
              setFieldValue("customFieldRef1", task.customFieldRef1)
            }, align)}
          />
          <TaskField
            label={Settings.fields.task.customField.label}
            value={task.customField}
            align={align}
            action={getActionButton(() => {
              setFieldValue("customField", task.customField)
            }, align)}
          />
          <TaskField
            label={Settings.fields.task.taskedOrganizations.label}
            value={
              <>
                {task.taskedOrganizations.map(org => (
                  <React.Fragment key={`${org.uuid}`}>
                    <LinkTo modelType="Organization" model={org} />{" "}
                  </React.Fragment>
                ))}
              </>
            }
            align={align}
            action={getActionButton(() => {
              setFieldValue("taskedOrganizations", task.taskedOrganizations)
            }, align)}
          />
          <TaskField
            label="Responsible Positions"
            value={
              <>
                {task.responsiblePositions.map(pos => (
                  <React.Fragment key={`${pos.uuid}`}>
                    <LinkTo modelType="Position" model={pos} />{" "}
                  </React.Fragment>
                ))}
              </>
            }
            align={align}
            action={getActionButton(() => {
              setFieldValue("taskedOrganizations", task.taskedOrganizations)
            }, align)}
          />
          <TaskField
            label="Custom fields"
            value={task.customFields}
            align={align}
            action={getActionButton(() => {
              setFieldValue("customFields", task.customFields)
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
