import {
  gqlEntityFieldsMap,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import {
  CommonSearchResults,
  GenericSearchResultsProps
} from "components/search/CommonSearchResults"
import TaskTable from "components/TaskTable"
import React from "react"

const GQL_GET_TASK_LIST = gql`
  query ($taskQuery: TaskSearchQueryInput) {
    taskList(query: $taskQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.Task}
        parentTask {
          ${gqlEntityFieldsMap.Task}
        }
        ascendantTasks {
          ${gqlEntityFieldsMap.Task}
          parentTask {
            ${gqlEntityFieldsMap.Task}
          }
        }
      }
    }
  }
`

const TaskSearchResults = (props: GenericSearchResultsProps) => (
  <CommonSearchResults
    gqlQuery={GQL_GET_TASK_LIST}
    gqlQueryParamName="taskQuery"
    gqlQueryResultName="taskList"
    tableComponent={TaskTable}
    tableResultsProp="tasks"
    tableId="tasks-search-results"
    {...props}
  />
)

export default TaskSearchResults
