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
import Model, { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import PositionTable from "components/PositionTable"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import ReportCollection from "components/ReportCollection"
import RichTextEditor from "components/RichTextEditor"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Task } from "models"
import moment from "moment"
import React, { useContext, useState } from "react"
import { ListGroup, ListGroupItem } from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
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
        ${GRAPHQL_NOTES_FIELDS}
      }
      responsiblePositions {
        uuid
        name
        code
        type
        role
        status
        location {
          uuid
          name
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
      ${GRAPHQL_NOTES_FIELDS}
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

  Model.populateEntitiesNotesCustomFields(task.descendantTasks)

  // Top-level tasks and sub-tasks have different assessment definitions!
  const subTasks = _isEmpty(task.parentTask)
    ? []
    : task.descendantTasks?.map(task => new Task(task))

  // Admins can edit tasks or users in positions related to the task
  const isAdmin = currentUser && currentUser.isAdmin()
  const canEdit =
    isAdmin ||
    (currentUser.position &&
      !_isEmpty(
        task.responsiblePositions.filter(
          position => currentUser.position.uuid === position.uuid
        )
      ))
  const canAddPeriodicAssessment = canEdit
  const canAddOndemandAssessment = isAdmin
  return (
    <Formik enableReinitialize initialValues={task}>
      {({ values }) => {
        const searchText = [task.shortName, task.longName].join(" ")
        const action = (
          <>
            {canEdit && (
              <LinkTo modelType="Task" model={task} edit button="primary">
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
            <Form className="form-horizontal" method="post">
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
                    wrappedComponent={Field}
                    dictProps={Settings.fields.task.longName}
                    name="longName"
                    component={FieldHelper.ReadonlyField}
                  />
                  <DictionaryField
                    wrappedComponent={Field}
                    dictProps={Settings.fields.task.taskedOrganizations}
                    name="taskedOrganizations"
                    component={FieldHelper.ReadonlyField}
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
                      wrappedComponent={Field}
                      dictProps={Settings.fields.task.parentTask}
                      name="parentTask"
                      component={FieldHelper.ReadonlyField}
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
                        wrappedComponent={Field}
                        dictProps={Settings.fields.task.childrenTasks}
                        name="subTasks"
                        component={FieldHelper.ReadonlyField}
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
                      wrappedComponent={Field}
                      dictProps={Settings.fields.task.plannedCompletion}
                      name="plannedCompletion"
                      component={FieldHelper.ReadonlyField}
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
                      wrappedComponent={Field}
                      dictProps={Settings.fields.task.projectedCompletion}
                      name="projectedCompletion"
                      component={FieldHelper.ReadonlyField}
                      humanValue={
                        task.projectedCompletion &&
                        moment(task.projectedCompletion).format(
                          Settings.dateFormats.forms.displayShort.date
                        )
                      }
                    />
                  )}
                  <DictionaryField
                    wrappedComponent={Field}
                    dictProps={Settings.fields.task.status}
                    name="status"
                    component={FieldHelper.ReadonlyField}
                    humanValue={Task.humanNameOfStatus}
                  />
                  <DictionaryField
                    wrappedComponent={Field}
                    dictProps={Settings.fields.task.selectable}
                    name="selectable"
                    component={FieldHelper.ReadonlyField}
                    humanValue={utils.formatBoolean}
                  />
                  <DictionaryField
                    wrappedComponent={Field}
                    dictProps={Settings.fields.task.description}
                    name="description"
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      <RichTextEditor readOnly value={values.description} />
                    }
                  />
                </Fieldset>
              </div>
            </Form>

            {Settings.fields.task.customFields && (
              <Fieldset
                title={`${Settings.fields.task.shortLabel} information`}
                id="custom-fields"
              >
                <ReadonlyCustomFields
                  fieldsConfig={Settings.fields.task.customFields}
                  values={values}
                />
              </Fieldset>
            )}

            <Fieldset title={Settings.fields.task.responsiblePositions?.label}>
              <PositionTable
                positions={task.responsiblePositions}
                showLocation
              />
            </Fieldset>

            <Approvals
              restrictedApprovalLabel="Restrict to approvers descending from the same tasked organization as the report's primary advisor"
              relatedObject={task}
            />

            <Fieldset
              id="syncMatrix"
              title={`Sync Matrix for ${getBreadcrumbTrailAsText(task, task?.ascendantTasks, "parentTask", "shortName")}`}
            >
              <EventMatrix taskUuid={task?.uuid} />
            </Fieldset>

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

            <Fieldset
              title={`Reports for this ${Settings.fields.task.shortLabel}`}
            >
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
      }}
    </Formik>
  )
}

export default connect(null, mapPageDispatchersToProps)(TaskShow)
