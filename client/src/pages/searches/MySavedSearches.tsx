import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { SEARCH_OBJECT_TYPES, setSearchQuery } from "actions"
import API from "api"
import ConfirmDestructive from "components/ConfirmDestructive"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import {
  deserializeQueryParams,
  SearchDescription
} from "components/SearchFilters"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import React, { useEffect, useMemo, useState } from "react"
import { Button, Table } from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"
import utils from "utils"

const GQL_GET_SAVED_SEARCHES = gql`
  query {
    savedSearches: mySearches {
      uuid
      name
      objectType
      query
    }
  }
`

const GQL_DELETE_SAVED_SEARCH = gql`
  mutation ($uuid: String!) {
    deleteSavedSearch(uuid: $uuid)
  }
`

interface MySavedSearchesProps {
  setSearchQuery: (...args: unknown[]) => unknown
  pageDispatchers?: PageDispatchersPropType
}

const DEFAULT_PAGESIZE = 10

const MySavedSearches = ({
  setSearchQuery,
  pageDispatchers
}: MySavedSearchesProps) => {
  const navigate = useNavigate()
  const [stateError, setStateError] = useState(null)
  const [deserializedQueries, setDeserializedQueries] = useState({})
  const [pageNum, setPageNum] = useState(0)
  const { loading, error, data, refetch } = API.useApiQuery(
    GQL_GET_SAVED_SEARCHES
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  usePageTitle("My Saved Searches")

  const savedSearches = useMemo(() => data?.savedSearches || [], [data])
  const totalCount = savedSearches.length
  const paginatedSearches = useMemo(
    () =>
      savedSearches.slice(
        pageNum * DEFAULT_PAGESIZE,
        (pageNum + 1) * DEFAULT_PAGESIZE
      ),
    [savedSearches, pageNum]
  )

  useEffect(() => {
    const newQueries = {}
    paginatedSearches.forEach(search => {
      const objType = SEARCH_OBJECT_TYPES[search.objectType]
      const queryParams = utils.parseJsonSafe(search.query)
      deserializeQueryParams(
        objType,
        queryParams,
        (objectType, filters, text) => {
          newQueries[search.uuid] = { objectType, filters, text }
          setDeserializedQueries(prev => ({ ...prev, ...newQueries }))
        }
      )
    })
  }, [paginatedSearches])

  if (done) {
    return result
  }

  return (
    <Fieldset title="Saved searches">
      <Messages error={stateError} />
      <UltimatePaginationTopDown
        componentClassName="searchPagination"
        className="float-end"
        pageNum={pageNum}
        pageSize={DEFAULT_PAGESIZE}
        totalCount={totalCount}
        goToPage={setPageNum}
      >
        {paginatedSearches.length === 0 ? (
          <p>No saved searches found.</p>
        ) : (
          <Table striped responsive className="mt-3 mb-3">
            <thead>
              <tr>
                <th style={{ width: "70%" }}>Description</th>
                <th style={{ width: "20%" }}>Search Name</th>
                <th style={{ width: "10%" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSearches.map(savedSearch => (
                <tr key={savedSearch.uuid} className="align-middle">
                  <td style={{ paddingLeft: 0 }}>
                    <Button
                      className="text-start text-decoration-none"
                      variant="link"
                      onClick={() => showSearch(savedSearch)}
                    >
                      {deserializedQueries[savedSearch.uuid] && (
                        <SearchDescription
                          searchQuery={deserializedQueries[savedSearch.uuid]}
                          showText
                          style={{ pointerEvents: "none" }}
                        />
                      )}
                    </Button>
                  </td>
                  <td style={{ paddingRight: 0 }}>
                    <Button
                      className="text-start text-decoration-none"
                      variant="link"
                      onClick={() => showSearch(savedSearch)}
                    >
                      {savedSearch.name}
                    </Button>
                  </td>
                  <td>
                    <ConfirmDestructive
                      onConfirm={() => onConfirmDelete(savedSearch.uuid)}
                      objectType="search"
                      objectDisplay={savedSearch.name}
                      variant="danger"
                      operation="delete"
                    >
                      <Icon icon={IconNames.TRASH} />
                    </ConfirmDestructive>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </UltimatePaginationTopDown>
    </Fieldset>
  )

  function showSearch(search) {
    if (search) {
      const objType = SEARCH_OBJECT_TYPES[search.objectType]
      const queryParams = utils.parseJsonSafe(search.query)
      deserializeQueryParams(objType, queryParams, deserializeCallback)
    }
  }

  function deserializeCallback(objectType, filters, text) {
    // We update the Redux state
    setSearchQuery({
      objectType,
      filters,
      text
    })
    navigate("/search")
  }

  function onConfirmDelete(uuid) {
    return API.mutation(GQL_DELETE_SAVED_SEARCH, { uuid })
      .then(refetch)
      .catch(error => {
        setStateError(error)
        jumpToTop()
      })
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    setSearchQuery: searchQuery => dispatch(setSearchQuery(searchQuery)),
    ...pageDispatchers
  }
}

export default connect(null, mapDispatchToProps)(MySavedSearches)
