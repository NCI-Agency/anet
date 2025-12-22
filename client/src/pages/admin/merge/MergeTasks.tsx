import {
  gqlAllTaskFields,
  gqlApprovalStepFields,
  gqlAssessmentsFields,
  gqlEntityFieldsMap,
  gqlNotesFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { Callout } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { TaskOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import ApprovalSteps from "components/approvals/ApprovalSteps"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import {
  customFieldsJSONString,
  mapReadonlyCustomFieldToComp
} from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import MergeField from "components/MergeField"
import Messages from "components/Messages"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  MODEL_TO_OBJECT_TYPE
} from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import PositionTable from "components/PositionTable"
import RichTextEditor from "components/RichTextEditor"
import useMergeObjects, {
  ALIGN_OPTIONS,
  areAllSet,
  getActionButton,
  getOtherSide,
  MERGE_SIDES,
  selectAllFields,
  setAMergedField,
  setMergeable
} from "mergeUtils"
import { Task } from "models"
import moment from "moment/moment"
import pluralize from "pluralize"
import React, { useEffect, useState } from "react"
import { Button, Col, Container, Form, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useNavigate } from "react-router-dom"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"
import utils from "utils"

const ALL_TASK_FIELDS = `
  ${gqlAllTaskFields}
  parentTask {
    ${gqlEntityFieldsMap.Task}
  }
  ascendantTasks {
    ${gqlEntityFieldsMap.Task}
    parentTask {
      ${gqlEntityFieldsMap.Task}
    }
  }
  descendantTasks {
    ${gqlEntityFieldsMap.Task}
    selectable
    parentTask {
      ${gqlEntityFieldsMap.Task}
    }
    ascendantTasks {
      ${gqlEntityFieldsMap.Task}
      parentTask {
        ${gqlEntityFieldsMap.Task}
      }
    }
  }
  childrenTasks {
    ${gqlEntityFieldsMap.Task}
  }
  planningApprovalSteps {
    ${gqlApprovalStepFields}
  }
  approvalSteps {
    ${gqlApprovalStepFields}
  }
  responsiblePositions {
    ${gqlEntityFieldsMap.Position}
    person {
      ${gqlEntityFieldsMap.Person}
    }
  }
  ${gqlAssessmentsFields}
  ${gqlNotesFields}
`

const GQL_GET_TASK = gql`
  query ($uuid: String!) {
    task(uuid: $uuid) {
      ${ALL_TASK_FIELDS}
    }
  }
`

const GQL_MERGE_TASK = gql`
  mutation ($loserUuid: String!, $winnerTask: TaskInput!) {
    mergeTasks(loserUuid: $loserUuid, winnerTask: $winnerTask)
  }
`

interface MergeTasksProps {
  pageDispatchers?: PageDispatchersPropType
}

const MergeTasks = ({ pageDispatchers }: MergeTasksProps) => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const initialLeftUuid = state?.initialLeftUuid
  const [isDirty, setIsDirty] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [mergeState, dispatchMergeActions] = useMergeObjects(
    MODEL_TO_OBJECT_TYPE.Task
  )

  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Merge Tasks")

  if (!mergeState[MERGE_SIDES.LEFT] && initialLeftUuid) {
    API.query(GQL_GET_TASK, {
      uuid: initialLeftUuid
    }).then(data => {
      const task = new Task(data.task)
      task.fixupFields()
      dispatchMergeActions(setMergeable(task, MERGE_SIDES.LEFT))
    })
  }
  const task1 = mergeState[MERGE_SIDES.LEFT]
  const task2 = mergeState[MERGE_SIDES.RIGHT]
  const mergedTask = mergeState.merged

  useEffect(() => {
    setIsDirty(false)
  }, [task1, task2])
  useEffect(() => {
    setIsDirty(!!mergedTask)
  }, [mergedTask])

  return (
    <Container fluid>
      <NavigationWarning isBlocking={isDirty} />
      <Row>
        <Messages error={saveError} />
        <h4>{`Merge ${pluralize(taskShortLabel)} Tool`}</h4>
      </Row>
      <Row>
        <Col md={4} id="left-merge-task-col">
          <TaskColumn
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
            align={ALIGN_OPTIONS.LEFT}
            label={`${taskShortLabel} 1`}
            disabled={!!initialLeftUuid}
          />
        </Col>
        <Col md={4} id="mid-merge-task-col">
          <MidColTitle>
            {getActionButton(
              () => {
                dispatchMergeActions(selectAllFields(task1, MERGE_SIDES.LEFT))
                dispatchMergeActions(
                  setAMergedField(
                    "ascendantTasks",
                    task1.ascendantTasks,
                    MERGE_SIDES.LEFT
                  )
                )
              },
              MERGE_SIDES.LEFT,
              mergeState,
              null,
              !areAllSet(task1, task2),
              "Use All"
            )}
            <h4 style={{ margin: "0" }}>Merged {taskShortLabel}</h4>
            {getActionButton(
              () => {
                dispatchMergeActions(selectAllFields(task2, MERGE_SIDES.RIGHT))
                dispatchMergeActions(
                  setAMergedField(
                    "ascendantTasks",
                    task2.ascendantTasks,
                    MERGE_SIDES.RIGHT
                  )
                )
              },
              MERGE_SIDES.RIGHT,
              mergeState,
              null,
              !areAllSet(task1, task2),
              "Use All"
            )}
          </MidColTitle>
          {!areAllSet(task1, task2) && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent="warning">
                Please select <strong>both</strong> {pluralize(taskShortLabel)}{" "}
                to proceed...
              </Callout>
            </div>
          )}
          {areAllSet(task1, task2, mergedTask) && (
            <fieldset>
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.task.shortName}
                value={mergedTask.shortName}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="shortName"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.task.longName}
                value={mergedTask.longName}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="longName"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.task.parentTask}
                value={
                  <BreadcrumbTrail
                    modelType="Task"
                    leaf={mergedTask.parentTask}
                    ascendantObjects={mergedTask.ascendantTasks}
                    parentField="parentTask"
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="parentTask"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.task.description}
                value={
                  <RichTextEditor readOnly value={mergedTask.description} />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="description"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.task.status}
                value={mergedTask.status}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="status"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.task.selectable}
                value={utils.formatBoolean(mergedTask.selectable, true)}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="selectable"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.task.responsiblePositions}
                value={
                  <PositionTable
                    label={utils.sentenceCase(
                      Settings.fields.task.responsiblePositions.label
                    )}
                    positions={mergedTask.responsiblePositions || []}
                    showTask={false}
                    showStatus={false}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="responsiblePositions"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <MergeField
                label="Planning Approval Steps"
                fieldName="planningApprovalSteps"
                value={
                  <ApprovalSteps
                    approvalSteps={mergedTask.planningApprovalSteps}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <MergeField
                label="Approval Steps"
                fieldName="approvalSteps"
                value={
                  <ApprovalSteps approvalSteps={mergedTask.approvalSteps} />
                }
                align={ALIGN_OPTIONS.CENTER}
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              {Settings.fields.task.customFields &&
                Object.entries(Settings.fields.task.customFields).map(
                  ([fieldName, fieldConfig]: [string, object]) => (
                    <MergeField
                      key={fieldName}
                      label={fieldConfig.label || fieldName}
                      value={mapReadonlyCustomFieldToComp({
                        fieldConfig,
                        parentFieldName: DEFAULT_CUSTOM_FIELDS_PARENT,
                        key: fieldName,
                        values: mergedTask,
                        hideLabel: true
                      })}
                      align={ALIGN_OPTIONS.CENTER}
                      fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                      mergeState={mergeState}
                      dispatchMergeActions={dispatchMergeActions}
                    />
                  )
                )}
            </fieldset>
          )}
        </Col>
        <Col md={4} id="right-merge-task-col">
          <TaskColumn
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
            align={ALIGN_OPTIONS.RIGHT}
            label={`${taskShortLabel} 2`}
          />
        </Col>
      </Row>
      <Row>
        <Button
          style={{ width: "98%", margin: "16px 1%" }}
          intent="primary"
          onClick={() => {
            setIsDirty(false)
            mergeTasks()
          }}
          disabled={mergeState.notAllSet()}
        >
          {`Merge ${pluralize(taskShortLabel)}`}
        </Button>
      </Row>
    </Container>
  )

  function mergeTasks() {
    const loser = mergedTask.uuid === task1.uuid ? task2 : task1
    mergedTask.customFields = customFieldsJSONString(mergedTask)
    const winnerTask = Task.filterClientSideFields(mergedTask)
    API.mutation(GQL_MERGE_TASK, {
      loserUuid: loser.uuid,
      winnerTask
    })
      .then(res => {
        if (res) {
          navigate(Task.pathFor({ uuid: mergedTask.uuid }), {
            state: {
              success: `${pluralize(taskShortLabel)} merged. Displaying merged ${taskShortLabel} below.`
            }
          })
        }
      })
      .catch(error => {
        setSaveError(error)
        setIsDirty(true)
        jumpToTop()
      })
  }
}

