import {
  gqlAllTenantFields,
  gqlEntityFieldsMap
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import NoPaginationPersonTable from "components/NoPaginationPersonTable"
import ObjectHistory from "components/ObjectHistory"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { Tenant } from "models"
import React, { useContext } from "react"
import { legacy_connect as connect } from "react-redux"
import { useLocation, useParams } from "react-router"
import Settings from "settings"

const GQL_GET_TENANT = gql`
  query ($uuid: String) {
    tenant(uuid: $uuid) {
      ${gqlAllTenantFields}
      members {
        ${gqlEntityFieldsMap.Person}
        position {
          ${gqlEntityFieldsMap.Position}
          location {
            ${gqlEntityFieldsMap.Location}
          }
          organization {
            ${gqlEntityFieldsMap.Organization}
          }
        }
      }
    }
  }
`

interface TenantShowProps {
  pageDispatchers?: PageDispatchersPropType
}

const TenantShow = ({ pageDispatchers }: TenantShowProps) => {
  const { currentUser } = useContext(AppContext)
  const { uuid } = useParams()
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state?.success
  const stateError = routerLocation.state?.error
  const { loading, error, data } = API.useApiQuery(GQL_GET_TENANT, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Tenant",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(data?.tenant?.name)
  if (done) {
    return result
  }

  const tenant = new Tenant(data ? data.tenant : {})
  const canEdit = currentUser.isAdmin()

  const action = (
    <>
      {canEdit && (
        <LinkTo modelType="Tenant" model={tenant} edit button="primary">
          Edit
        </LinkTo>
      )}
      <ObjectHistory objectUuid={tenant.uuid} />
    </>
  )

  return (
    <div>
      <Messages success={stateSuccess} error={stateError} />
      <div className="form-horizontal">
        <Fieldset title={`Tenant ${tenant.name}`} action={action} />
        <Fieldset>
          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.tenant.status}
            field={{ name: "status" }}
            humanValue={Tenant.humanNameOfStatus(tenant.status)}
          />
          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.tenant.emailAddresses}
            field={{ name: "emailAddresses" }}
            humanValue={
              <ul style={{ listStyle: "none" }} className="ps-0">
                {tenant.emailAddresses?.map((ea, i) => (
                  <li key={i}>{ea}</li>
                ))}
              </ul>
            }
          />
        </Fieldset>
        <Fieldset title="Members">
          <NoPaginationPersonTable people={tenant.members} />
        </Fieldset>
      </div>
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(TenantShow)
