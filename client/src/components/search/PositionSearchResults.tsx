import { gql } from "@apollo/client"
import API from "api"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import PositionTable from "components/PositionTable"
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

const GQL_GET_POSITION_LIST = gql`
  query ($positionQuery: PositionSearchQueryInput, $emailNetwork: String) {
    positionList(query: $positionQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        code
        type
        role
        status
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        ${GQL_EMAIL_ADDRESSES}
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
    }
  }
`

interface PositionSearchResultsProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  paginationKey?: string
  pagination?: any
  setPagination?: (...args: unknown[]) => unknown
  allowSelection?: boolean
  updateRecipients?: (...args: unknown[]) => unknown
}

const PositionSearchResults = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination,
  allowSelection,
  updateRecipients
}: PositionSearchResultsProps) => {
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
  const positionQuery = {
    ...queryParams,
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  }
  const { emailNetwork } = queryParams
  const { loading, error, data } = API.useApiQuery(GQL_GET_POSITION_LIST, {
    positionQuery,
    emailNetwork
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.positionList?.totalCount
  useEffect(() => setTotalCount?.(totalCount), [setTotalCount, totalCount])
  if (done) {
    return result
  }

  const paginatedPositions = data ? data.positionList : []
  const { pageSize, pageNum: curPage, list: positions } = paginatedPositions

  return (
    <PositionTable
      positions={positions}
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
      id="positions-search-results"
    />
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }

  function isAllSelected() {
    return _isAllSelected(positions, selectedEmailAddresses)
  }

  function toggleAll() {
    _toggleAll(
      positions,
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

export default PositionSearchResults
