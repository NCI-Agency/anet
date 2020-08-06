import { setPagination } from "actions"
import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps
} from "components/Page"
import {
  SearchQueryPropType,
  getSearchQuery,
  RECURSE_STRATEGY
} from "components/SearchFilters"
import { Task } from "models"
import { Tasks } from "pages/Search"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useContext, useMemo } from "react"
import { connect } from "react-redux"
import Settings from "settings"

const MyTasks = ({
  pageDispatchers,
  searchQuery,
  pagination,
  setPagination
}) => {
  const { currentUser } = useContext(AppContext)
  const taskShortLabel = Settings.fields.task.shortLabel
  // Memo'ize the search query parameters we use to prevent unnecessary re-renders
  const searchQueryParams = useMemo(() => getSearchQuery(searchQuery), [
    searchQuery
  ])
  const taskedTasksSearchQueryParams = useMemo(
    () =>
      Object.assign({}, searchQueryParams, {
        sortBy: "NAME",
        sortOrder: "ASC",
        status: Task.STATUS.ACTIVE,
        taskedOrgUuid: currentUser.position?.organization?.uuid,
        orgRecurseStrategy: RECURSE_STRATEGY.PARENTS
      }),
    [searchQueryParams, currentUser]
  )
  const responsibleTasksSearchQueryParams = useMemo(
    () =>
      Object.assign({}, searchQueryParams, {
        sortBy: "NAME",
        sortOrder: "ASC",
        status: Task.STATUS.ACTIVE,
        responsiblePositionUuid: currentUser.position?.uuid
      }),
    [searchQueryParams, currentUser]
  )
  const myOrgAssignedTasksTitle = (
    <>
      {pluralize(taskShortLabel)} assigned to{" "}
      <LinkTo
        modelType="Organization"
        model={currentUser.position.organization}
      />
    </>
  )
  return (
    <div>
      <Fieldset id="my_org_assigned_tasks" title={myOrgAssignedTasksTitle}>
        <Tasks
          pageDispatchers={pageDispatchers}
          queryParams={taskedTasksSearchQueryParams}
          paginationKey="my_org_assigned_tasks"
          pagination={pagination}
          setPagination={setPagination}
        />
      </Fieldset>
      <Fieldset
        id="my_responsible_tasks"
        title={`${pluralize(taskShortLabel)} I am responsible for`}
      >
        <Tasks
          pageDispatchers={pageDispatchers}
          queryParams={responsibleTasksSearchQueryParams}
          paginationKey="my_responsible_tasks"
          pagination={pagination}
          setPagination={setPagination}
        />
      </Fieldset>
    </div>
  )
}

MyTasks.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  pagination: PropTypes.object.isRequired,
  setPagination: PropTypes.func.isRequired,
  searchQuery: SearchQueryPropType
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    setPagination: (pageKey, pageNum) =>
      dispatch(setPagination(pageKey, pageNum)),
    ...pageDispatchers
  }
}
const mapStateToProps = (state, ownProps) => ({
  searchQuery: state.searchQuery,
  pagination: state.pagination
})

export default connect(mapStateToProps, mapDispatchToProps)(MyTasks)
