import { gql } from "@apollo/client"
import API from "api"
import AuthorizationGroupTable from "components/AuthorizationGroupTable"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import {
  _isAllSelected,
  _isSelected,
  _toggleAll,
  _toggleSelection,
  DEFAULT_PAGESIZE,
  GQL_EMAIL_ADDRESSES
} from "components/search/common"
import _isEqual from "lodash/isEqual"
import React, { useEffect, useRef, useState } from "react"

const GQL_GET_AUTHORIZATION_GROUP_LIST = gql`
  query (
    $authorizationGroupQuery: AuthorizationGroupSearchQueryInput
    $emailNetwork: String
  ) {
    authorizationGroupList(query: $authorizationGroupQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        description
        status
        distributionList
        forSensitiveInformation
        authorizationGroupRelatedObjects {
          relatedObjectType
          relatedObjectUuid
          relatedObject {
            ... on Organization {
              uuid
              shortName
              ${GQL_EMAIL_ADDRESSES}
            }
            ... on Person {
              uuid
              name
              rank
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
  }
`

interface AuthorizationGroupSearchResultsProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  paginationKey?: string
  pagination?: any
  setPagination?: (...args: unknown[]) => unknown
  allowSelection?: boolean
  updateRecipients?: (...args: unknown[]) => unknown
}

const AuthorizationGroupSearchResults = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination,
  allowSelection,
  updateRecipients
}: AuthorizationGroupSearchResultsProps) => {
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    (queryParamsUnchanged && pagination?.[paginationKey]?.pageNum) ?? 0
  )
  const [selectedEmailAddresses, setSelectedEmailAddresses] = useState(
    new Map()
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination?.(paginationKey, 0)
      setPageNum(0)
      setSelectedEmailAddresses(new Map())
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const authorizationGroupQuery = {
    ...queryParams,
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  }
  const { emailNetwork } = queryParams
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_AUTHORIZATION_GROUP_LIST,
    {
      authorizationGroupQuery,
      emailNetwork
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.authorizationGroupList?.totalCount
  useEffect(() => {
    setTotalCount?.(totalCount)
  }, [setTotalCount, totalCount])
  if (done) {
    return result
  }

  const paginatedAuthorizationGroups = data ? data.authorizationGroupList : []
  const {
    pageSize,
    pageNum: curPage,
    list: authorizationGroups
  } = paginatedAuthorizationGroups

  return (
    <AuthorizationGroupTable
      authorizationGroups={authorizationGroups}
      showMembers
      showStatus
      pageSize={setPagination && pageSize}
      pageNum={setPagination && curPage}
      totalCount={setPagination && totalCount}
      goToPage={setPagination && setPage}
      allowSelection={allowSelection}
      selection={selectedEmailAddresses}
      isAllSelected={isAllSelected}
      toggleAll={toggleAll}
      isSelected={isSelected}
      toggleSelection={toggleSelection}
      id="authorizationGroups-search-results"
    />
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }

  function getListWithEmailAddresses() {
    return authorizationGroups.map(ag => ({
      uuid: ag.uuid,
      emailAddresses: ag.authorizationGroupRelatedObjects
        .flatMap(agro => agro.relatedObject?.emailAddresses)
        .filter(Boolean)
    }))
  }

  function isAllSelected() {
    return _isAllSelected(getListWithEmailAddresses(), selectedEmailAddresses)
  }

  function toggleAll() {
    _toggleAll(
      getListWithEmailAddresses(),
      selectedEmailAddresses,
      setSelectedEmailAddresses,
      updateRecipients
    )
  }

  function isSelected(uuid) {
    return _isSelected(uuid, selectedEmailAddresses)
  }

  function toggleSelection(uuid, emailAddresses) {
    _toggleSelection(
      uuid,
      emailAddresses,
      selectedEmailAddresses,
      setSelectedEmailAddresses,
      updateRecipients
    )
  }
}

export default AuthorizationGroupSearchResults
