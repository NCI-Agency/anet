/* eslint-disable */
import { Popover, PopoverInteractionKind, Position } from "@blueprintjs/core"
import API from "api"
import { gql } from "apollo-boost"
import * as FieldHelper from "components/FieldHelper"
import UltimatePagination from "components/UltimatePagination"
import _isEmpty from "lodash/isEmpty"
import _isEqualWith from "lodash/isEqualWith"
import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { Button, Col, FormControl, InputGroup, Row } from "react-bootstrap"
import { useDebounce } from "use-debounce"
import utils from "utils"
import "./AdvancedSelect.css"

const hasMultipleItems = object => Object.keys(object).length > 1

const AdvancedSelectTarget = ({ overlayRef }) => (
  <Row>
    <Col
      className="form-group"
      ref={overlayRef}
      style={{ position: "relative", marginBottom: 0 }}
    />
  </Row>
)
AdvancedSelectTarget.propTypes = {
  overlayRef: PropTypes.shape({
    current: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
  })
}

const FilterAsNav = ({ items, currentFilter, handleOnClick }) =>
  hasMultipleItems(items) && (
    <Col md={4} xsHidden smHidden>
      <ul className="advanced-select-filters">
        {Object.keys(items).map(filterType => (
          <li
            key={filterType}
            className={currentFilter === filterType ? "active" : null}
          >
            <Button bsStyle="link" onClick={() => handleOnClick(filterType)}>
              {items[filterType].label}
            </Button>
          </li>
        ))}
      </ul>
    </Col>
  )
FilterAsNav.propTypes = {
  items: PropTypes.object,
  currentFilter: PropTypes.string,
  handleOnClick: PropTypes.func
}

const FilterAsDropdown = ({ items, handleOnChange }) =>
  hasMultipleItems(items) && (
    <Col style={{ minHeight: "80px" }} mdHidden lgHidden>
      <p style={{ padding: "5px 0" }}>
        Filter:
        <select onChange={handleOnChange} style={{ marginLeft: "5px" }}>
          {Object.keys(items).map(filterType => (
            <option key={filterType} value={filterType}>
              {items[filterType].label}
            </option>
          ))}
        </select>
      </p>
    </Col>
  )
FilterAsDropdown.propTypes = {
  items: PropTypes.object,
  handleOnChange: PropTypes.func
}

export const propTypes = {
  fieldName: PropTypes.string.isRequired, // input field name
  placeholder: PropTypes.string, // input field placeholder
  disabled: PropTypes.bool,
  selectedValueAsString: PropTypes.string,
  addon: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.object
  ]),
  extraAddon: PropTypes.object,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  renderSelected: PropTypes.oneOfType([PropTypes.func, PropTypes.object]), // how to render the selected items
  overlayTableClassName: PropTypes.string,
  overlayTable: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.object
  ]), // search results component for in the overlay
  overlayColumns: PropTypes.array.isRequired,
  overlayRenderRow: PropTypes.func.isRequired,
  closeOverlayOnAdd: PropTypes.bool, // set to true if you want the overlay to be closed after an add action
  filterDefs: PropTypes.object, // config of the search filters
  onChange: PropTypes.func,
  // Required: ANET Object Type (Person, Report, etc) to search for.
  objectType: PropTypes.func.isRequired,
  // Optional: Parameters to pass to all search filters.
  queryParams: PropTypes.object,
  // Optional: GraphQL string of fields to return from search.
  fields: PropTypes.string,
  handleAddItem: PropTypes.func,
  handleRemoveItem: PropTypes.func
}

