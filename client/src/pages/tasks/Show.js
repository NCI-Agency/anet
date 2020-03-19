import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import { Button } from "react-bootstrap"
import AddAssessmentModal from "components/assessments/AddAssessmentModal"
import AggregationWidget from "components/AggregationWidgets"
import Approvals from "components/approvals/Approvals"
import AppContext from "components/AppContext"
import { ReadonlyCustomFields } from "components/CustomFields"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"

import PositionTable from "components/PositionTable"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import ReportCollection from "components/ReportCollection"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Person, Report, Task } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
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
      ${GRAPHQL_NOTES_FIELDS},
      publishedReports: reports(query: {
        pageSize:0,
        state: [${Report.STATE.PUBLISHED}],
        taskUuid: $uuid
      }) {
        uuid
      }
    }
  }
`

const BaseTaskShow = ({ pageDispatchers, currentUser }) => {
  const { uuid } = useParams()
  const routerLocation = useLocation()
  const { loading, error, data, refetch } = API.useApiQuery(GQL_GET_TASK, {
    uuid
  })

  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Task",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  if (data) {
    data.task.formCustomFields = JSON.parse(data.task.customFields)
    data.task.notes.forEach(note => (note.customFields = JSON.parse(note.text)))
  }
  let task = new Task(data ? data.task : {})
  if (done) {
    return result
  }
  const isTopLevelTask = _isEmpty(task.customFieldRef1)
  const fieldSettings = isTopLevelTask
    ? Settings.fields.task.topLevel
    : Settings.fields.task.subLevel
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

  const taskAssessmentDef = JSON.parse(
    JSON.parse(task.customFields || "{}").assessmentDefinition || "{}"
  )

  const ongoingPeriod = {
    start: moment().startOf("month"),
    end: moment().endOf("month")
  }
  const assessmentPeriod = {
    start: moment()
      .subtract(1, "months")
      .startOf("month"),
    end: moment()
      .subtract(1, "months")
      .endOf("month")
  }
  const previousAssessmentPeriod = {
    start: moment()
      .subtract(2, "months")
      .startOf("month"),
    end: moment()
      .subtract(2, "months")
      .endOf("month")
  }
  const ongoingResultsWidgets = []
  const assessmentResultsWidgets = []
  const previousAssessmentResultsWidgets = []
  Object.keys(taskAssessmentDef).forEach(key => {
    const aggWidgetProps = {
      label: taskAssessmentDef[key].label,
      widget:
        taskAssessmentDef[key].aggregation?.widget ||
        taskAssessmentDef[key].widget,
      aggregationType: taskAssessmentDef[key].aggregation?.aggregationType
    }
    ongoingResultsWidgets.push(
      <AggregationWidget
        key={`ongoing-${key}`}
        values={task.getAssessmentResults(ongoingPeriod)[key]}
        {...aggWidgetProps}
      />
    )
    assessmentResultsWidgets.push(
      <AggregationWidget
        key={`assessment-${key}`}
        values={task.getAssessmentResults(assessmentPeriod)[key]}
        {...aggWidgetProps}
      />
    )
    previousAssessmentResultsWidgets.push(
      <AggregationWidget
        key={`previousAssessment-${key}`}
        values={task.getAssessmentResults(previousAssessmentPeriod)[key]}
        {...aggWidgetProps}
      />
    )
  })

  // Set initial task.assessments (contains assessments made directly on the task)
  task = Object.assign(task, task.getAssessments())

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
                  relatedObjectType: "tasks",
                  relatedObjectUuid: task.uuid
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
                  {Settings.fields.task.customFieldRef1 && (
                    <TaskCustomFieldRef1
                      dictProps={Settings.fields.task.customFieldRef1}
                      name="customFieldRef1"
                      component={FieldHelper.ReadonlyField}
                      humanValue={
                        task.customFieldRef1 && (
                          <LinkTo modelType="Task" model={task.customFieldRef1}>
                            {task.customFieldRef1.shortName}{" "}
                            {task.customFieldRef1.longName}
                          </LinkTo>
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

                {ongoingResultsWidgets && (
                  <Fieldset
                    style={{ flex: "1 1 0" }}
                    title={`Ongoing activity for ${ongoingPeriod.start.format(
                      "MMM-YYYY"
                    )}`}
                    id="ongoing-task-assessments-results"
                    width={0}
                  >
                    {ongoingResultsWidgets}
                  </Fieldset>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "nowrap",
                  padding: "10px"
                }}
              >
                {previousAssessmentResultsWidgets && (
                  <Fieldset
                    title={`Previous assessments results for ${previousAssessmentPeriod.start.format(
                      "MMM-YYYY"
                    )}`}
                    id="previous-task-assessments-results"
                  >
                    {previousAssessmentResultsWidgets}
                  </Fieldset>
                )}

                {assessmentResultsWidgets && (
                  <Fieldset
                    title={`Assessments results for ${assessmentPeriod.start.format(
                      "MMM-YYYY"
                    )}`}
                    id="task-assessments-results"
                  >
                    {assessmentResultsWidgets}

                    {Object.keys(values.assessments).map(assessmentUuid => (
                      <ReadonlyCustomFields
                        key={`assessment-${assessmentUuid}`}
                        fieldNamePrefix={`assessments.${assessmentUuid}`}
                        fieldsConfig={fieldSettings.assessment?.customFields}
                        formikProps={{
                          values
                        }}
                      />
                    ))}

                    {canEdit && fieldSettings.assessment && (
                      <>
                        <Button
                          bsStyle="primary"
                          onClick={() => setShowAssessmentModal(true)}
                        >
                          Add new monthly assessment for{" "}
                          {assessmentPeriod.start.format("MMM-YYYY")}
                        </Button>
                        <AddAssessmentModal
                          task={task}
                          assessmentPeriod={assessmentPeriod}
                          showModal={showAssessmentModal}
                          onCancel={() => hideAddAssessmentModal(false)}
                          onSuccess={() => hideAddAssessmentModal(true)}
                        />
                      </>
                    )}
                  </Fieldset>
                )}
              </div>
              {false && // TODO: Do not show task custom fields until we implement a better widget
                Settings.fields.task.customFields && (
                  <Fieldset
                    title={`${fieldSettings.shortLabel} information`}
                    id="custom-fields"
                  >
                    <ReadonlyCustomFields
                      fieldsConfig={Settings.fields.task.customFields}
                      formikProps={{
                        values
                      }}
                    />
                  </Fieldset>
              )}
            </Form>

            <Fieldset title="Responsible positions">
              <PositionTable positions={task.responsiblePositions} />
            </Fieldset>

            <Approvals relatedObject={task} />

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
  function hideAddAssessmentModal(success) {
    setShowAssessmentModal(false)
    if (success) {
      refetch()
    }
  }
}

BaseTaskShow.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  currentUser: PropTypes.instanceOf(Person)
}

const TaskShow = props => (
  <AppContext.Consumer>
    {context => <BaseTaskShow currentUser={context.currentUser} {...props} />}
  </AppContext.Consumer>
)

export default connect(null, mapPageDispatchersToProps)(TaskShow)
