import {
  gqlEmailAddressesFields,
  gqlEntityFieldsMap,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { TenantOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model from "components/Model"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import { FastField, Formik } from "formik"
import { Tenant } from "models"
import React, { useContext, useState } from "react"
import { Button, Table } from "react-bootstrap"
import { legacy_connect as connect } from "react-redux"
import Settings from "settings"
import * as yup from "yup"

const GQL_GET_USERS_PENDING_VERIFICATION = gql`
  query ($personQuery: PersonSearchQueryInput) {
    personList(query: $personQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.Person}
        pendingVerification
        ${gqlEmailAddressesFields}
        tenantAccessRequest {
          ${gqlEntityFieldsMap.Tenant}
        }
        tenant {
          ${gqlEntityFieldsMap.Tenant}
        }
      }
    }
  }
`
const GQL_APPROVE_USER = gql`
  mutation ($uuid: String!, $tenant: TenantInput!) {
    approvePerson(uuid: $uuid, tenant: $tenant)
  }
`
const GQL_DELETE_USER = gql`
  mutation ($uuid: String!) {
    deletePerson(uuid: $uuid)
  }
`

const yupSchema = yup.object().shape({
  tenant: yup
    .object()
    .nullable()
    .required()
    .test("tenant", "tenant error", (tenant, testContext) =>
      tenant?.status !== Model.STATUS.ACTIVE
        ? testContext.createError({
            message: "Select an active Tenant before allowing access"
          })
        : true
    )
    .default(null)
})

interface UsersPendingVerificationProps {
  pageDispatchers?: PageDispatchersPropType
}

const UsersPendingVerification = ({
  pageDispatchers
}: UsersPendingVerificationProps) => {
  const { allTenants } = useContext(AppContext)
  const [pageNum, setPageNum] = useState(0)
  const [stateSuccess, setStateSuccess] = useState(null)
  const [stateError, setStateError] = useState(null)
  const { loading, error, data, refetch } = API.useApiQuery(
    GQL_GET_USERS_PENDING_VERIFICATION,
    {
      personQuery: { pageNum, pageSize: 25, pendingVerification: true }
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Users Pending Verification")
  if (done) {
    return result
  }

  const { pageSize, totalCount, list } = data.personList
  const tenantsFilters = {
    allTenants: {
      label: "All Tenants",
      list: allTenants
    }
  }
  const activeTenants = allTenants?.filter(
    t => t?.status === Model.STATUS.ACTIVE
  )
  const defaultTenant = activeTenants?.length === 1 ? activeTenants[0] : null

  return (
    <Fieldset title="Users Pending Verification">
      <Messages success={stateSuccess} error={stateError} />
      {totalCount <= 0 ? (
        <em>No users pending verification</em>
      ) : (
        <UltimatePaginationTopDown
          componentClassName="searchPagination"
          className="float-end"
          pageNum={pageNum}
          pageSize={pageSize}
          totalCount={totalCount}
          goToPage={setPageNum}
        >
          <Table responsive hover striped id="users-pending-verification">
            <thead>
              <tr>
                <th className="col-sm-3">Name</th>
                <th className="col-sm-6">Tenants</th>
                <th className="col-sm-3">Pending Verification</th>
              </tr>
            </thead>
            <tbody>
              {list.map(person => {
                person.tenant = person.tenantAccessRequest ?? defaultTenant
                return (
                  <Formik
                    key={person.uuid}
                    enableReinitialize
                    initialValues={person}
                    validationSchema={yupSchema}
                    validateOnMount
                  >
                    {({ values, isValid, setFieldValue, setFieldTouched }) => (
                      <tr>
                        <td>
                          <LinkTo
                            modelType="Person"
                            model={values}
                            showAvatar={false}
                          />
                        </td>
                        <td>
                          <FastField
                            name="tenant"
                            label={null}
                            component={FieldHelper.SpecialField}
                            extraColElem={null}
                            onChange={value => {
                              // validation will be done by setFieldValue
                              setFieldTouched("tenant", true, false) // onBlur doesn't work when selecting an option
                              setFieldValue("tenant", value, true)
                            }}
                            widget={
                              <AdvancedSingleSelect
                                fieldName="tenant"
                                placeholder={
                                  Settings.fields.person.tenant.placeholder
                                }
                                value={values.tenant}
                                overlayColumns={["Name", "Status"]}
                                overlayRenderRow={TenantOverlayRow}
                                filterDefs={tenantsFilters}
                                objectType={Tenant}
                                fields={Tenant.autocompleteQuery}
                                valueKey="name"
                              />
                            }
                          />
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            disabled={!isValid}
                            onClick={() => updateAccess(values, true)}
                          >
                            Allow Access
                          </Button>
                          <Button
                            variant="outline-danger"
                            className="ms-2"
                            onClick={() => updateAccess(values, false)}
                          >
                            Deny Access
                          </Button>
                        </td>
                      </tr>
                    )}
                  </Formik>
                )
              })}
            </tbody>
          </Table>
        </UltimatePaginationTopDown>
      )}
    </Fieldset>
  )

  function updateAccess(person, isApproved) {
    person.tenant = Tenant.filterClientSideFields(person.tenant)

    return API.mutation(isApproved ? GQL_APPROVE_USER : GQL_DELETE_USER, {
      uuid: person.uuid,
      ...(isApproved ? { tenant: person.tenant } : {})
    })
      .then(() => {
        const msg = (
          <>
            Pending user{" "}
            <LinkTo
              modelType="Person"
              model={person}
              showAvatar={false}
              isLink={isApproved}
              showPreview={isApproved}
            />{" "}
            was successfully {isApproved ? "approved" : "deleted"}.
          </>
        )
        setStateSuccess(msg)
        setStateError(null)
        refetch()
      })
      .catch(error => {
        setStateSuccess(null)
        setStateError(error)
        jumpToTop()
      })
  }
}

export default connect(
  null,
  mapPageDispatchersToProps
)(UsersPendingVerification)
