import API from "api"
import { gql } from "apollo-boost"
import * as FieldHelper from "components/FieldHelper"
import UltimatePagination from "components/UltimatePagination"
import _debounce from "lodash/debounce"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Button, Col, FormControl, InputGroup, Row } from "react-bootstrap"
import { Popover, Position, PopoverInteractionKind } from "@blueprintjs/core"
import "@blueprintjs/core/lib/css/blueprint.css"
import ContainerDimensions from "react-container-dimensions"
import "./AdvancedSelect.css"
import "../BlueprintOverrides.css"

const MOBILE_WIDTH = 733

const AdvancedSelectTarget = ({ overlayRef }) => (
  <Row>
    <Col
      sm={12}
      lg={12}
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

const FilterList = props => {
  const { items, currentFilter, handleOnClick } = props
  return (
    <ul className="advancedSelectFilters">
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
  )
}
FilterList.propTypes = {
  items: PropTypes.object,
  currentFilter: PropTypes.string,
  handleOnClick: PropTypes.func
}

const SelectFilterInputField = props => {
  const { items, handleOnChange } = props
  return (
    <React.Fragment>
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
    </React.Fragment>
  )
}
SelectFilterInputField.propTypes = {
  items: PropTypes.object,
  handleOnChange: PropTypes.func
}

export const propTypes = {
  fieldName: PropTypes.string.isRequired, // input field name
  placeholder: PropTypes.string, // input field placeholder
  searchTerms: PropTypes.string,
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

export default class AdvancedSelect extends Component {
  static defaultProps = {
    filterDefs: {},
    closeOverlayOnAdd: false,
    searchTerms: ""
  }

  state = {
    searchTerms: this.props.searchTerms,
    filterType: Object.keys(this.props.filterDefs)[0], // per default use the first filter
    results: {},
    showOverlay: false,
    inputFocused: false,
    isLoading: false
  }

  latestRequest = null
  overlayContainer = React.createRef()
  overlayTarget = React.createRef()

  componentDidMount() {
    this.setState({
      searchTerms: this.props.searchTerms || ""
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_isEqual(prevProps.searchTerms, this.props.searchTerms)) {
      this.setState({ searchTerms: this.props.searchTerms })
    }
    if (
      !_isEqual(prevState.showOverlay, this.state.showOverlay) &&
      this.state.showOverlay === false &&
      !_isEqual(this.props.searchTerms, this.state.searchTerms)
    ) {
      // When the overlay is being closed, update the searchTerms with the selected value
      this.setState({ searchTerms: this.props.searchTerms || "" })
    }
  }

  render() {
    const {
      fieldName,
      placeholder,
      value,
      renderSelected,
      onChange,
      objectType,
      queryParams,
      fields,
      handleAddItem,
      handleRemoveItem,
      addon,
      extraAddon,
      ...overlayProps
    } = this.props

    const {
      overlayTableClassName,
      overlayColumns,
      overlayRenderRow,
      filterDefs
    } = overlayProps
    const { results, filterType, isLoading } = this.state
    const renderSelectedWithDelete = renderSelected
      ? React.cloneElement(renderSelected, { onDelete: handleRemoveItem })
      : null
    const items = results && results[filterType] ? results[filterType].list : []
    return (
      <React.Fragment>
        <Popover
          id={`${fieldName}-popover`}
          title={null}
          position={Position.BOTTOM_RIGHT}
          interactionKind={PopoverInteractionKind.CLICK}
          fill="true"
          usePortal={false}
          className="advancedSelectPopover"
          modifiers={{
            shift: { enabled: false },
            flip: { enabled: false },
            preventOverflow: { enabled: false }
          }}
        >
          <InputGroup>
            <FormControl
              name={fieldName}
              value={
                this.state.searchTerms === null ? "" : this.state.searchTerms
              }
              placeholder={placeholder}
              onChange={this.changeSearchTerms}
              onFocus={this.handleInputFocus}
              onBlur={this.handleInputBlur}
              ref={this.overlayTarget}
            />
            {extraAddon && <InputGroup.Addon>{extraAddon}</InputGroup.Addon>}
            {addon && (
              <FieldHelper.FieldAddon fieldId={fieldName} addon={addon} />
            )}
          </InputGroup>
          <ContainerDimensions>
            {({ width }) => {
              const hasLeftNav =
                width >= MOBILE_WIDTH && Object.keys(filterDefs).length > 1
              const hasTopNav =
                (width < MOBILE_WIDTH) &&
                Object.keys(filterDefs).length > 1
              return (
                <Row className="border-between">
                  {hasLeftNav && (
                    <Col sm={4} md={3}>
                      <div>
                        <FilterList
                          items={filterDefs}
                          currentFilter={this.state.filterType}
                          handleOnClick={this.changeFilterType}
                        />
                      </div>
                    </Col>
                  )}

                  <Col
                    sm={hasLeftNav ? 8 : 12}
                    md={hasLeftNav ? 9 : 12}
                    style={{ minHeight: "80px" }}
                  >
                    {hasTopNav && (
                      <div>
                        <SelectFilterInputField
                          items={filterDefs}
                          handleOnChange={this.handleOnChangeSelect}
                        />
                      </div>
                    )}
                    <this.props.overlayTable
                      fieldName={fieldName}
                      items={items}
                      selectedItems={value}
                      handleAddItem={item => {
                        handleAddItem(item)
                        if (this.props.closeOverlayOnAdd) {
                          this.handleHideOverlay()
                        }
                      }}
                      handleRemoveItem={handleRemoveItem}
                      objectType={objectType}
                      columns={[""].concat(overlayColumns)}
                      renderRow={overlayRenderRow}
                      isLoading={isLoading}
                      loaderMessage={"No results found"}
                      tableClassName={overlayTableClassName}
                    />
                    {this.paginationFor(filterType)}
                  </Col>
                </Row>
              )
            }}
          </ContainerDimensions>
        </Popover>
        <Row>
          <Col sm={12}>{renderSelectedWithDelete}</Col>
        </Row>
      </React.Fragment>
    )
  }

  handleInputFocus = () => {
    if (this.state.showOverlay === true) {
      // Overlay is already open and we do input focus, no need to fetch data
      this.setState({
        inputFocused: true
      })
    } else {
      this.setState(
        {
          searchTerms: "",
          inputFocused: true,
          showOverlay: true,
          isLoading: true
        },
        this.fetchResults()
      )
    }
  }

  handleInputBlur = () => {
    this.setState({
      inputFocused: false
    })
  }

  handleHideOverlay = () => {
    if (this.state.inputFocused) {
      // Do not hide the overlay when the trigger input has the focus
      return
    }
    this.setState({
      filterType: Object.keys(this.props.filterDefs)[0],
      searchTerms: "",
      results: {},
      isLoading: false,
      showOverlay: false
    })
  }

  changeSearchTerms = event => {
    // Reset the results state when the search terms change
    this.setState(
      {
        isLoading: true,
        searchTerms: event.target.value,
        results: {}
      },
      () => this.fetchResultsDebounced()
    )
  }

  handleOnChangeSelect = event => {
    this.changeFilterType(event.target.value)
  }

  changeFilterType = filterType => {
    // When changing the filter type, only fetch the results if they were not fetched before
    const { results } = this.state
    const filterResults = results[filterType]
    const doFetchResults = _isEmpty(filterResults)
    this.setState({ filterType, isLoading: doFetchResults }, () => {
      if (doFetchResults) {
        this.fetchResults()
      }
    })
  }

  fetchResults = (pageNum = 0) => {
    const { filterType, results } = this.state
    const filterDefs = this.props.filterDefs[filterType]
    if (filterDefs.list) {
      // No need to fetch the data, it is already provided in the filter definition
      this.setState({
        isLoading: !_isEmpty(filterDefs.list),
        results: {
          ...results,
          [filterType]: {
            list: filterDefs.list,
            pageNum: pageNum,
            pageSize: 6,
            totalCount: filterDefs.list.length
          }
        }
      })
    } else {
      // GraphQL search type of query
      this.queryResults(filterDefs, filterType, results, pageNum)
    }
  }

  queryResults = (filterDefs, filterType, oldResults, pageNum) => {
    const resourceName = this.props.objectType.resourceName
    const listName = filterDefs.listName || this.props.objectType.listName
    this.setState({ isLoading: true }, () => {
      let queryVars = { pageNum: pageNum, pageSize: 6 }
      if (this.props.queryParams) {
        Object.assign(queryVars, this.props.queryParams)
      }
      if (filterDefs.queryVars) {
        Object.assign(queryVars, filterDefs.queryVars)
      }
      if (this.state.searchTerms) {
        Object.assign(queryVars, { text: this.state.searchTerms + "*" })
      }
      let thisRequest = (this.latestRequest = API.query(
        gql`
          query($query: ${resourceName}SearchQueryInput) {
            ${listName}(query: $query) {
              pageNum
              pageSize
              totalCount
              list {
                ${this.props.fields}
              }
            }
          }
        `,
        { query: queryVars }
      ).then(data => {
        // If this is true there's a newer request happening, stop everything
        if (thisRequest !== this.latestRequest) {
          return
        }
        const isLoading = data[listName].totalCount !== 0
        this.setState({
          isLoading,
          results: {
            ...oldResults,
            [filterType]: data[listName]
          }
        })
      }))
    })
  }

  fetchResultsDebounced = _debounce(this.fetchResults, 400)

  paginationFor = filterType => {
    const { results } = this.state
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
        goToPage={this.goToPage}
      />
    )
  }

  goToPage = pageNum => {
    this.fetchResults(pageNum)
  }
}

AdvancedSelect.propTypes = propTypes
