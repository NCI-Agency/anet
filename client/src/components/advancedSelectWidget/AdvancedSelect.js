import { gql } from "@apollo/client"
import { Popover, PopoverInteractionKind } from "@blueprintjs/core"
import API from "api"
import classNames from "classnames"
import UltimatePagination from "components/UltimatePagination"
import _isEmpty from "lodash/isEmpty"
import _isEqualWith from "lodash/isEqualWith"
import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap"
import { useDebouncedCallback } from "use-debounce"
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
    <Col md={3} className="d-none d-md-block">
      <ul className="advanced-select-filters" style={{ paddingInlineStart: 0 }}>
        {Object.entries(items).map(([filterType, filter]) => (
          <li
            key={filterType}
            className={currentFilter === filterType ? "active" : null}
          >
            <Button variant="link" onClick={() => handleOnClick(filterType)}>
              {filter.label}
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
    <Col className="d-xs-block d-md-none">
      <p style={{ padding: "5px 0" }}>
        Filter:
        <select onChange={handleOnChange} style={{ marginLeft: "5px" }}>
          {Object.entries(items).map(([filterType, filter]) => (
            <option key={filterType} value={filterType}>
              {filter.label}
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

const FETCH_TYPE = {
  NONE: "NONE",
  NORMAL: "NORMAL",
  DEBOUNCED: "DEBOUNCED"
}

export const propTypes = {
  fieldName: PropTypes.string.isRequired, // input field name
  className: PropTypes.string,
  placeholder: PropTypes.string, // input field placeholder
  pageSize: PropTypes.number,
  disabled: PropTypes.bool,
  selectedValueAsString: PropTypes.string,
  keepSearchText: PropTypes.bool,
  addon: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.object
  ]),
  extraAddon: PropTypes.object,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  valueKey: PropTypes.string,
  renderSelected: PropTypes.oneOfType([PropTypes.func, PropTypes.object]), // how to render the selected items
  overlayTable: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.object
  ]), // search results component for in the overlay
  overlayColumns: PropTypes.array.isRequired,
  overlayRenderRow: PropTypes.func.isRequired,
  closeOverlayOnAdd: PropTypes.bool, // set to true if you want the overlay to be closed after an add action
  filterDefs: PropTypes.object.isRequired, // config of the search filters
  onChange: PropTypes.func,
  // Required: ANET Object Type (Person, Report, etc) to search for.
  objectType: PropTypes.func.isRequired,
  // Optional: Parameters to pass to all search filters.
  queryParams: PropTypes.object,
  // Optional: GraphQL string of fields to return from search.
  fields: PropTypes.string,
  handleAddItem: PropTypes.func,
  handleRemoveItem: PropTypes.func,
  createEntityComponent: PropTypes.func
}

const AdvancedSelect = ({
  fieldName,
  className,
  placeholder,
  pageSize,
  disabled,
  selectedValueAsString,
  keepSearchText,
  addon,
  extraAddon,
  value,
  valueKey,
  renderSelected,
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
  handleRemoveItem,
  createEntityComponent
}) => {
  const firstFilter = Object.keys(filterDefs)[0]

  const latestSelectedValueAsString = useRef(selectedValueAsString)
  const latestQueryParams = useRef(queryParams)
  const [latestFilterDefs, setLatestFilterDefs] = useState(filterDefs)
  const overlayContainer = useRef()
  const searchInput = useRef()
  const latestRequest = useRef()

  const [searchTerms, setSearchTerms] = useState(
    latestSelectedValueAsString.current
  )
  const [filterType, setFilterType] = useState(firstFilter) // by default use the first filter
  const [pageNum, setPageNum] = useState(0)
  const [results, setResults] = useState({})
  const [showOverlay, setShowOverlay] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateEntityComponent, setShowCreateEntityComponent] =
    useState(false)
  const [fetchType, setFetchType] = useState(FETCH_TYPE.NONE)
  const [doReset, setDoReset] = useState(false)

  const selectedFilter = latestFilterDefs[filterType]
  const renderSelectedWithDelete = renderSelected
    ? React.cloneElement(renderSelected, { onDelete: handleRemoveItem })
    : null
  const [items, totalCount] =
    results && results[filterType]
      ? [results[filterType].list, results[filterType].totalCount]
      : [[], 0]

  const fetchResults = useCallback(
    searchTerms => {
      if (!selectedFilter?.list) {
        const resourceName = objectType.resourceName
        const listName = selectedFilter?.listName || objectType.listName
        const queryVars = { pageNum, pageSize }
        if (latestQueryParams.current) {
          Object.assign(queryVars, latestQueryParams.current)
        }
        if (selectedFilter?.queryVars) {
          Object.assign(queryVars, selectedFilter?.queryVars)
        }
        if (searchTerms) {
          Object.assign(queryVars, { text: searchTerms + "*" })
        }
        const thisRequest = (latestRequest.current = API.query(
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
          // If this is true there's a newer request happening, stop everything
          if (thisRequest !== latestRequest.current) {
            return
          }
          setIsLoading(data[listName].totalCount !== 0)
          setResults(oldResults => ({
            ...oldResults,
            [filterType]: data[listName]
          }))
        }))
      }
    },
    [
      fields,
      filterType,
      objectType.listName,
      objectType.resourceName,
      pageNum,
      pageSize,
      selectedFilter?.list,
      selectedFilter?.listName,
      selectedFilter?.queryVars
    ]
  )

  const fetchResultsDebounced = useDebouncedCallback(fetchResults, 400)

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
      !_isEqualWith(latestFilterDefs, filterDefs, utils.treatFunctionsAsEqual)
    ) {
      setFilterType(firstFilter)
      setLatestFilterDefs(filterDefs)
    }
  }, [filterDefs, latestFilterDefs, firstFilter])

  useEffect(() => {
    if (latestSelectedValueAsString.current !== selectedValueAsString) {
      latestSelectedValueAsString.current = selectedValueAsString
      setSearchTerms(selectedValueAsString)
      setFetchType(FETCH_TYPE.NONE)
    }
  }, [selectedValueAsString])

  useEffect(() => {
    // No need to fetch the data, it is already provided in the filter definition
    if (selectedFilter.list) {
      setIsLoading(!_isEmpty(selectedFilter.list))
      setResults(oldResults => ({
        ...oldResults,
        [filterType]: {
          list: selectedFilter.list,
          pageNum,
          pageSize,
          totalCount: selectedFilter.list.length
        }
      }))
    }
  }, [filterType, pageNum, pageSize, selectedFilter?.list])

  useEffect(() => {
    if (fetchType === FETCH_TYPE.NORMAL) {
      fetchResults(searchTerms)
    } else if (fetchType === FETCH_TYPE.DEBOUNCED) {
      fetchResultsDebounced(searchTerms)
    }
  }, [fetchType, fetchResults, fetchResultsDebounced, searchTerms])

  useEffect(() => {
    if (doReset) {
      setIsLoading(false)
      setShowOverlay(false)
      setFilterType(firstFilter)
      setShowCreateEntityComponent(false)
      if (!keepSearchText) {
        setSearchTerms(selectedValueAsString)
      }
      setResults({})
      setPageNum(0)
      setFetchType(FETCH_TYPE.NONE)
      setDoReset(false)
    }
  }, [doReset, firstFilter, selectedValueAsString, keepSearchText])

  return (
    <>
      {!(disabled && renderSelectedWithDelete) && (
        <>
          <div className={classNames(className, "advanced-select-popover")}>
            <InputGroup>
              <Popover
                popoverClassName="advanced-select-popover bp5-popover-content-sizing"
                content={
                  <Row id={`${fieldName}-popover`} className="border-between">
                    {(showCreateEntityComponent && (
                      <Col md="12">
                        {createEntityComponent(searchTerms, setDoReset)}
                      </Col>
                    )) || (
                      <>
                        <FilterAsNav
                          items={filterDefs}
                          currentFilter={filterType}
                          handleOnClick={changeFilterType}
                        />

                        <FilterAsDropdown
                          items={filterDefs}
                          handleOnChange={handleOnChangeSelect}
                        />

                        <Col md={hasMultipleItems(filterDefs) ? 9 : 12}>
                          <OverlayTable
                            fieldName={fieldName}
                            items={items}
                            pageNum={pageNum}
                            selectedItems={value}
                            valueKey={valueKey}
                            handleAddItem={item => {
                              handleAddItem(item)
                              if (closeOverlayOnAdd) {
                                setDoReset(true)
                              }
                            }}
                            handleRemoveItem={handleRemoveItem}
                            objectType={objectType}
                            columns={[""].concat(overlayColumns)}
                            renderRow={overlayRenderRow}
                            isLoading={isLoading}
                            loaderMessage={
                              <div style={{ width: "300px" }}>
                                <div>No results found.</div>
                                {createEntityComponent && (
                                  <div>
                                    <Button
                                      id="createEntityLink"
                                      onClick={() =>
                                        setShowCreateEntityComponent(true)}
                                    >
                                      Create a new {fieldName}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            }
                          />
                          <UltimatePagination
                            Component="footer"
                            componentClassName="searchPagination"
                            className="float-end"
                            pageNum={pageNum}
                            pageSize={pageSize}
                            totalCount={totalCount}
                            goToPage={goToPage}
                          />
                        </Col>
                      </>
                    )}
                  </Row>
                }
                isOpen={showOverlay}
                captureDismiss
                disabled={disabled}
                interactionKind={PopoverInteractionKind.CLICK}
                onInteraction={handleInteraction}
                usePortal
                autoFocus={false}
                enforceFocus={false}
                placement="bottom"
                modifiers={{
                  preventOverflow: {
                    enabled: false
                  },
                  hide: {
                    enabled: false
                  },
                  flip: {
                    enabled: true
                  }
                }}
              >
                <InputGroup>
                  <Form.Control
                    name={fieldName}
                    value={searchTerms || ""}
                    placeholder={placeholder}
                    onChange={changeSearchTerms}
                    onFocus={event => handleInteraction(true, event)}
                    ref={ref => {
                      searchInput.current = ref
                    }}
                    disabled={disabled}
                  />
                  {addon && (
                    <InputGroup.Text
                      style={{
                        maxHeight: "38px",
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        textSizeAdjust: "10px"
                      }}
                    >
                      {typeof addon === "string" ? (
                        <img src={addon} style={{ height: "20px" }} alt="" />
                      ) : (
                        addon
                      )}
                    </InputGroup.Text>
                  )}
                  {extraAddon}
                </InputGroup>
              </Popover>
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

  function handleInteraction(nextShowOverlay, event) {
    // Note: these state updates are not being batched, order is therefore important
    // Make sure the overlay is being closed when clicking outside of it,
    // but keep it open when clicking on the input field.
    if (!disabled) {
      const inputFocus = searchInput.current.contains(event && event.target)
      const openOverlay = nextShowOverlay || inputFocus
      if (openOverlay !== showOverlay) {
        if (openOverlay) {
          // overlay is being opened
          // Note: state updates are being batched here
          setShowOverlay(openOverlay)
          if (!keepSearchText) {
            setSearchTerms("")
          }
          setIsLoading(true)
          setFetchType(FETCH_TYPE.NORMAL)
        } else {
          // overlay is being closed
          // Note: state updates WOULD NOT be batched here
          // When closing the overlay the state updates were not being batched, we
          // therefore moved them to an effect, to prevent several too many renders
          // and also to make sure the state updates are being batched in there
          setDoReset(true)
        }
      }
    }
  }

  function changeSearchTerms(event) {
    setSearchTerms(event.target.value)
    // Reset the results state when the search terms change
    setResults({})
    setPageNum(0)
    // Make sure we don't do a fetch for each character being typed
    setFetchType(FETCH_TYPE.DEBOUNCED)
  }

  function handleOnChangeSelect(event) {
    changeFilterType(event.target.value)
  }

  function changeFilterType(newFilterType) {
    // When changing the filter type, only fetch the results if they were not fetched before
    const filterResults = results[newFilterType]
    const shouldFetchResults = _isEmpty(filterResults)
    setFilterType(newFilterType)
    setPageNum(results && filterResults ? filterResults.pageNum : 0)
    setIsLoading(shouldFetchResults)
    setFetchType(shouldFetchResults ? FETCH_TYPE.NORMAL : FETCH_TYPE.NONE)
  }

  function goToPage(pageNum) {
    setPageNum(pageNum)
    setFetchType(FETCH_TYPE.NORMAL)
  }
}
AdvancedSelect.propTypes = propTypes
AdvancedSelect.defaultProps = {
  pageSize: 5,
  disabled: false,
  filterDefs: {},
  closeOverlayOnAdd: false,
  selectedValueAsString: "",
  valueKey: "uuid"
}

export default AdvancedSelect
