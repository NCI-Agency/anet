import { gql } from "@apollo/client"
import { Checkbox, Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { SEARCH_OBJECT_TYPES, setSearchQuery } from "actions"
import API from "api"
import ConfirmDestructive from "components/ConfirmDestructive"
import DraggableRow from "components/DraggableRow"
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
import _isEmpty from "lodash/isEmpty"
import React, { useEffect, useMemo, useState } from "react"
import { Button, Table } from "react-bootstrap"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
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
      displayInHomepage
      priority
      homepagePriority
    }
  }
`

const GQL_DELETE_SAVED_SEARCH = gql`
  mutation ($uuid: String!) {
    deleteSavedSearch(uuid: $uuid)
  }
`

const GQL_UPDATE_SAVED_SEARCH = gql`
  mutation ($savedSearch: SavedSearchInput!) {
    updateSavedSearch(savedSearch: $savedSearch)
  }
`

interface MySavedSearchesProps {
  setSearchQuery: (...args: unknown[]) => unknown
  pageDispatchers?: PageDispatchersPropType
}

const MySavedSearches = ({
  setSearchQuery,
  pageDispatchers
}: MySavedSearchesProps) => {
  const navigate = useNavigate()
  const [stateError, setStateError] = useState(null)
  const [deserializedQueries, setDeserializedQueries] = useState({})
  const [searches, setSearches] = useState([])
  const { loading, error, data, refetch } = API.useApiQuery(
    GQL_GET_SAVED_SEARCHES
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  usePageTitle("My Saved Searches")

  const totalCount = useMemo(() => data?.savedSearches?.length || 0, [data])

  const updateDisplayInHomepage = search => {
    search.displayInHomepage = !search.displayInHomepage
    if (!search.displayInHomepage) {
      search.homepagePriority = null
    } else {
      const homepagePriorities: number[] = searches
        .filter(s => utils.isNumeric(s.homepagePriority))
        .map(s => s.homepagePriority)
      search.homepagePriority = _isEmpty(homepagePriorities)
        ? 0.0
        : Math.max(...homepagePriorities) + 1.0
    }
    API.mutation(GQL_UPDATE_SAVED_SEARCH, {
      savedSearch: search
    })
    setSearches([...searches])
  }

  useEffect(() => {
    if (data?.savedSearches) {
      const newQueries = {}
      data.savedSearches.forEach(search => {
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
      setSearches([...data.savedSearches])
    }
  }, [data, setDeserializedQueries, setSearches])

  if (done) {
    return result
  }

  const moveRow = (from, to) => {
    setSearches(prevSearches => {
      const updatedSearches = [...prevSearches]
      const [removed] = updatedSearches.splice(from, 1)
      updatedSearches.splice(to, 0, removed)

      let newPriority
      if (to === 0) {
        newPriority = updatedSearches[0].priority - 1
      } else if (to === updatedSearches.length - 1) {
        newPriority = updatedSearches[updatedSearches.length - 1].priority + 1.0
      } else {
        const above = updatedSearches[to - 1].priority
        const below = updatedSearches[to + 1].priority
        newPriority = (above + below) / 2
      }

      updatedSearches[to].priority = newPriority
      return updatedSearches
    })
  }

  const onDropRow = (uuid, toIndex) => {
    const search = searches.find(s => s.uuid === uuid)
    if (!search) {
      return
    }
    API.mutation(GQL_UPDATE_SAVED_SEARCH, { savedSearch: search })
  }

  return (
    <Fieldset title="Saved searches">
      <Messages error={stateError} />
      <UltimatePaginationTopDown
        componentClassName="searchPagination"
        className="float-end"
        totalCount={totalCount}
      >
        {searches.length === 0 ? (
          <p className="mb-0">No saved searches found.</p>
        ) : (
          <DndProvider backend={HTML5Backend}>
            <Table striped responsive>
              <thead>
                <tr style={{ verticalAlign: "middle" }}>
                  <th style={{ width: "5%" }} />
                  <th style={{ width: "70%" }}>Description</th>
                  <th style={{ width: "20%" }}>Search Name</th>
                  <th style={{ width: "5%" }}>Display In Homepage</th>
                  <th style={{ width: "5%" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {searches.map((search, i) => (
                  <DraggableRow
                    itemType="SAVED_SEARCH_ROW"
                    row={search}
                    index={i}
                    key={search.uuid}
                    moveRow={moveRow}
                    onDropRow={onDropRow}
                    dragHandleProps={{}}
                    asTableRow
                  >
                    <td style={{ paddingLeft: 0 }}>
                      <Button
                        className="text-start text-decoration-none"
                        variant="link"
                        onClick={() => showSearch(search)}
                      >
                        {deserializedQueries[search.uuid] && (
                          <SearchDescription
                            searchQuery={deserializedQueries[search.uuid]}
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
                        onClick={() => showSearch(search)}
                      >
                        {search.name}
                      </Button>
                    </td>
                    <td className="text-center">
                      <Checkbox
                        checked={search.displayInHomepage}
                        onChange={() => updateDisplayInHomepage(search)}
                      />
                    </td>
                    <td className="text-start">
                      <ConfirmDestructive
                        onConfirm={() => onConfirmDelete(search.uuid)}
                        objectType="search"
                        objectDisplay={search.name}
                        variant="danger"
                        operation="delete"
                      >
                        <Icon icon={IconNames.TRASH} />
                      </ConfirmDestructive>
                    </td>
                  </DraggableRow>
                ))}
              </tbody>
            </Table>
          </DndProvider>
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
