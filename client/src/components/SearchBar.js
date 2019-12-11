import { Popover, PopoverInteractionKind, Position } from "@blueprintjs/core"
import { resetPagination, SEARCH_OBJECT_LABELS, setSearchQuery } from "actions"
import AdvancedSearch from "components/AdvancedSearch"
import { SearchDescription } from "components/SearchFilters"
import _isEqual from "lodash/isEqual"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"
import { Button, Form, FormControl, InputGroup } from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import SEARCH_ICON from "resources/search-alt.png"

export const SearchPopover = ({ popoverContent, children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const _handleInteraction = isOpen => setIsOpen(isOpen)
  return (
    <Popover
      isOpen={isOpen}
      onInteraction={_handleInteraction}
      boundary="window"
      captureDismiss
      content={popoverContent}
      interactionKind={PopoverInteractionKind.CLICK}
      position={Position.BOTTOM_LEFT}
      usePortal={false}
      modifiers={{
        preventOverflow: {
          enabled: false
        },
        flip: {
          enabled: false
        }
      }}
    >
      {children}
    </Popover>
  )
}

SearchPopover.propTypes = {
  popoverContent: PropTypes.element.isRequired,
  children: PropTypes.any.isRequired
}

const SearchBar = props => {
  const {
    query,
    searchObjectTypes,
    resetPagination,
    setSearchQuery,
    onSearchGoToSearchPage
  } = props
  const history = useHistory()
  // (Re)set searchTerms if the query.text prop changes
  const latestQueryText = useRef(query.text)
  const queryTextUnchanged = _isEqual(latestQueryText.current, query.text)
  const [searchTerms, setSearchTerms] = useState(query.text)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)

  useEffect(() => {
    if (!queryTextUnchanged) {
      latestQueryText.current = query.text
      setSearchTerms(query.text)
    }
  }, [query, setSearchTerms, queryTextUnchanged])

  const placeholder = query.objectType
    ? "Filter " + SEARCH_OBJECT_LABELS[query.objectType]
    : "Search for " +
      searchObjectTypes.map(type => SEARCH_OBJECT_LABELS[type]).join(", ")

  const PopoverContent = (
    <AdvancedSearch
      onSearch={runAdvancedSearch}
      onCancel={setShowAdvancedSearch}
      text={searchTerms}
    />
  )
  return (
    <>
      <Form onSubmit={onSubmit} className="advanced-search-form">
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
      <SearchPopover popoverContent={PopoverContent}>
        <SearchDescription query={query} showPlaceholders />
      </SearchPopover>
    </>
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

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar)
