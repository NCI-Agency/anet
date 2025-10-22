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
import Model, {
  GRAPHQL_ASSESSMENTS_FIELDS,
  GRAPHQL_ENTITY_AVATAR_FIELDS,
  GRAPHQL_NOTES_FIELDS
} from "components/Model"
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
      uuid
      shortName
      longName
      selectable
      description
      status
      isSubscribed
      updatedAt
      plannedCompletion
      projectedCompletion
      taskedOrganizations {
        uuid
        shortName
        longName
        identificationCode
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
      parentTask {
        uuid
        shortName
        parentTask {
          uuid
        }
      }
      ascendantTasks {
        uuid
        shortName
        parentTask {
          uuid
        }
      }
      childrenTasks {
        uuid
        shortName
      }
      descendantTasks {
        uuid
        shortName
        selectable
        parentTask {
          uuid
          shortName
        }
        ascendantTasks {
          uuid
          shortName
          parentTask {
            uuid
          }
        }
        customFields
        ${GRAPHQL_ASSESSMENTS_FIELDS}
        ${GRAPHQL_NOTES_FIELDS}
      }
      responsiblePositions {
        uuid
        name
        code
        type
        role
        status
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        location {
          uuid
          name
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        organization {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        person {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
        }
      }
      customFields
      ${GRAPHQL_ASSESSMENTS_FIELDS}
      ${GRAPHQL_NOTES_FIELDS}
    }

    eventSeriesList(query: { eventTaskUuid: [$uuid], pageSize: 0 }) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        status
        description
        ownerOrg {
          uuid
          shortName
        }
        hostOrg {
          uuid
          shortName
        }
        adminOrg {
          uuid
          shortName
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
