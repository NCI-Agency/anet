import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import AuthorizationGroupMembersTable from "components/AuthorizationGroupMembersTable"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import PositionTable from "components/PositionTable"
import ReportCollection from "components/ReportCollection"
import { Field, Form, Formik } from "formik"
import { AuthorizationGroup } from "models"
import React, { useContext, useState } from "react"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
import Settings from "settings"

const GQL_EMAIL_ADDRESSES = `
  emailAddresses {
    network
    address
  }
`
const GQL_GET_AUTHORIZATION_GROUP = gql`
  query ($uuid: String) {
    authorizationGroup(uuid: $uuid) {
      uuid
      name
      description
      status
      isSubscribed
      administrativePositions {
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
      authorizationGroupRelatedObjects {
        relatedObjectType
        relatedObjectUuid
        relatedObject {
          ... on Organization {
            uuid
            shortName
            longName
            identificationCode
            ${GQL_EMAIL_ADDRESSES}
          }
          ... on Person {
            uuid
            name
            rank
            avatarUuid
            ${GQL_EMAIL_ADDRESSES}
          }
          ... on Position {
            uuid
            type
            name
            ${GQL_EMAIL_ADDRESSES}
          }
        }
      }
    }
  }
`

const AuthorizationGroupShow = ({ pageDispatchers }) => {
  const { currentUser } = useContext(AppContext)
  const { uuid } = useParams()
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state?.success
  const [stateError, setStateError] = useState(routerLocation.state?.error)
  const { loading, error, data, refetch } = API.useApiQuery(
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
  usePageTitle(data?.authorizationGroup?.name)
  if (done) {
    return result
  }

  const authorizationGroup = new AuthorizationGroup(
    data ? data.authorizationGroup : {}
  )
  const isAssignedSuperuser =
    currentUser.position?.authorizationGroupsAdministrated?.some(
      aga => aga.uuid === authorizationGroup.uuid
    )
  const canEdit = currentUser.isAdmin() || isAssignedSuperuser

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
            <Messages success={stateSuccess} error={stateError} />
            <Form className="form-horizontal" method="post">
              <Fieldset
                title={
                  <>
                    {
                      <SubscriptionIcon
                        subscribedObjectType="authorizationGroups"
                        subscribedObjectUuid={authorizationGroup.uuid}
                        isSubscribed={authorizationGroup.isSubscribed}
                        updatedAt={authorizationGroup.updatedAt}
                        refetch={refetch}
                        setError={error => {
                          setStateError(error)
                          jumpToTop()
                        }}
                        persistent
                      />
                    }{" "}
                    Authorization Group {authorizationGroup.name}
                  </>
                }
                action={action}
              />
              <Fieldset>
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.authorizationGroup.description}
                  name="description"
                  component={FieldHelper.ReadonlyField}
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.authorizationGroup.status}
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={AuthorizationGroup.humanNameOfStatus}
                />
              </Fieldset>

              <Fieldset
                title={
                  Settings.fields.authorizationGroup.administrativePositions
                    ?.label
                }
              >
                <PositionTable
                  positions={authorizationGroup.administrativePositions}
                  showLocation
                />
              </Fieldset>

              <Fieldset
                title={
                  Settings.fields.authorizationGroup
                    .authorizationGroupRelatedObjects?.label
                }
              >
                <AuthorizationGroupMembersTable
                  authorizationGroup={authorizationGroup}
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

AuthorizationGroupShow.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(AuthorizationGroupShow)
