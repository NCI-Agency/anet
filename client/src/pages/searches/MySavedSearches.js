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
  useBoilerplate
} from "components/Page"
import SavedSearchTable from "components/SavedSearchTable"
import { deserializeQueryParams } from "components/SearchFilters"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, ControlLabel, FormControl, FormGroup } from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
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
  mutation($uuid: String!) {
    deleteSavedSearch(uuid: $uuid)
  }
`

const MySavedSearches = ({ setSearchQuery, pageDispatchers }) => {
  const history = useHistory()
  const [stateError, setStateError] = useState(null)
  const [selectedSearch, setSelectedSearch] = useState(null)
  const { loading, error, data, refetch } = API.useApiQuery(
    GQL_GET_SAVED_SEARCHES
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    return result
  }

  let savedSearches = []
  if (data) {
    savedSearches = data.savedSearches
    if (_isEmpty(savedSearches)) {
      if (selectedSearch) {
        // Clear selection
        setSelectedSearch(null)
      }
    } else if (!savedSearches.includes(selectedSearch)) {
      // Select first one
      setSelectedSearch(savedSearches[0])
    }
  }

  return (
    <Fieldset title="Saved searches">
      <Messages error={stateError} />
      <FormGroup controlId="savedSearchSelect">
        <ControlLabel>Select a saved search</ControlLabel>
        <FormControl componentClass="select" onChange={onSaveSearchSelect}>
          {savedSearches &&
            savedSearches.map(savedSearch => (
              <option value={savedSearch.uuid} key={savedSearch.uuid}>
                {savedSearch.name}
              </option>
            ))}
        </FormControl>
      </FormGroup>

      {selectedSearch && (
        <div>
          <div className="pull-right">
            <Button style={{ marginRight: 12 }} onClick={showSearch}>
              Show Search
            </Button>
            <ConfirmDestructive
              onConfirm={onConfirmDelete}
              objectType="search"
              objectDisplay={selectedSearch.name}
              bsStyle="danger"
              buttonLabel="Delete Search"
            />
          </div>
          <SavedSearchTable search={selectedSearch} />
        </div>
      )}
    </Fieldset>
  )

  function onSaveSearchSelect(event) {
    const uuid = event && event.target ? event.target.value : event
    const search = savedSearches.find(el => el.uuid === uuid)
    setSelectedSearch(search)
  }

  function showSearch() {
    if (selectedSearch) {
      const objType = SEARCH_OBJECT_TYPES[selectedSearch.objectType]
      const queryParams = utils.parseJsonSafe(selectedSearch.query)
      deserializeQueryParams(objType, queryParams, deserializeCallback)
    }
  }

  function deserializeCallback(objectType, filters, text) {
    // We update the Redux state
    setSearchQuery({
      objectType: objectType,
      filters: filters,
      text: text
    })
    history.push("/search")
  }

  function onConfirmDelete() {
    return API.mutation(GQL_DELETE_SAVED_SEARCH, { uuid: selectedSearch.uuid })
      .then(data => {
        refetch()
      })
      .catch(error => {
        setStateError(error)
        jumpToTop()
      })
  }
}

MySavedSearches.propTypes = {
  setSearchQuery: PropTypes.func.isRequired,
  pageDispatchers: PageDispatchersPropType
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    setSearchQuery: searchQuery => dispatch(setSearchQuery(searchQuery)),
    ...pageDispatchers
  }
}

export default connect(null, mapDispatchToProps)(MySavedSearches)