const AdvancedSelect = ({
  fieldName,
  placeholder,
  disabled,
  selectedValueAsString,
  addon,
  extraAddon,
  value,
  renderSelected,
  overlayTableClassName,
  overlayTable: OverlayTable,
  overlayColumns,
  overlayRenderRow,
  closeOverlayOnAdd,
  filterDefs,
  onChange,
  objectType,
  queryParams,
  fields,
  handleAddItem,
  handleRemoveItem
}) => {
  const firstFilter = Object.keys(filterDefs)[0]

  const latestSelectedValueAsString = useRef(selectedValueAsString)
  const latestQueryParams = useRef(queryParams)
  const latestFilterDefs = useRef(filterDefs)
  const overlayContainer = useRef()
  const searchInput = useRef()

  const [searchTerms, setSearchTerms] = useState(selectedValueAsString || "")
  const [filterType, setFilterType] = useState(firstFilter) // per default use the first filter
  const [pageNum, setPageNum] = useState(0)
  const [results, setResults] = useState({})
  const [showOverlay, setShowOverlay] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [doFetchResults, setDoFetchResults] = useState(false)
  const [doFetchResultsDebounced, setDoFetchResultsDebounced] = useState(false)

  const selectedFilterList = latestFilterDefs.current[filterType].list
  const selectedFilterListName = latestFilterDefs.current[filterType].listName
  const selectedFilterQueryVars = latestFilterDefs.current[filterType].queryVars

  const renderSelectedWithDelete = renderSelected
    ? React.cloneElement(renderSelected, { onDelete: handleRemoveItem })
    : null
  const items = results && results[filterType] ? results[filterType].list : []

  useEffect(() => {
    if (
      !_isEqualWith(
        latestQueryParams.current,
        queryParams,
        utils.treatFunctionsAsEqual
      )
    ) {
      latestQueryParams.current = queryParams
    }
  }, [queryParams])

  useEffect(() => {
    if (
      !_isEqualWith(
        latestFilterDefs.current,
        filterDefs,
        utils.treatFunctionsAsEqual
      )
    ) {
      latestFilterDefs.current = filterDefs
    }
  }, [filterDefs])

  const resetSearchTerms = !showOverlay && selectedValueAsString !== searchTerms
  useEffect(() => {
    const selectedValueAsStringUnchanged = _isEqualWith(
      latestSelectedValueAsString.current,
      selectedValueAsString,
      utils.treatFunctionsAsEqual
    )
    if (!selectedValueAsStringUnchanged) {
      latestSelectedValueAsString.current = selectedValueAsString
    }
    // When the overlay is being closed, we reset the searchTerms to the selected value
    if (!selectedValueAsStringUnchanged || resetSearchTerms) {
      setSearchTerms(selectedValueAsString)
      setDoFetchResults(false)
      setDoFetchResultsDebounced(false)
    }
  }, [resetSearchTerms, selectedValueAsString])

  useEffect(() => {
    // No need to fetch the data, it is already provided in the filter definition
    if (selectedFilterList) {
      setIsLoading(!_isEmpty(selectedFilterList))
      setResults(oldResults => ({
        ...oldResults,
        [filterType]: {
          list: selectedFilterList,
          pageNum: pageNum,
          pageSize: 6,
          totalCount: selectedFilterList.length
        }
      }))
    }
  }, [filterType, pageNum, selectedFilterList])

  // FIXME: If there's a newer request happening, stop everything (otherwise, we might get the results of
  // a search on "art", after having searched on "arthur" because the search on art gives back the results as latest)
  const fetchResults = useCallback(
    searchTerms => {
      if (!selectedFilterList) {
        const resourceName = objectType.resourceName
        const listName = selectedFilterListName || objectType.listName
        const queryVars = { pageNum: pageNum, pageSize: 6 }
        if (latestQueryParams.current) {
          Object.assign(queryVars, latestQueryParams.current)
        }
        if (selectedFilterQueryVars) {
          Object.assign(queryVars, selectedFilterQueryVars)
        }
        if (searchTerms) {
          Object.assign(queryVars, { text: searchTerms + "*" })
        }
        API.query(
          gql`
          query($query: ${resourceName}SearchQueryInput) {
            ${listName}(query: $query) {
              pageNum
              pageSize
              totalCount
              list {
                ${fields}
              }
            }
          }
        `,
          { query: queryVars }
        ).then(data => {
          const isLoading = data[listName].totalCount !== 0
          setIsLoading(isLoading)
          setResults(oldResults => ({
            ...oldResults,
            [filterType]: data[listName]
          }))
        })
      }
    },
    [
      fields,
      filterType,
      objectType.listName,
      objectType.resourceName,
      pageNum,
      selectedFilterList,
      selectedFilterListName,
      selectedFilterQueryVars
    ]
  )

  const [searchTermsDebounced] = useDebounce(searchTerms, 400)

  useEffect(() => {
    if (doFetchResultsDebounced) {
      fetchResults(searchTermsDebounced)
    }
  }, [doFetchResultsDebounced, fetchResults, searchTermsDebounced])

  useEffect(() => {
    if (doFetchResults) {
      fetchResults(searchTerms)
    }
  }, [doFetchResults, fetchResults, searchTerms])

  const advancedSearchPopoverContent = (
    <Row className="border-between">
      <FilterAsNav
        items={filterDefs}
        currentFilter={filterType}
        handleOnClick={changeFilterType}
      />

      <FilterAsDropdown
        items={filterDefs}
        handleOnChange={handleOnChangeSelect}
      />

      <Col md={hasMultipleItems(filterDefs) ? 8 : 12}>
        <OverlayTable
          fieldName={fieldName}
          items={items}
          selectedItems={value}
          handleAddItem={item => {
            handleAddItem(item)
            if (closeOverlayOnAdd) {
              handleHideOverlay()
            }
          }}
          handleRemoveItem={handleRemoveItem}
          objectType={objectType}
          columns={[""].concat(overlayColumns)}
          renderRow={overlayRenderRow}
          isLoading={isLoading}
          loaderMessage={<div style={{ width: "300px" }}>No results found</div>}
          tableClassName={overlayTableClassName}
        />
        {paginationFor(filterType)}
      </Col>
    </Row>
  )

  return (
    <>
      {!(disabled && renderSelectedWithDelete) && (
        <>
          <div id={`${fieldName}-popover`}>
            <InputGroup>
              <Popover
                className="advanced-select-popover"
                popoverClassName="bp3-popover-content-sizing"
                content={advancedSearchPopoverContent}
                isOpen={showOverlay}
                captureDismiss
                interactionKind={PopoverInteractionKind.CLICK}
                onInteraction={handleInteraction}
                usePortal={false}
                position={Position.BOTTOM}
                modifiers={{
                  preventOverflow: {
                    enabled: false
                  },
                  hide: {
                    enabled: false
                  },
                  flip: {
                    enabled: false
                  }
                }}
              >
                <FormControl
                  name={fieldName}
                  value={searchTerms || ""}
                  placeholder={placeholder}
                  onChange={changeSearchTerms}
                  onFocus={disabled ? undefined : handleInputFocus}
                  inputRef={ref => {
                    searchInput.current = ref
                  }}
                  disabled={disabled}
                />
              </Popover>
              {extraAddon && <InputGroup.Addon>{extraAddon}</InputGroup.Addon>}
              {addon && (
                <FieldHelper.FieldAddon fieldId={fieldName} addon={addon} />
              )}
            </InputGroup>
          </div>
          <AdvancedSelectTarget overlayRef={overlayContainer} />
        </>
      )}
      <Row>
        <Col sm={12}>{renderSelectedWithDelete}</Col>
      </Row>
    </>
  )

  function handleInputFocus() {
    if (!showOverlay) {
      // When doing input focus while the overlay is closed, empty the search terms and show the overlay
      setSearchTerms("")
      setShowOverlay(true)
      setIsLoading(true)
      setDoFetchResults(true)
    }
  }

  function handleInteraction(showOverlay, event) {
    // Make sure the overlay is being closed when clicking outside of it
    const inputFocus = searchInput.current.contains(event && event.target)
    setShowOverlay(showOverlay || inputFocus)
  }

  function handleHideOverlay() {
    setFilterType(firstFilter)
    setSearchTerms("")
    setResults({})
    setPageNum(0)
    setIsLoading(false)
    setShowOverlay(false)
    setDoFetchResults(false)
  }

  function changeSearchTerms(event) {
    setSearchTerms(event.target.value)
    // Reset the results state when the search terms change
    setResults({})
    setPageNum(0)
    setDoFetchResultsDebounced(true)
    setDoFetchResults(false)
  }

  function handleOnChangeSelect(event) {
    changeFilterType(event.target.value)
  }

  function changeFilterType(filterType) {
    // When changing the filter type, only fetch the results if they were not fetched before
    const filterResults = results[filterType]
    const shouldFetchResults = _isEmpty(filterResults)
    setDoFetchResults(shouldFetchResults)
    setDoFetchResultsDebounced(false)
    setIsLoading(shouldFetchResults)
    setFilterType(filterType)
  }

  function paginationFor(filterType) {
    const pageSize =
      results && results[filterType] ? results[filterType].pageSize : 6
    const pageNum =
      results && results[filterType] ? results[filterType].pageNum : 0
    const totalCount =
      results && results[filterType] ? results[filterType].totalCount : 0
    return (
      <UltimatePagination
        Component="footer"
        componentClassName="searchPagination"
        className="pull-right"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={goToPage}
      />
    )
  }

  function goToPage(pageNum) {
    setPageNum(pageNum)
    setDoFetchResults(true)
    setDoFetchResultsDebounced(false)
  }
}
AdvancedSelect.propTypes = propTypes
AdvancedSelect.defaultProps = {
  disabled: false,
  filterDefs: {},
  closeOverlayOnAdd: false,
  selectedValueAsString: ""
}

export default AdvancedSelect
