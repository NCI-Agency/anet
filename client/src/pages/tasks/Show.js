import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import {
  getSubscriptionIcon,
  mapDispatchToProps,
  propTypes as pagePropTypes,
  toggleSubscriptionCommon,
  useBoilerplate
} from "components/Page"
import PositionTable from "components/PositionTable"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import ReportCollection from "components/ReportCollection"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Person, Task } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
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
      isSubscribed
      updatedAt
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

const BaseTaskShow = props => {
  const { uuid } = useParams()
  const routerLocation = useLocation()
  const { loading, error, data } = API.useApiQuery(GQL_GET_TASK, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Task",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    ...props
  })
  if (done) {
    return result
  }

  const task = new Task(data ? data.task : {})
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
  const { currentUser, ...myFormProps } = props

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
            <Messages success={stateSuccess} error={stateError} />
            <Form className="form-horizontal" method="post">
              <Fieldset
                title={
                  <>
                    {getSubscriptionIcon(task.isSubscribed, toggleSubscription)}{" "}
                    {Settings.fields.task.shortLabel} {task.shortName}
                  </>
                }
                action={action}
              />
              <Fieldset>
                <ShortNameField
                  dictProps={Settings.fields.task.shortName}
                  name="shortName"
                  component={FieldHelper.renderReadonlyField}
                />

                {/* Override componentClass and style from dictProps */}
                <LongNameField
                  dictProps={Settings.fields.task.longName}
                  componentClass="div"
                  style={{}}
                  name="longName"
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
                  <TaskCustomFieldRef1
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

                <TaskCustomField
                  dictProps={Settings.fields.task.customField}
                  name="customField"
                  component={FieldHelper.renderReadonlyField}
                />

                {Settings.fields.task.plannedCompletion && (
                  <PlannedCompletionField
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
                  <ProjectedCompletionField
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
                  <TaskCustomFieldEnum1
                    dictProps={Object.without(
                      Settings.fields.task.customFieldEnum1,
                      "enum"
                    )}
                    name="customFieldEnum1"
                    component={FieldHelper.renderReadonlyField}
                  />
                )}

                {Settings.fields.task.customFieldEnum2 && (
                  <TaskCustomFieldEnum2
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

  function toggleSubscription() {
    return toggleSubscriptionCommon(
      "tasks",
      task.uuid,
      task.isSubscribed,
      task.updatedAt
    ).then(data => {
      task.isSubscribed = !task.isSubscribed
    })
  }
}

BaseTaskShow.propTypes = {
  ...pagePropTypes,
  currentUser: PropTypes.instanceOf(Person)
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
