import {
  gqlAllTaskFields,
  gqlApprovalStepFields,
  gqlAssessmentsFields,
  gqlEntityFieldsMap,
  gqlNotesFields,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import Approvals from "components/approvals/Approvals"
import AssessmentResultsContainer from "components/assessments/AssessmentResultsContainer"
import {
  BreadcrumbTrail,
  getBreadcrumbTrailAsText
} from "components/BreadcrumbTrail"
import { ReadonlyCustomFields } from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import EventCollection from "components/EventCollection"
import EventMatrix from "components/EventMatrix"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import FindObjectsButton from "components/FindObjectsButton"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model from "components/Model"
import ObjectHistory from "components/ObjectHistory"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import PositionTable from "components/PositionTable"
import RelatedObjectNotes from "components/RelatedObjectNotes"
import ReportCollection from "components/ReportCollection"
import RichTextEditor from "components/RichTextEditor"
import _isEmpty from "lodash/isEmpty"
import { Task } from "models"
import moment from "moment"
import React, { useContext, useState } from "react"
import { ListGroup, ListGroupItem } from "react-bootstrap"
import { connect } from "react-redux"
import { Link, useLocation, useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"

const GQL_GET_TASK = gql`
  query($uuid: String!) {
    task(uuid: $uuid) {
      ${gqlAllTaskFields}
      taskedOrganizations {
        ${gqlEntityFieldsMap.Organization}
      }
      parentTask {
        ${gqlEntityFieldsMap.Task}
        parentTask {
          ${gqlEntityFieldsMap.Task}
        }
      }
      ascendantTasks {
        ${gqlEntityFieldsMap.Task}
        parentTask {
          ${gqlEntityFieldsMap.Task}
        }
      }
      childrenTasks {
        ${gqlEntityFieldsMap.Task}
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
        ${gqlAssessmentsFields}
      }
      responsiblePositions {
        ${gqlEntityFieldsMap.Position}
        location {
          ${gqlEntityFieldsMap.Location}
        }
        organization {
          ${gqlEntityFieldsMap.Organization}
        }
        person {
          ${gqlEntityFieldsMap.Person}
        }
      }
      planningApprovalSteps {
        ${gqlApprovalStepFields}
      }
      approvalSteps {
        ${gqlApprovalStepFields}
     }
      ${gqlAssessmentsFields}
      ${gqlNotesFields}
    }

    eventSeriesList(query: { eventTaskUuid: [$uuid], pageSize: 0 }) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.EventSeries}
        ownerOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        hostOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        adminOrg {
          ${gqlEntityFieldsMap.Organization}
        }
      }
    }
  }
`

interface TaskShowProps {
  pageDispatchers?: PageDispatchersPropType
}

const TaskShow = ({ pageDispatchers }: TaskShowProps) => {
  const { currentUser, loadAppData } = useContext(AppContext)
  const { uuid } = useParams()
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const [stateError, setStateError] = useState(
    routerLocation.state && routerLocation.state.error
  )
  const { loading, error, data, refetch } = API.useApiQuery(GQL_GET_TASK, {
    uuid
  })

  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Task",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(data?.task?.shortName)

  if (done) {
    return result
  }

  if (data) {
    Model.populateCustomFields(data.task)
  }
  const task = new Task(data ? data.task : {})
  const eventSeries = data?.eventSeriesList?.list || []

  Model.populateEntitiesAssessmentsCustomFields(task.descendantTasks)

  // Top-level tasks and sub-tasks have different assessment definitions!
  const subTasks = _isEmpty(task.parentTask)
    ? []
    : task.descendantTasks?.map(task => new Task(task))

  // Admins can edit tasks or users in positions related to the task
  const isAdmin = currentUser && currentUser.isAdmin()
  const isResponsibleForTask = currentUser?.isResponsibleForTask(task)
  const canAddPeriodicAssessment = isResponsibleForTask
  const canAddOndemandAssessment = isAdmin

  const searchText = [task.shortName, task.longName].join(" ")
  const action = (
    <>
      {isAdmin && (
        <Link
          id="mergeWithOther"
          to="/admin/merge/tasks"
          state={{ initialLeftUuid: task.uuid }}
          className="btn btn-outline-secondary"
        >
          {`Merge with other ${Settings.fields.task.shortLabel.toLowerCase()}`}
        </Link>
      )}
      {isResponsibleForTask && (
        <LinkTo
          modelType="Task"
          model={Task.pathForNew({
            parentTaskUuid: task.uuid
          })}
          button
        >
          {`Create sub-${Settings.fields.task.shortLabel.toLowerCase()}`}
        </LinkTo>
      )}
      {isResponsibleForTask && (
        <LinkTo
          modelType="Task"
          model={task}
          edit
          button="primary"
          id="editButton"
        >
          Edit
        </LinkTo>
      )}
      <FindObjectsButton
        objectLabel={`${Settings.fields.task.shortLabel}`}
        searchText={searchText}
      />
      <RelatedObjectNotes
        notes={task.notes}
        relatedObject={
          task.uuid && {
            relatedObjectType: Task.relatedObjectType,
            relatedObjectUuid: task.uuid,
            relatedObject: task
          }
        }
      />
      <ObjectHistory objectUuid={task.uuid} />
    </>
  )

  return (
    <div>
      <Messages success={stateSuccess} error={stateError} />
      <div className="form-horizontal">
        <Fieldset
          title={
            <>
              {
                <SubscriptionIcon
                  subscribedObjectType="tasks"
                  subscribedObjectUuid={task.uuid}
                  isSubscribed={task.isSubscribed}
                  updatedAt={task.updatedAt}
                  refetch={refetch}
                  setError={error => {
                    setStateError(error)
                    jumpToTop()
                  }}
                  persistent
                />
              }{" "}
              {Settings.fields.task.shortLabel} {task.shortName}
            </>
          }
          action={action}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            padding: "10px"
          }}
        >
          <Fieldset style={{ flex: "1 1 0" }}>
            <DictionaryField
              wrappedComponent={FieldHelper.ReadonlyField}
              dictProps={Settings.fields.task.longName}
              field={{ name: "longName", value: task.longName }}
            />
            <DictionaryField
              wrappedComponent={FieldHelper.ReadonlyField}
              dictProps={Settings.fields.task.taskedOrganizations}
              field={{ name: "taskedOrganizations" }}
              humanValue={
                task.taskedOrganizations && (
                  <>
                    {task.taskedOrganizations.map(org => (
                      <LinkTo
                        modelType="Organization"
                        model={org}
                        key={`${org.uuid}`}
                      />
                    ))}
                  </>
                )
              }
            />
            {Settings.fields.task.parentTask && task.parentTask?.uuid && (
              <DictionaryField
                wrappedComponent={FieldHelper.ReadonlyField}
                dictProps={Settings.fields.task.parentTask}
                field={{ name: "parentTask" }}
                humanValue={
                  task.parentTask && (
                    <BreadcrumbTrail
                      modelType="Task"
                      leaf={task.parentTask}
                      ascendantObjects={task.ascendantTasks}
                      parentField="parentTask"
                    />
                  )
                }
              />
            )}
            {Settings.fields.task.childrenTasks &&
              task.childrenTasks?.length > 0 && (
                <DictionaryField
                  wrappedComponent={FieldHelper.ReadonlyField}
                  dictProps={Settings.fields.task.childrenTasks}
                  field={{ name: "subTasks" }}
                  humanValue={
                    <ListGroup>
                      {task.childrenTasks?.map(task => (
                        <ListGroupItem key={task.uuid}>
                          <LinkTo
                            showIcon={false}
                            modelType="Task"
                            model={task}
                          />
                        </ListGroupItem>
                      ))}
                    </ListGroup>
                  }
                />
              )}
            {Settings.fields.task.plannedCompletion && (
              <DictionaryField
                wrappedComponent={FieldHelper.ReadonlyField}
                dictProps={Settings.fields.task.plannedCompletion}
                field={{ name: "plannedCompletion" }}
                humanValue={
                  task.plannedCompletion &&
                  moment(task.plannedCompletion).format(
                    Settings.dateFormats.forms.displayShort.date
                  )
                }
              />
            )}
            {Settings.fields.task.projectedCompletion && (
              <DictionaryField
                wrappedComponent={FieldHelper.ReadonlyField}
                dictProps={Settings.fields.task.projectedCompletion}
                field={{ name: "projectedCompletion" }}
                humanValue={
                  task.projectedCompletion &&
                  moment(task.projectedCompletion).format(
                    Settings.dateFormats.forms.displayShort.date
                  )
                }
              />
            )}
            <DictionaryField
              wrappedComponent={FieldHelper.ReadonlyField}
              dictProps={Settings.fields.task.status}
              field={{ name: "status" }}
              humanValue={Task.humanNameOfStatus(task.status)}
            />
            <DictionaryField
              wrappedComponent={FieldHelper.ReadonlyField}
              dictProps={Settings.fields.task.selectable}
              field={{ name: "selectable" }}
              humanValue={utils.formatBoolean(task.selectable)}
            />
            <DictionaryField
              wrappedComponent={FieldHelper.ReadonlyField}
              dictProps={Settings.fields.task.description}
              field={{ name: "description" }}
              humanValue={<RichTextEditor readOnly value={task.description} />}
            />
          </Fieldset>
        </div>
      </div>

      {Settings.fields.task.customFields && (
        <Fieldset
          title={`${Settings.fields.task.shortLabel} information`}
          id="custom-fields"
        >
          <ReadonlyCustomFields
            fieldsConfig={Settings.fields.task.customFields}
            values={task}
          />
        </Fieldset>
      )}

      <Fieldset title={Settings.fields.task.responsiblePositions?.label}>
        <PositionTable positions={task.responsiblePositions} showLocation />
      </Fieldset>

      <Approvals
        restrictedApprovalLabel="Restrict to approvers descending from the same tasked organization as the report's primary advisor"
        relatedObject={task}
        objectType="Task"
        canEdit={isResponsibleForTask}
        refetch={refetch}
      />

      <Fieldset
        id="events"
        title={`Events for ${getBreadcrumbTrailAsText(task, task?.ascendantTasks, "parentTask", "shortName")}`}
      >
        <EventCollection
          queryParams={{ taskUuid: task?.uuid }}
          mapId="events"
          showEventSeries
        />
      </Fieldset>

      {(task?.uuid || !!eventSeries.length) && (
        <Fieldset
          id="syncMatrix"
          title={`Sync Matrix for ${getBreadcrumbTrailAsText(task, task?.ascendantTasks, "parentTask", "shortName")}`}
        >
          <EventMatrix taskUuid={task?.uuid} eventSeries={eventSeries} />
        </Fieldset>
      )}

      <Fieldset title={`Reports for this ${Settings.fields.task.shortLabel}`}>
        <ReportCollection
          paginationKey={`r_${uuid}`}
          queryParams={{
            taskUuid: uuid
          }}
          mapId="reports"
        />
      </Fieldset>

      <AssessmentResultsContainer
        entity={task}
        entityType={Task}
        subEntities={subTasks}
        canAddPeriodicAssessment={canAddPeriodicAssessment}
        canAddOndemandAssessment={canAddOndemandAssessment}
        onUpdateAssessment={() => {
          loadAppData()
          refetch()
        }}
      />
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(TaskShow)
