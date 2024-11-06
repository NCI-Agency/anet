import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import React, { useState } from "react"
import { Button, Table } from "react-bootstrap"
import { connect } from "react-redux"

const GQL_GET_USERS_PENDING_VERIFICATION = gql`
  query ($personQuery: PersonSearchQueryInput) {
    personList(query: $personQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        pendingVerification
        emailAddresses {
          network
          address
        }
      }
    }
  }
`
const GQL_APPROVE_USER = gql`
  mutation ($uuid: String!) {
    approvePerson(uuid: $uuid)
  }
`
const GQL_DELETE_USER = gql`
  mutation ($uuid: String!) {
    deletePerson(uuid: $uuid)
  }
`

interface UsersPendingVerificationProps {
  pageDispatchers?: PageDispatchersPropType
}

const UsersPendingVerification = ({
  pageDispatchers
}: UsersPendingVerificationProps) => {
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
                <th>Name</th>
                <th>Pending Verification</th>
              </tr>
            </thead>
            <tbody>
              {list.map(person => (
                <tr key={person.uuid}>
                  <td>
                    <LinkTo modelType="Person" model={person} />
                  </td>
                  <td>
                    <Button
                      variant="primary"
                      onClick={() => updateAccess(person.uuid, true)}
                    >
                      Allow Access
                    </Button>
                    <Button
                      variant="outline-danger"
                      className="ms-2"
                      onClick={() => updateAccess(person.uuid, false)}
                    >
                      Deny Access
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </UltimatePaginationTopDown>
      )}
    </Fieldset>
  )

  function updateAccess(uuid, isApproved) {
    return API.mutation(isApproved ? GQL_APPROVE_USER : GQL_DELETE_USER, {
      uuid
    })
      .then(data => {
        setStateSuccess(
          `Pending user was successfully ${isApproved ? "approved" : "deleted"}`
        )
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
