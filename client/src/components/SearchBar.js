import { Popover, PopoverInteractionKind, Position } from "@blueprintjs/core"
import { resetPagination, SEARCH_OBJECT_LABELS, setSearchQuery } from "actions"
import AdvancedSearch from "components/AdvancedSearch"
import {
  SearchDescription,
  SearchQueryPropType
} from "components/SearchFilters"
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

const SearchBar = ({
  searchQuery,
  searchObjectTypes,
  resetPagination,
  setSearchQuery,
  onSearchGoToSearchPage
}) => {
  const history = useHistory()
  // (Re)set searchTerms if the searchQuery.text prop changes
  const latestQueryText = useRef(searchQuery.text)
  const queryTextUnchanged = _isEqual(latestQueryText.current, searchQuery.text)
  const [searchTerms, setSearchTerms] = useState(searchQuery.text)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)

  useEffect(() => {
    if (!queryTextUnchanged) {
      latestQueryText.current = searchQuery.text
      setSearchTerms(searchQuery.text)
    }
  }, [searchQuery, setSearchTerms, queryTextUnchanged])

  const placeholder = searchQuery.objectType
    ? "Filter " + SEARCH_OBJECT_LABELS[searchQuery.objectType]
    : "Search for " +
      searchObjectTypes.map(type => SEARCH_OBJECT_LABELS[type]).join(", ")

  const popoverContent = (
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
      <SearchPopover popoverContent={popoverContent}>
        <SearchDescription searchQuery={searchQuery} showPlaceholders />
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
  searchQuery: SearchQueryPropType,
  searchObjectTypes: PropTypes.array,
  resetPagination: PropTypes.func.isRequired
}

const mapStateToProps = (state, ownProps) => ({
  searchQuery: state.searchQuery,
  onSearchGoToSearchPage: state.searchProps.onSearchGoToSearchPage,
  searchObjectTypes: state.searchProps.searchObjectTypes
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  setSearchQuery: searchTerms => dispatch(setSearchQuery(searchTerms)),
  resetPagination: () => dispatch(resetPagination())
})

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar)
