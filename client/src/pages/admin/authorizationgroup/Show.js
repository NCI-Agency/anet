import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import LinkToPreviewed from "components/LinkToPreviewed"
import Messages from "components/Messages"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import PositionTable from "components/PositionTable"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import ReportCollection, {
  FORMAT_CALENDAR,
  FORMAT_MAP,
  FORMAT_STATISTICS,
  FORMAT_SUMMARY,
  FORMAT_TABLE
} from "components/ReportCollection"
import { Field, Form, Formik } from "formik"
import { AuthorizationGroup } from "models"
import React, { useContext } from "react"
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

const AuthorizationGroupShow = ({ pageDispatchers }) => {
  const { currentUser } = useContext(AppContext)
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
          <LinkTo
            modelType="AuthorizationGroup"
            model={authorizationGroup}
            edit
            button="primary"
          >
            Edit
          </LinkTo>
        )
        return (
          <div>
            <RelatedObjectNotes
              notes={authorizationGroup.notes}
              relatedObject={
                authorizationGroup.uuid && {
                  relatedObjectType: AuthorizationGroup.relatedObjectType,
                  relatedObjectUuid: authorizationGroup.uuid,
                  relatedObject: authorizationGroup
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
                <Field name="name" component={FieldHelper.ReadonlyField} />

                <Field
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={AuthorizationGroup.humanNameOfStatus}
                />
              </Fieldset>

              <Fieldset title="Positions">
                <PositionTable
                  queryParams={{
                    pageSize: 10,
                    authorizationGroupUuid: uuid
                  }}
                  linkToComp={LinkToPreviewed}
                />
              </Fieldset>

              <Fieldset title="Reports">
                <ReportCollection
                  paginationKey={`r_${uuid}`}
                  queryParams={{
                    authorizationGroupUuid: uuid
                  }}
                  mapId="reports"
                  viewFormats={[
                    FORMAT_SUMMARY,
                    FORMAT_TABLE,
                    FORMAT_CALENDAR,
                    FORMAT_MAP,
                    FORMAT_STATISTICS
                  ]}
                />
              </Fieldset>
            </Form>
          </div>
        )
      }}
    </Formik>
  )
}

AuthorizationGroupShow.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(AuthorizationGroupShow)
