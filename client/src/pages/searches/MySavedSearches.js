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
import SavedSearchTable from "components/SavedSearchTable"
import { deserializeQueryParams } from "components/SearchFilters"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Col, Form, Row } from "react-bootstrap"
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

const MySavedSearches = ({ setSearchQuery, pageDispatchers }) => {
  const navigate = useNavigate()
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
  usePageTitle("My Saved Searches")
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
      <Form.Group as={Row} className="mb-3" controlId="savedSearchSelect">
        <Form.Label column sm={2}>
          <b>Select a saved search</b>
        </Form.Label>
        <Col sm={10}>
          <Form.Select onChange={onSaveSearchSelect}>
            {savedSearches &&
              savedSearches.map(savedSearch => (
                <option value={savedSearch.uuid} key={savedSearch.uuid}>
                  {savedSearch.name}
                </option>
              ))}
          </Form.Select>
        </Col>
      </Form.Group>

      {selectedSearch && (
        <div>
          <Row>
            <Col sm={8}>
              <SavedSearchTable search={selectedSearch} />
            </Col>
            <Col className="text-end">
              <Button style={{ marginRight: 12 }} onClick={showSearch}>
                Show Search
              </Button>
              <ConfirmDestructive
                onConfirm={onConfirmDelete}
                objectType="search"
                objectDisplay={selectedSearch.name}
                variant="danger"
                buttonLabel="Delete Search"
              />
            </Col>
          </Row>
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
      objectType,
      filters,
      text
    })
    navigate("/search")
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
