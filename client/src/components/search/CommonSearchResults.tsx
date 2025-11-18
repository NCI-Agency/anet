import { DocumentNode } from "@apollo/client"
import API from "api"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import React, { useEffect, useRef, useState } from "react"

export const DEFAULT_PAGESIZE = 10

export interface GenericSearchResultsProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  paginationKey?: string
  pagination?: any
  setPagination?: (...args: unknown[]) => unknown
}

export interface GenericSearchResultsWithEmailProps
  extends GenericSearchResultsProps {
  allowSelection?: boolean
  updateRecipients?: (...args: unknown[]) => unknown
}

interface CommonSearchResultsProps extends GenericSearchResultsWithEmailProps {
  getListWithEmailAddresses?: (list: object[]) => object[]
  gqlQuery: DocumentNode
  gqlQueryParamName: string
  gqlQueryResultName: string
  tableComponent: React.ComponentType<unknown>
  tableResultsProp: string
  tableId: string
  extraProps?: object
}

export const CommonSearchResults = ({
  allowSelection,
  updateRecipients,
  getListWithEmailAddresses = list => list,
  gqlQuery,
  gqlQueryParamName,
  gqlQueryResultName,
  tableComponent: TableComponent,
  tableResultsProp,
  tableId,
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination,
  extraProps = {}
}: CommonSearchResultsProps) => {
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
  const searchQuery = {
    ...queryParams,
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  }
  const { emailNetwork } = queryParams
  const { loading, error, data } = API.useApiQuery(gqlQuery, {
    [gqlQueryParamName]: searchQuery,
    emailNetwork
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.[gqlQueryResultName]?.totalCount
  useEffect(() => {
    setTotalCount?.(totalCount)
  }, [setTotalCount, totalCount])
  if (done) {
    return result
  }

  const paginatedResults = data ? data[gqlQueryResultName] : []
  const { pageSize, pageNum: curPage, list } = paginatedResults

  return (
    <TableComponent
      {...{ [tableResultsProp]: list }}
      pageSize={setPagination && pageSize}
      pageNum={setPagination && curPage}
      totalCount={setPagination && totalCount}
      goToPage={setPagination && setPage}
      id={tableId}
      allowSelection={allowSelection}
      selection={selectedEmailAddresses}
      isAllSelected={isAllSelected}
      toggleAll={toggleAll}
      isSelected={isSelected}
      toggleSelection={toggleSelection}
      {...extraProps}
    />
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }

  function isSubsetOf(set, subset) {
    return new Set([...set, ...subset]).size === set.size
  }

  function isAllSelected() {
    const selectedUuids = new Set(selectedEmailAddresses?.keys())
    if (_isEmpty(selectedUuids)) {
      return false // nothing selected
    }
    const isSubset = isSubsetOf(
      selectedUuids,
      getListWithEmailAddresses(list)
        .filter(l => !_isEmpty(l.emailAddresses))
        .map(l => l.uuid)
    )
    return isSubset || null // return indeterminate if only some are selected
  }

  function toggleAll() {
    if (isAllSelected()) {
      getListWithEmailAddresses(list).forEach(l =>
        selectedEmailAddresses.delete(l.uuid)
      )
    } else {
      getListWithEmailAddresses(list)
        .filter(l => !_isEmpty(l.emailAddresses))
        .forEach(l => selectedEmailAddresses.set(l.uuid, l.emailAddresses))
    }
    updateSelection()
  }

  function isSelected(uuid) {
    return selectedEmailAddresses.has(uuid)
  }

  function toggleSelection(uuid, emailAddresses) {
    if (isSelected(uuid)) {
      selectedEmailAddresses.delete(uuid)
    } else {
      selectedEmailAddresses.set(uuid, emailAddresses)
    }
    updateSelection()
  }

  function updateSelection() {
    const newSelection = new Map(selectedEmailAddresses)
    setSelectedEmailAddresses(newSelection)
    updateRecipients(newSelection)
  }
}
