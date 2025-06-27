import { gql } from "@apollo/client"
import API from "api"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import OrganizationTable from "components/OrganizationTable"
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

const GQL_GET_ORGANIZATION_LIST = gql`
  query (
    $organizationQuery: OrganizationSearchQueryInput
    $emailNetwork: String
  ) {
    organizationList(query: $organizationQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        shortName
        longName
        identificationCode
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        ${GQL_EMAIL_ADDRESSES}
        location {
          uuid
          name
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
    }
  }
`

interface OrganizationSearchResultsProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  paginationKey?: string
  pagination?: any
  setPagination?: (...args: unknown[]) => unknown
  allowSelection?: boolean
  updateRecipients?: (...args: unknown[]) => unknown
}

const OrganizationSearchResults = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination,
  allowSelection,
  updateRecipients
}: OrganizationSearchResultsProps) => {
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
  const organizationQuery = {
    ...queryParams,
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  }
  const { emailNetwork } = queryParams
  const { loading, error, data } = API.useApiQuery(GQL_GET_ORGANIZATION_LIST, {
    organizationQuery,
    emailNetwork
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.organizationList?.totalCount
  useEffect(() => {
    setTotalCount?.(totalCount)
  }, [setTotalCount, totalCount])
  if (done) {
    return result
  }

  const paginatedOrganizations = data ? data.organizationList : []
  const {
    pageSize,
    pageNum: curPage,
    list: organizations
  } = paginatedOrganizations

  return (
    <OrganizationTable
      organizations={organizations}
      showLocation
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
      id="organizations-search-results"
    />
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }

  function isAllSelected() {
    return _isAllSelected(organizations, selectedEmailAddresses)
  }

  function toggleAll() {
    _toggleAll(
      organizations,
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

export default OrganizationSearchResults
