import { gql } from "@apollo/client"
import API from "api"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import PersonTable from "components/PersonTable"
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

const GQL_GET_PERSON_LIST = gql`
  query ($personQuery: PersonSearchQueryInput, $emailNetwork: String) {
    personList(query: $personQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        ${GQL_EMAIL_ADDRESSES}
        position {
          uuid
          name
          type
          role
          code
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
        }
      }
    }
  }
`

interface PeopleSearchResultsProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  paginationKey?: string
  pagination?: any
  setPagination?: (...args: unknown[]) => unknown
  allowSelection?: boolean
  updateRecipients?: (...args: unknown[]) => unknown
}

const PeopleSearchResults = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination,
  allowSelection,
  updateRecipients
}: PeopleSearchResultsProps) => {
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
  const personQuery = {
    ...queryParams,
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  }
  const { emailNetwork } = queryParams
  const { loading, error, data } = API.useApiQuery(GQL_GET_PERSON_LIST, {
    personQuery,
    emailNetwork
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.personList?.totalCount
  useEffect(() => {
    setTotalCount?.(totalCount)
  }, [setTotalCount, totalCount])
  if (done) {
    return result
  }

  const paginatedPeople = data ? data.personList : []
  const { pageSize, pageNum: curPage, list: people } = paginatedPeople

  return (
    <PersonTable
      people={people}
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
      id="people-search-results"
    />
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }

  function isAllSelected() {
    return _isAllSelected(people, selectedEmailAddresses)
  }

  function toggleAll() {
    _toggleAll(
      people,
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

export default PeopleSearchResults
