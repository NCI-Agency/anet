import { DEFAULT_PAGE_PROPS } from "actions"
import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { getSearchQuery, SearchQueryPropType } from "components/SearchFilters"
import TaskTable from "components/TaskTable"
import pluralize from "pluralize"
import React, { useContext, useMemo } from "react"
import { connect } from "react-redux"
import { RECURSE_STRATEGY } from "searchUtils"
import Settings from "settings"

interface MyTasksProps {
  pageDispatchers?: PageDispatchersPropType
  searchQuery?: SearchQueryPropType
}

const MyTasks = ({ pageDispatchers, searchQuery }: MyTasksProps) => {
  // Make sure we have a navigation menu
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    pageDispatchers
  })
  const { currentUser, notifications } = useContext(AppContext)
  const taskShortLabel = Settings.fields.task.shortLabel
  usePageTitle(`My ${pluralize(taskShortLabel)}`)
  // Memo'ize the search query parameters we use to prevent unnecessary re-renders
  const searchQueryParams = useMemo(
    () => getSearchQuery(searchQuery),
    [searchQuery]
  )
  const taskedTasksSearchQueryParams = useMemo(
    () =>
      Object.assign({}, searchQueryParams, {
        sortBy: "NAME",
        sortOrder: "ASC",
        status: Model.STATUS.ACTIVE,
        taskedOrgUuid: currentUser.position?.organization?.uuid || "-1",
        orgRecurseStrategy: RECURSE_STRATEGY.PARENTS
      }),
    [searchQueryParams, currentUser]
  )

  const myOrgAssignedTasksTitle = (
    <>
      {pluralize(taskShortLabel)} assigned to{" "}
      <LinkTo
        modelType="Organization"
        model={currentUser.position?.organization}
      />
    </>
  )

  return (
    <div>
      <Fieldset id="my-org-assigned-tasks" title={myOrgAssignedTasksTitle}>
        <TaskTable queryParams={taskedTasksSearchQueryParams} />
      </Fieldset>
      <Fieldset
        id="my-responsible-tasks"
        title={`${pluralize(taskShortLabel)} I am responsible for`}
      >
        <TaskTable tasks={currentUser?.position?.responsibleTasks} />
      </Fieldset>
      <Fieldset
        id="my-tasks-with-pending-assessments"
        title={`${pluralize(taskShortLabel)} that have pending assessments`}
      >
        <TaskTable tasks={notifications.tasksWithPendingAssessments} />
      </Fieldset>
    </div>
  )
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    ...pageDispatchers
  }
}
const mapStateToProps = state => ({
  searchQuery: state.searchQuery
})

export default connect(mapStateToProps, mapDispatchToProps)(MyTasks)
