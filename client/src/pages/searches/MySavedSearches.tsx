import { gql } from "@apollo/client"
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
import { deserializeQueryParams } from "components/SearchFilters"
import _isEmpty from "lodash/isEmpty"
import React, { useState } from "react"
import { Button, Col, Row, Table } from "react-bootstrap"
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

const MySavedSearches = ({
  setSearchQuery,
  pageDispatchers
}: MySavedSearchesProps) => {
  const navigate = useNavigate()
  const [stateError, setStateError] = useState(null)
  const { loading, error, data, refetch } = API.useApiQuery(
    GQL_GET_SAVED_SEARCHES
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  usePageTitle("My Saved Searches")
  if (done) {
    return result
  }

  const savedSearches = data?.savedSearches || []

  return (
    <Fieldset title="Saved searches">
      <Messages error={stateError} />

      {savedSearches.length > 0 ? (
        <Table striped responsive>
          <thead>
            <tr>
              <th style={{ width: "80%" }}>Search Name</th>
              <th style={{ width: "20%" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {savedSearches.map(savedSearch => (
              <tr key={savedSearch.uuid}>
                <td>
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
                    buttonLabel="Delete"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p>No saved searches found.</p>
      )}
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
      .then(data => {
        refetch()
      })
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
