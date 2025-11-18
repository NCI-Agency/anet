import { Popover, PopoverInteractionKind } from "@blueprintjs/core"
import { resetPagination, SEARCH_OBJECT_LABELS, setSearchQuery } from "actions"
import AdvancedSearch from "components/AdvancedSearch"
import {
  SearchDescription,
  SearchQueryPropType
} from "components/SearchFilters"
import _isEqual from "lodash/isEqual"
import React, { useEffect, useRef, useState } from "react"
import { Button, Form, FormControl, InputGroup } from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"
import SEARCH_ICON from "resources/search-alt.png"

interface SearchPopoverProps {
  popoverContent: React.ReactElement
  isOpen: boolean
  setIsOpen: (...args: unknown[]) => unknown
  children: React.ReactNode
}

export const SearchPopover = ({
  popoverContent,
  isOpen,
  setIsOpen,
  children
}: SearchPopoverProps) => {
  return (
    <Popover
      isOpen={isOpen}
      onInteraction={isOpen => setIsOpen(isOpen)}
      boundary="window"
      captureDismiss
      content={popoverContent}
      interactionKind={PopoverInteractionKind.CLICK_TARGET_ONLY}
      placement="bottom-start"
      usePortal={false}
      autoFocus
      enforceFocus={false}
      className="search-popover-target"
      modifiers={{
        preventOverflow: {
          enabled: true
        },
        hide: {
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

interface SearchBarProps {
  setSearchQuery: (...args: unknown[]) => unknown
  onSearchGoToSearchPage?: boolean
  searchQuery?: SearchQueryPropType
  searchObjectTypes?: any[]
  resetPagination: (...args: unknown[]) => unknown
}

const SearchBar = ({
  searchQuery,
  searchObjectTypes,
  resetPagination,
  setSearchQuery,
  onSearchGoToSearchPage
}: SearchBarProps) => {
  const navigate = useNavigate()
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
      onSearch={() => setShowAdvancedSearch(false)}
      onCancel={() => setShowAdvancedSearch(false)}
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
            <Button
              onClick={onSubmit}
              id="searchBarSubmit"
              variant="outline-light"
              style={{ borderColor: "#ced4da" }}
            >
              <img
                src={SEARCH_ICON}
                height={16}
                alt="Search"
                style={{ color: "white" }}
              />
            </Button>
          )}
        </InputGroup>
      </Form>
      <SearchPopover
        popoverContent={popoverContent}
        isOpen={showAdvancedSearch}
        setIsOpen={setShowAdvancedSearch}
      >
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
        navigate("/search")
      }
    }
    event.preventDefault()
    event.stopPropagation()
  }
}

const mapStateToProps = state => ({
  searchQuery: state.searchQuery,
  onSearchGoToSearchPage: state.searchProps.onSearchGoToSearchPage,
  searchObjectTypes: state.searchProps.searchObjectTypes
})

const mapDispatchToProps = dispatch => ({
  setSearchQuery: searchTerms => dispatch(setSearchQuery(searchTerms)),
  resetPagination: () => dispatch(resetPagination())
})

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar)
