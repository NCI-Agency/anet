import { gql } from "@apollo/client"
import API from "api"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import { DEFAULT_PAGESIZE } from "components/search/common"
import TaskTable from "components/TaskTable"
import _isEqual from "lodash/isEqual"
import React, { useEffect, useRef, useState } from "react"

const GQL_GET_TASK_LIST = gql`
  query ($taskQuery: TaskSearchQueryInput) {
    taskList(query: $taskQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        shortName
        longName
        parentTask {
          uuid
          shortName
        }
        ascendantTasks {
          uuid
          shortName
          parentTask {
            uuid
          }
        }
      }
    }
  }
`

interface TaskSearchResultsProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  paginationKey?: string
  pagination?: any
  setPagination?: (...args: unknown[]) => unknown
}

const TaskSearchResults = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination
}: TaskSearchResultsProps) => {
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    (queryParamsUnchanged && pagination?.[paginationKey]?.pageNum) ?? 0
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination?.(paginationKey, 0)
      setPageNum(0)
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const taskQuery = {
    ...queryParams,
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  }
  const { loading, error, data } = API.useApiQuery(GQL_GET_TASK_LIST, {
    taskQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.taskList?.totalCount
  useEffect(() => setTotalCount?.(totalCount), [setTotalCount, totalCount])
  if (done) {
    return result
  }

  const paginatedTasks = data ? data.taskList : []
  const { pageSize, pageNum: curPage, list: tasks } = paginatedTasks

  return (
    <TaskTable
      tasks={tasks}
      pageSize={setPagination && pageSize}
      pageNum={setPagination && curPage}
      totalCount={setPagination && totalCount}
      goToPage={setPagination && setPage}
      id="tasks-search-results"
    />
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }
}

export default TaskSearchResults