const MidColTitle = styled.div`
  display: flex;
  height: 39px;
  margin-top: 19px;
  border-bottom: 1px solid #cccccc;
  border-top: 1px solid #cccccc;
  justify-content: space-between;
  align-items: center;
`

const ColTitle = styled(Form.Group)`
  height: 39px;
`

const tasksFilters = {
  allTasks: {
    label: "All"
  }
}

const taskShortLabel = Settings.fields.task.shortLabel

interface TaskColumnProps {
  align: "left" | "right"
  label: string
  disabled?: boolean
  mergeState?: any
  dispatchMergeActions?: (...args: unknown[]) => unknown
}

const TaskColumn = ({
  align,
  label,
  disabled,
  mergeState,
  dispatchMergeActions
}: TaskColumnProps) => {
  const task = mergeState[align]
  const otherSide = mergeState[getOtherSide(align)]
  const idForTask = label.replace(/\s+/g, "")

  return (
    <TaskCol>
      <label htmlFor={idForTask} style={{ textAlign: align }}>
        {label}
      </label>
      <ColTitle controlId={idForTask}>
        <AdvancedSingleSelect
          fieldName="task"
          placeholder={`Select an ${taskShortLabel.toLowerCase()} to merge`}
          value={task}
          disabledValue={otherSide}
          overlayColumns={[taskShortLabel]}
          overlayRenderRow={TaskOverlayRow}
          filterDefs={tasksFilters}
          onChange={value => {
            value?.fixupFields()
            dispatchMergeActions(setMergeable(value, align))
          }}
          objectType={Task}
          valueKey="shortName"
          fields={ALL_TASK_FIELDS}
          addon={TASKS_ICON}
          disabled={disabled}
          showRemoveButton={!disabled}
        />
      </ColTitle>
      {areAllSet(task) && (
        <fieldset>
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.task.shortName}
            fieldName="shortName"
            value={task.shortName}
            align={align}
            action={() => {
              dispatchMergeActions(setAMergedField("uuid", task.uuid, align))
              dispatchMergeActions(
                setAMergedField("shortName", task.shortName, align)
              )
            }}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.task.longName}
            fieldName="longName"
            value={task.longName}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("longName", task.longName, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.task.parentTask}
            fieldName="parentTask"
            value={
              <BreadcrumbTrail
                modelType="Task"
                leaf={task.parentTask}
                ascendantObjects={task.ascendantTasks}
                parentField="parentTask"
              />
            }
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("parentTask", task.parentTask, align)
              )
              dispatchMergeActions(
                setAMergedField("ascendantTasks", task.ascendantTasks, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.task.description}
            fieldName="description"
            value={<RichTextEditor readOnly value={task.description} />}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("description", task.description, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.task.status}
            fieldName="status"
            value={task.status}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("status", task.status, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.task.selectable}
            fieldName="selectable"
            value={utils.formatBoolean(task.selectable)}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("selectable", task.selectable, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.task.plannedCompletion}
            fieldName="plannedCompletion"
            value={moment(task.plannedCompletion).format(
              Settings.dateFormats.forms.displayShort.date
            )}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField(
                  "plannedCompletion",
                  task.plannedCompletion,
                  align
                )
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.task.projectedCompletion}
            fieldName="projectedCompletion"
            value={moment(task.projectedCompletion).format(
              Settings.dateFormats.forms.displayShort.date
            )}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField(
                  "projectedCompletion",
                  task.projectedCompletion,
                  align
                )
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.task.responsiblePositions}
            fieldName="responsiblePositions"
            value={
              <PositionTable
                label={utils.sentenceCase(
                  Settings.fields.task.responsiblePositions.label
                )}
                positions={task.responsiblePositions || []}
                showTask={false}
                showStatus={false}
              />
            }
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField(
                  "responsiblePositions",
                  task.responsiblePositions,
                  align
                )
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <MergeField
            label="Planning Approval Steps"
            fieldName="planningApprovalSteps"
            value={<ApprovalSteps approvalSteps={task.planningApprovalSteps} />}
            align={align}
            action={() =>
              dispatchMergeActions(
                setAMergedField(
                  "planningApprovalSteps",
                  task.planningApprovalSteps,
                  align
                )
              )
            }
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <MergeField
            label="Approval Steps"
            fieldName="approvalSteps"
            value={<ApprovalSteps approvalSteps={task.approvalSteps} />}
            align={align}
            action={() =>
              dispatchMergeActions(
                setAMergedField("approvalSteps", task.approvalSteps, align)
              )
            }
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          {Settings.fields.task.customFields &&
            Object.entries(Settings.fields.task.customFields).map(
              ([fieldName, fieldConfig]: [string, object]) => (
                <MergeField
                  key={fieldName}
                  fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                  label={fieldConfig.label || fieldName}
                  value={mapReadonlyCustomFieldToComp({
                    fieldConfig,
                    parentFieldName: DEFAULT_CUSTOM_FIELDS_PARENT,
                    key: fieldName,
                    values: task,
                    hideLabel: true
                  })}
                  align={align}
                  action={() =>
                    dispatchMergeActions(
                      setAMergedField(
                        `${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`,
                        task?.[DEFAULT_CUSTOM_FIELDS_PARENT]?.[fieldName],
                        align
                      )
                    )
                  }
                  mergeState={mergeState}
                  autoMerge
                  dispatchMergeActions={dispatchMergeActions}
                />
              )
            )}
        </fieldset>
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

export default connect(null, mapPageDispatchersToProps)(MergeTasks)
