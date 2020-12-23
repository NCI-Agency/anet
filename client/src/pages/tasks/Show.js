import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import Approvals from "components/approvals/Approvals"
import AssessmentResultsContainer from "components/assessments/AssessmentResultsContainer"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import LinkToPreviewed from "components/LinkToPreviewed"
import Messages from "components/Messages"
import Model from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import PositionTable from "components/PositionTable"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import ReportCollection from "components/ReportCollection"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Task } from "models"
import moment from "moment"
import React, { useContext } from "react"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
import Settings from "settings"
import DictionaryField from "../../HOC/DictionaryField"

const GQL_GET_TASK = gql`
  query($uuid: String!) {
    task(uuid: $uuid) {
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
        location {
          uuid
          name
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
    }
    subTasks: taskList(query: {
      pageSize: 0
      customFieldRef1Uuid: [$uuid]
      customFieldRef1Recursively: true
    }) {
      list {
        uuid
        shortName
        longName
        customFieldRef1 {
          uuid
          shortName
        }
        customFields
        ${GRAPHQL_NOTES_FIELDS}
      }
    }
  }
`

const TaskShow = ({ pageDispatchers }) => {
  const { currentUser, loadAppData } = useContext(AppContext)
  const { uuid } = useParams()
  const routerLocation = useLocation()
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

  if (done) {
    return result
  }

  if (data) {
    Model.populateCustomFields(data.task)
  }
  const task = new Task(data ? data.task : {})

  data && Model.populateEntitiesNotesCustomFields(data.subTasks.list)

  const subTasks = data.subTasks.list.map(task => new Task(task))

  const fieldSettings = task.fieldSettings()
  const ShortNameField = DictionaryField(Field)
  const LongNameField = DictionaryField(Field)
  const TaskCustomFieldRef1 = DictionaryField(Field)
  const TaskCustomField = DictionaryField(Field)
  const PlannedCompletionField = DictionaryField(Field)
  const ProjectedCompletionField = DictionaryField(Field)
  const TaskCustomFieldEnum1 = DictionaryField(Field)
  const TaskCustomFieldEnum2 = DictionaryField(Field)

  const stateSuccess = routerLocation.state && routerLocation.state.success
  const stateError = routerLocation.state && routerLocation.state.error

  // Admins can edit tasks or users in positions related to the task
  const canEdit =
    currentUser.isAdmin() ||
    (currentUser.position &&
      !_isEmpty(
        task.responsiblePositions.filter(
          position => currentUser.position.uuid === position.uuid
        )
      ))
  return (
    <Formik enableReinitialize initialValues={task}>
      {({ values }) => {
        const action = canEdit && (
          <LinkTo modelType="Task" model={task} edit button="primary">
            Edit
          </LinkTo>
        )
        return (
          <div>
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
            <Messages success={stateSuccess} error={stateError} />
            <Form className="form-horizontal" method="post">
              <Fieldset
                title={`${fieldSettings.shortLabel} ${task.shortName}`}
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
                  <ShortNameField
                    dictProps={fieldSettings.shortName}
                    name="shortName"
                    component={FieldHelper.ReadonlyField}
                  />
                  {/* Override componentClass and style from dictProps */}
                  <LongNameField
                    dictProps={fieldSettings.longName}
                    componentClass="div"
                    style={{}}
                    name="longName"
                    component={FieldHelper.ReadonlyField}
                  />
                  <Field
                    name="status"
                    component={FieldHelper.ReadonlyField}
                    humanValue={Task.humanNameOfStatus}
                  />
                  <Field
                    name="taskedOrganizations"
                    label={Settings.fields.task.taskedOrganizations.label}
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      task.taskedOrganizations && (
                        <>
                          {task.taskedOrganizations.map(org => (
                            <LinkToPreviewed
                              modelType="Organization"
                              model={org}
                              key={`${org.uuid}`}
                              previewId="task-show-org"
                            />
                          ))}
                        </>
                      )
                    }
                  />
                  {Settings.fields.task.customFieldRef1 && (
                    <TaskCustomFieldRef1
                      dictProps={Settings.fields.task.customFieldRef1}
                      name="customFieldRef1"
                      component={FieldHelper.ReadonlyField}
                      humanValue={
                        task.customFieldRef1 && (
                          <LinkToPreviewed
                            modelType="Task"
                            model={task.customFieldRef1}
                            previewId="task-show-parent-task"
                          >
                            {task.customFieldRef1.shortName}{" "}
                            {task.customFieldRef1.longName}
                          </LinkToPreviewed>
                        )
                      }
                    />
                  )}
                  <TaskCustomField
                    dictProps={Settings.fields.task.customField}
                    name="customField"
                    component={FieldHelper.ReadonlyField}
                  />
                  {Settings.fields.task.plannedCompletion && (
                    <PlannedCompletionField
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
                    <ProjectedCompletionField
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
                  {Settings.fields.task.customFieldEnum1 && (
                    <TaskCustomFieldEnum1
                      dictProps={Object.without(
                        Settings.fields.task.customFieldEnum1,
                        "enum"
                      )}
                      name="customFieldEnum1"
                      component={FieldHelper.ReadonlyField}
                    />
                  )}
                  {Settings.fields.task.customFieldEnum2 && (
                    <TaskCustomFieldEnum2
                      dictProps={Object.without(
                        Settings.fields.task.customFieldEnum2,
                        "enum"
                      )}
                      name="customFieldEnum2"
                      component={FieldHelper.ReadonlyField}
                    />
                  )}
                </Fieldset>
              </div>
            </Form>

            <AssessmentResultsContainer
              entity={task}
              entityType={Task}
              subEntities={subTasks}
              canAddAssessment={canEdit}
              onUpdateAssessment={() => {
                loadAppData()
                refetch()
              }}
            />

            <Fieldset title="Responsible positions">
              <PositionTable
                positions={task.responsiblePositions}
                linkToComp={LinkToPreviewed}
              />
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
