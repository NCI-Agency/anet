import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages, { setMessages } from "components/Messages"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import ReportCollectionContainer from "components/ReportCollectionContainer"
import { Field, Form, Formik } from "formik"
import { Person, Task } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import _isEmpty from "lodash/isEmpty"
import PositionTable from "components/PositionTable"
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
      responsibleOrg {
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
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

class BaseTaskShow extends Page {
  static propTypes = {
    ...pagePropTypes,
    currentUser: PropTypes.instanceOf(Person)
  }

  static modelName = "Task"

  ShortNameField = DictionaryField(Field)
  LongNameField = DictionaryField(Field)
  TaskCustomFieldRef1 = DictionaryField(Field)
  TaskCustomField = DictionaryField(Field)
  PlannedCompletionField = DictionaryField(Field)
  ProjectedCompletionField = DictionaryField(Field)
  TaskCustomFieldEnum1 = DictionaryField(Field)
  TaskCustomFieldEnum2 = DictionaryField(Field)

  state = {
    task: new Task(),
    success: null,
    error: null
  }

  constructor(props) {
    super(props)
    setMessages(props, this.state)
  }

  fetchData(props) {
    return API.query(GQL_GET_TASK, { uuid: props.match.params.uuid }).then(
      data => {
        this.setState({
          task: new Task(data.task)
        })
      }
    )
  }

  render() {
    const { task } = this.state
    const { currentUser, ...myFormProps } = this.props

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
      <Formik enableReinitialize initialValues={task} {...myFormProps}>
        {({ values }) => {
          const action = canEdit && (
            <LinkTo task={task} edit button="primary">
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
              <Messages success={this.state.success} error={this.state.error} />
              <Form className="form-horizontal" method="post">
                <Fieldset
                  title={`${Settings.fields.task.shortLabel} ${task.shortName}`}
                  action={action}
                />
                <Fieldset>
                  <this.ShortNameField
                    dictProps={Settings.fields.task.shortName}
                    name="shortName"
                    component={FieldHelper.renderReadonlyField}
                  />

                  {/* TODO: replace with a generic component, but do not use componentClass textarea */}
                  <Field
                    name="longName"
                    label={Settings.fields.task.longName.label}
                    component={FieldHelper.renderReadonlyField}
                  />

                  <Field
                    name="status"
                    component={FieldHelper.renderReadonlyField}
                    humanValue={Task.humanNameOfStatus}
                  />

                  <Field
                    name="responsibleOrg"
                    label={Settings.fields.task.responsibleOrg}
                    component={FieldHelper.renderReadonlyField}
                    humanValue={
                      task.responsibleOrg && (
                        <LinkTo organization={task.responsibleOrg}>
                          {task.responsibleOrg.shortName}
                        </LinkTo>
                      )
                    }
                  />

                  {Settings.fields.task.customFieldRef1 && (
                    <this.TaskCustomFieldRef1
                      dictProps={Settings.fields.task.customFieldRef1}
                      name="customFieldRef1"
                      component={FieldHelper.renderReadonlyField}
                      humanValue={
                        task.customFieldRef1 && (
                          <LinkTo task={task.customFieldRef1}>
                            {task.customFieldRef1.shortName}{" "}
                            {task.customFieldRef1.longName}
                          </LinkTo>
                        )
                      }
                    />
                  )}

                  <this.TaskCustomField
                    dictProps={Settings.fields.task.customField}
                    name="customField"
                    component={FieldHelper.renderReadonlyField}
                  />

                  {Settings.fields.task.plannedCompletion && (
                    <this.PlannedCompletionField
                      dictProps={Settings.fields.task.plannedCompletion}
                      name="plannedCompletion"
                      component={FieldHelper.renderReadonlyField}
                      humanValue={
                        task.plannedCompletion &&
                        moment(task.plannedCompletion).format(
                          Settings.dateFormats.forms.displayShort.date
                        )
                      }
                    />
                  )}

                  {Settings.fields.task.projectedCompletion && (
                    <this.ProjectedCompletionField
                      dictProps={Settings.fields.task.projectedCompletion}
                      name="projectedCompletion"
                      component={FieldHelper.renderReadonlyField}
                      humanValue={
                        task.projectedCompletion &&
                        moment(task.projectedCompletion).format(
                          Settings.dateFormats.forms.displayShort.date
                        )
                      }
                    />
                  )}

                  {Settings.fields.task.customFieldEnum1 && (
                    <this.TaskCustomFieldEnum1
                      dictProps={Object.without(
                        Settings.fields.task.customFieldEnum1,
                        "enum"
                      )}
                      name="customFieldEnum1"
                      component={FieldHelper.renderReadonlyField}
                    />
                  )}

                  {Settings.fields.task.customFieldEnum2 && (
                    <this.TaskCustomFieldEnum2
                      dictProps={Object.without(
                        Settings.fields.task.customFieldEnum2,
                        "enum"
                      )}
                      name="customFieldEnum2"
                      component={FieldHelper.renderReadonlyField}
                    />
                  )}
                </Fieldset>
              </Form>

              <Fieldset title="Responsible positions">
                <PositionTable positions={task.responsiblePositions} />
              </Fieldset>

              <Fieldset
                title={`Reports for this ${Settings.fields.task.shortLabel}`}
              >
                <ReportCollectionContainer
                  queryParams={{
                    taskUuid: this.props.match.params.uuid
                  }}
                  paginationKey={`r_${this.props.match.params.uuid}`}
                  mapId="reports"
                />
              </Fieldset>
            </div>
          )
        }}
      </Formik>
    )
  }
}

const TaskShow = props => (
  <AppContext.Consumer>
    {context => <BaseTaskShow currentUser={context.currentUser} {...props} />}
  </AppContext.Consumer>
)

export default connect(
  null,
  mapDispatchToProps
)(TaskShow)
