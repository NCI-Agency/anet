import {
  gqlEmailAddressesFields,
  gqlEntityFieldsMap,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { TenantOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
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
import TenantTable from "components/TenantTable"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import { FastField, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Tenant } from "models"
import React, { useContext, useState } from "react"
import { Button, Table } from "react-bootstrap"
import { legacy_connect as connect } from "react-redux"
import * as yup from "yup"

const GQL_GET_USERS_PENDING_VERIFICATION = gql`
  query ($personQuery: PersonSearchQueryInput) {
    personList(query: $personQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.Person}
        pendingVerification
        ${gqlEmailAddressesFields}
        tenants {
          ${gqlEntityFieldsMap.Tenant}
        }
      }
    }
  }
`
const GQL_APPROVE_USER = gql`
  mutation ($uuid: String!, $tenants: [TenantInput]!) {
    approvePerson(uuid: $uuid, tenants: $tenants)
  }
`
const GQL_DELETE_USER = gql`
  mutation ($uuid: String!) {
    deletePerson(uuid: $uuid)
  }
`

const yupSchema = yup.object().shape({
  tenants: yup
    .array()
    .required()
    .test("tenants", "tenants error", (tenants, testContext) =>
      _isEmpty(tenants?.filter(t => t?.status === Model.STATUS.ACTIVE))
        ? testContext.createError({
            message: "Select at least one active Tenant before allowing access"
          })
        : true
    )
    .default([])
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
  const defaultTenants = activeTenants?.length === 1 ? activeTenants : null

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
                if (_isEmpty(person?.tenants)) {
                  person.tenants = defaultTenants
                }
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
                            name="tenants"
                            label={null}
                            component={FieldHelper.SpecialField}
                            extraColElem={null}
                            onChange={value => {
                              // validation will be done by setFieldValue
                              setFieldTouched("tenants", true, false) // onBlur doesn't work when selecting an option
                              setFieldValue("tenants", value, true)
                            }}
                            widget={
                              <AdvancedMultiSelect
                                fieldName="tenants"
                                placeholder="Search for tenants…"
                                value={values.tenants}
                                renderSelected={
                                  <TenantTable
                                    tenants={values.tenants}
                                    showStatus
                                    showDelete
                                    noTenantsMessage="No tenants selected; click in the box above to select any"
                                  />
                                }
                                overlayColumns={["Name", "Status"]}
                                overlayRenderRow={TenantOverlayRow}
                                filterDefs={tenantsFilters}
                                objectType={Tenant}
                                fields={Tenant.autocompleteQuery}
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
    person.tenants = person.tenants?.map(t => Tenant.filterClientSideFields(t))

    return API.mutation(isApproved ? GQL_APPROVE_USER : GQL_DELETE_USER, {
      uuid: person.uuid,
      ...(isApproved ? { tenants: person.tenants } : {})
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
