import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import Approvals from "components/approvals/Approvals"
import AssessmentResultsContainer from "components/assessments/AssessmentResultsContainer"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import { ReadonlyCustomFields } from "components/CustomFields"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model from "components/Model"
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
import DictionaryField from "HOC/DictionaryField"
import _isEmpty from "lodash/isEmpty"
import { Task } from "models"
import moment from "moment"
import React, { useContext, useState } from "react"
import { ListGroup, ListGroupItem } from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
import Settings from "settings"

const GQL_GET_TASK = gql`
  query($uuid: String!) {
    task(uuid: $uuid) {
      uuid
      shortName
      longName
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
        }
        person {
          uuid
          name
          rank
          avatarUuid
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
            avatarUuid
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
            avatarUuid
          }
        }
      }
      customFields
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const TaskShow = ({ pageDispatchers }) => {
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

  const fieldSettings = task.fieldSettings()
  const DictField = DictionaryField(Field)

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
        const action = (
          <>
            {canEdit && (
              <LinkTo modelType="Task" model={task} edit button="primary">
                Edit
              </LinkTo>
            )}
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
                    {fieldSettings.shortLabel} {task.shortName}
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
                  <DictField
                    dictProps={fieldSettings.longName}
                    name="longName"
                    component={FieldHelper.ReadonlyField}
                  />
                  <DictField
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
                    <DictField
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
                      <DictField
                        dictProps={Settings.fields.task.childrenTasks}
                        name="subEfforts"
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
                    <DictField
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
                    <DictField
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
                  <DictField
                    dictProps={Settings.fields.task.status}
                    name="status"
                    component={FieldHelper.ReadonlyField}
                    humanValue={Task.humanNameOfStatus}
                  />
                  <DictField
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
                title={`${fieldSettings.shortLabel} information`}
                id="custom-fields"
              >
                <ReadonlyCustomFields
                  fieldsConfig={Settings.fields.task.customFields}
                  values={values}
                />
              </Fieldset>
            )}

            <Fieldset title={Settings.fields.task.responsiblePositions?.label}>
              <PositionTable positions={task.responsiblePositions} />
            </Fieldset>

            <Approvals
              restrictedApprovalLabel="Restrict to approvers descending from the same tasked organization as the report's primary advisor"
              relatedObject={task}
            />

            <Fieldset title={`Reports for this ${fieldSettings.shortLabel}`}>
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

TaskShow.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(TaskShow)
