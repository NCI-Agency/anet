import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  setPagination
} from "actions"
import Fieldset from "components/Fieldset"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import AuthorizationGroupSearchResults from "components/search/AuthorizationGroupSearchResults"
import React from "react"
import { connect } from "react-redux"

const queryParams = {
  pageSize: 10,
  status: "ACTIVE"
}

interface AuthorizationGroupListProps {
  pageDispatchers?: PageDispatchersPropType
  pagination?: any
  setPagination?: (...args: unknown[]) => unknown
}

const AuthorizationGroupList = ({
  pageDispatchers,
  pagination,
  setPagination
}: AuthorizationGroupListProps) => {
  const { done, result } = useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Communities")

  if (done) {
    return result
  }

  return (
    <>
      <Fieldset title="Communities" id="communities">
        <AuthorizationGroupSearchResults
          queryParams={queryParams}
          pageDispatchers={pageDispatchers}
          paginationKey="authorizationGroups"
          pagination={pagination}
          setPagination={setPagination}
        />
      </Fieldset>
    </>
  )
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    setPagination: (pageKey, pageNum) =>
      dispatch(setPagination(pageKey, pageNum)),
    ...pageDispatchers
  }
}

const mapStateToProps = state => ({
  pagination: state.pagination
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AuthorizationGroupList)
