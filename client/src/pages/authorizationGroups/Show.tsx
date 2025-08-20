import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import AuthorizationGroupMembersTable from "components/AuthorizationGroupMembersTable"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import FindObjectsButton from "components/FindObjectsButton"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
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
import { AuthorizationGroup } from "models"
import React, { useContext, useState } from "react"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"

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
      distributionList
      forSensitiveInformation
      isSubscribed
      administrativePositions {
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
      authorizationGroupRelatedObjects {
        relatedObjectType
        relatedObjectUuid
        relatedObject {
          ... on Organization {
            uuid
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            ${GQL_EMAIL_ADDRESSES}
          }
          ... on Person {
            uuid
            name
            rank
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            ${GQL_EMAIL_ADDRESSES}
          }
          ... on Position {
            uuid
            type
            name
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            ${GQL_EMAIL_ADDRESSES}
          }
        }
      }
    }
  }
`

interface AuthorizationGroupShowProps {
  pageDispatchers?: PageDispatchersPropType
}

const AuthorizationGroupShow = ({
  pageDispatchers
}: AuthorizationGroupShowProps) => {
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

  const searchText = authorizationGroup.name
  const action = (
    <>
      {canEdit && (
        <LinkTo
          modelType="AuthorizationGroup"
          model={authorizationGroup}
          edit
          button="primary"
        >
          Edit
        </LinkTo>
      )}
      <FindObjectsButton objectLabel="Community" searchText={searchText} />
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
              Community {authorizationGroup.name}
            </>
          }
          action={action}
        />
        <Fieldset>
          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.authorizationGroup.description}
            field={{
              name: "description",
              value: authorizationGroup.description
            }}
          />

          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.authorizationGroup.status}
            field={{ name: "status" }}
            humanValue={AuthorizationGroup.humanNameOfStatus(
              authorizationGroup.status
            )}
          />

          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.authorizationGroup.distributionList}
            field={{ name: "distributionList" }}
            humanValue={utils.formatBoolean(
              authorizationGroup.distributionList
            )}
          />

          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={
              Settings.fields.authorizationGroup.forSensitiveInformation
            }
            field={{ name: "forSensitiveInformation" }}
            humanValue={utils.formatBoolean(
              authorizationGroup.forSensitiveInformation
            )}
          />
        </Fieldset>

        <Fieldset
          title={
            Settings.fields.authorizationGroup.administrativePositions?.label
          }
        >
          <PositionTable
            positions={authorizationGroup.administrativePositions}
            showLocation
          />
        </Fieldset>

        <Fieldset
          title={
            Settings.fields.authorizationGroup.authorizationGroupRelatedObjects
              ?.label
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
      </div>
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(AuthorizationGroupShow)
