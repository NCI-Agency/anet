import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
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
import { AuthorizationGroup, Person } from "models"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"

const GQL_GET_AUTHORIZATION_GROUP = gql`
  query($uuid: String) {
    authorizationGroup(uuid: $uuid) {
      uuid
      name
      description
      positions {
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
      status
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const BaseAuthorizationGroupShow = ({ pageDispatchers, currentUser }) => {
  const { uuid } = useParams()
  const routerLocation = useLocation()
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_AUTHORIZATION_GROUP,
    { uuid }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "AuthorizationGroup",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const authorizationGroup = new AuthorizationGroup(
    data ? data.authorizationGroup : {}
  )
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const stateError = routerLocation.state && routerLocation.state.error
  const canEdit = currentUser.isSuperUser()

  return (
    <Formik enableReinitialize initialValues={authorizationGroup}>
      {({ values }) => {
        const action = canEdit && (
          <LinkTo authorizationGroup={authorizationGroup} edit button="primary">
            Edit
          </LinkTo>
        )
        return (
          <div>
            <RelatedObjectNotes
              notes={authorizationGroup.notes}
              relatedObject={
                authorizationGroup.uuid && {
                  relatedObjectType: "authorizationGroups",
                  relatedObjectUuid: authorizationGroup.uuid
                }
              }
            />
            <Messages success={stateSuccess} error={stateError} />
            <Form className="form-horizontal" method="post">
              <Fieldset
                title={`Authorization Group ${authorizationGroup.name}`}
                action={action}
              />
              <Fieldset>
                <Field
                  name="name"
                  component={FieldHelper.renderReadonlyField}
                />

                <Field
                  name="status"
                  component={FieldHelper.renderReadonlyField}
                  humanValue={AuthorizationGroup.humanNameOfStatus}
                />
              </Fieldset>

              <Fieldset title="Positions">
                <PositionTable
                  queryParams={{
                    pageSize: 10,
                    authorizationGroupUuid: uuid
                  }}
                />
              </Fieldset>

              <Fieldset title="Reports">
                <ReportCollection
                  paginationKey={`r_${uuid}`}
                  queryParams={{
                    authorizationGroupUuid: uuid
                  }}
                  mapId="reports"
                />
              </Fieldset>
            </Form>
          </div>
        )
      }}
    </Formik>
  )
}

BaseAuthorizationGroupShow.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  currentUser: PropTypes.instanceOf(Person)
}

const AuthorizationGroupShow = props => (
  <AppContext.Consumer>
    {context => (
      <BaseAuthorizationGroupShow
        currentUser={context.currentUser}
        {...props}
      />
    )}
  </AppContext.Consumer>
)

export default connect(null, mapPageDispatchersToProps)(AuthorizationGroupShow)
