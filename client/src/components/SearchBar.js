import { resetPagination, SEARCH_OBJECT_LABELS, setSearchQuery } from "actions"
import AdvancedSearch from "components/AdvancedSearch"
import { SearchDescription } from "components/SearchFilters"
import PropTypes from "prop-types"
import React, { useRef, useState } from "react"
import {
  Button,
  Form,
  FormControl,
  InputGroup,
  Overlay,
  Popover
} from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import SEARCH_ICON from "resources/search-alt.png"

const SearchBar = props => {
  const {
    query,
    searchObjectTypes,
    resetPagination,
    setSearchQuery,
    onSearchGoToSearchPage
  } = props
  const history = useHistory()
  const advancedSearchLink = useRef()
  const [searchTerms, setSearchTerms] = useState(query.text)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const placeholder = query.objectType
    ? "Filter " + SEARCH_OBJECT_LABELS[query.objectType]
    : "Search for " +
      searchObjectTypes.map(type => SEARCH_OBJECT_LABELS[type]).join(", ")

  return (
    <div>
      <Form onSubmit={onSubmit}>
        <InputGroup>
          <FormControl
            value={searchTerms}
            placeholder={placeholder}
            onChange={onChange}
            id="searchBarInput"
          />
          {!showAdvancedSearch && (
            <InputGroup.Button>
              <Button onClick={onSubmit} id="searchBarSubmit">
                <img src={SEARCH_ICON} height={16} alt="Search" />
              </Button>
            </InputGroup.Button>
          )}
        </InputGroup>
      </Form>

      <div
        className="add-search-filter"
        ref={advancedSearchLink}
        onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
      >
        <SearchDescription query={query} showPlaceholders />
      </div>
      <Overlay
        show={showAdvancedSearch}
        onHide={() => setShowAdvancedSearch(false)}
        placement="bottom"
        target={advancedSearchLink.current}
        rootClose
      >
        <Popover id="advanced-search" placement="bottom" title="Filters">
          <AdvancedSearch
            onSearch={runAdvancedSearch}
            onCancel={() => setShowAdvancedSearch(false)}
            text={searchTerms}
          />
        </Popover>
      </Overlay>
    </div>
  )

  function onChange(event) {
    setSearchTerms(event.target.value)
  }

  function onSubmit(event) {
    if (!showAdvancedSearch) {
      // We only update the Redux state on submit
      resetPagination()
      setSearchQuery({ text: searchTerms })
      if (onSearchGoToSearchPage) {
        history.push("/search")
      }
    }
    event.preventDefault()
    event.stopPropagation()
  }

  function runAdvancedSearch() {
    setShowAdvancedSearch(false)
  }
}

SearchBar.propTypes = {
  setSearchQuery: PropTypes.func.isRequired,
  onSearchGoToSearchPage: PropTypes.bool,
  query: PropTypes.shape({
    text: PropTypes.string,
    filters: PropTypes.any,
    objectType: PropTypes.string
  }),
  searchObjectTypes: PropTypes.array,
  resetPagination: PropTypes.func.isRequired
}

const mapStateToProps = (state, ownProps) => ({
  query: state.searchQuery,
  onSearchGoToSearchPage: state.searchProps.onSearchGoToSearchPage,
  searchObjectTypes: state.searchProps.searchObjectTypes
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  setSearchQuery: searchTerms => dispatch(setSearchQuery(searchTerms)),
  resetPagination: () => dispatch(resetPagination())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SearchBar)
