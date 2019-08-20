import API from "api"
import { renderInputField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import UltimatePagination from "components/UltimatePagination"
import { Field } from "formik"
import _debounce from "lodash/debounce"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Button, Col, Overlay, Popover, Row } from "react-bootstrap"
import ContainerDimensions from "react-container-dimensions"
import "./AdvancedMultiSelect.css"

const MOBILE_WIDTH = 733

const AdvancedSelectTarget = ({ overlayRef }) => (
  <Row>
    <Col
      sm={12}
      lg={9}
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
    <ul className="overlayFilters">
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
  fieldLabel: PropTypes.string, // input field label
  placeholder: PropTypes.string, // input field placeholder
  searchTerms: PropTypes.string,
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
  onChange: PropTypes.func.isRequired,
  // Required: ANET Object Type (Person, Report, etc) to search for.
  objectType: PropTypes.func.isRequired,
  // Optional: Parameters to pass to all search filters.
  queryParams: PropTypes.object,
  // Optional: GraphQL string of fields to return from search.
  fields: PropTypes.string,
  shortcuts: PropTypes.array,
  shortcutsTitle: PropTypes.string,
  renderExtraCol: PropTypes.bool, // set to false if you want this column completely removed
  addon: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.object
  ]),
  extraAddon: PropTypes.object,
  handleAddItem: PropTypes.func,
  handleRemoveItem: PropTypes.func,
  smallOverlay: PropTypes.bool, // set to true if you want to display the filters on top
  vertical: PropTypes.bool
}

export default class AdvancedSelect extends Component {
  static defaultProps = {
    fieldLabel: "Add item",
    filterDefs: {},
    shortcuts: [],
    shortcutsTitle: "Recents",
    renderExtraCol: false,
    closeOverlayOnAdd: false,
    searchTerms: "",
    smallOverlay: false
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
      fieldLabel,
      placeholder,
      value,
      vertical,
      renderSelected,
      onChange,
      objectType,
      queryParams,
      fields,
      shortcuts,
      shortcutsTitle,
      renderExtraCol,
      addon,
      extraAddon,
      handleAddItem,
      handleRemoveItem,
      ...overlayProps
    } = this.props
    const {
      overlayTableClassName,
      overlayColumns,
      overlayRenderRow,
      filterDefs,
      smallOverlay
    } = overlayProps
    const { results, filterType, isLoading } = this.state
    const renderSelectedWithDelete = renderSelected
      ? React.cloneElement(renderSelected, { onDelete: handleRemoveItem })
      : null
    const items = results && results[filterType] ? results[filterType].list : []
    return (
      <React.Fragment>
        <Field
          name={fieldName}
          label={fieldLabel}
          component={renderInputField}
          value={this.state.searchTerms}
          placeholder={placeholder}
          onChange={this.changeSearchTerms}
          onFocus={this.handleInputFocus}
          onBlur={this.handleInputBlur}
          innerRef={this.overlayTarget}
          extraColElem={renderExtraCol ? this.renderShortcutsTitle() : ""}
          addon={addon}
          extraAddon={extraAddon}
          vertical={vertical}
        />
        <Overlay
          show={this.state.showOverlay}
          container={this.overlayContainer.current}
          target={this.overlayTarget.current}
          rootClose
          onHide={this.handleHideOverlay}
          placement="bottom"
          animation={false}
          delayHide={200}
        >
          <Popover
            id={`${fieldName}-popover`}
            title={null}
            placement="bottom"
            style={{
              width: "100%",
              maxWidth: "100%",
              boxShadow: "0 6px 20px hsla(0, 0%, 0%, 0.4)"
            }}
          >
            <ContainerDimensions>
              {({ width }) => {
                const hasLeftNav =
                  width >= MOBILE_WIDTH && Object.keys(filterDefs).length > 1
                const hasTopNav =
                  (width < MOBILE_WIDTH || smallOverlay) &&
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
                      <footer className="searchPagination">
                        {this.paginationFor(filterType)}
                      </footer>
                    </Col>
                  </Row>
                )
              }}
            </ContainerDimensions>
          </Popover>
        </Overlay>
        <AdvancedSelectTarget overlayRef={this.overlayContainer} />
        <Row>
          {vertical ? (
            <Col sm={12}>{renderSelectedWithDelete}</Col>
          ) : (
            <React.Fragment>
              <Col sm={2} />
              <Col sm={7}>{renderSelectedWithDelete}</Col>
              <Col sm={3}>{renderExtraCol ? this.renderShortcuts() : null}</Col>
            </React.Fragment>
          )}
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
      this.queryResults(filterDefs, filterType, results, pageNum)
    }
  }

  queryResults = (filterDefs, filterType, oldResults, pageNum) => {
    const resourceName = this.props.objectType.resourceName
    const listName = filterDefs.listName || this.props.objectType.listName
    this.setState({ isLoading: true }, () => {
      let graphQlQuery
      let variables = {}
      let variableDef = ""
      if (filterDefs.searchQuery) {
        // GraphQL search type of query
        graphQlQuery = /* GraphQL */ `
          ${listName}(query: $query) {
            pageNum
            pageSize
            totalCount
            list {
              ${this.props.fields}
            }
          }
        `
        variableDef = `($query: ${resourceName}SearchQueryInput)`
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
        variables = { query: queryVars }
      } else {
        // GraphQL query other than search type
        graphQlQuery = /* GraphQL */ `
          ${listName}(${filterDefs.listArgs}) {
            pageNum
            pageSize
            totalCount
            list {
              ${this.props.fields}
            }
          }
        `
      }
      let thisRequest = (this.latestRequest = API.query(
        graphQlQuery,
        variables,
        variableDef
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
    const numPages = pageSize <= 0 ? 1 : Math.ceil(totalCount / pageSize)
    if (numPages <= 1) {
      return
    }
    return (
      <UltimatePagination
        className="pull-right"
        currentPage={pageNum + 1}
        totalPages={numPages}
        boundaryPagesRange={1}
        siblingPagesRange={2}
        hideEllipsis={false}
        hidePreviousAndNextPageLinks={false}
        hideFirstAndLastPageLinks
        onChange={value => this.goToPage(value - 1)}
      />
    )
  }

  goToPage = pageNum => {
    this.fetchResults(pageNum)
  }

  renderShortcutsTitle = () => {
    return (
      <div
        id={`${this.props.fieldName}-shortcut-title`}
        className="shortcut-title"
      >
        <h5>{this.props.shortcutsTitle}</h5>
      </div>
    )
  }

  renderShortcuts = () => {
    const shortcuts = this.props.shortcuts
    return (
      shortcuts &&
      shortcuts.length > 0 && (
        <div
          id={`${this.props.fieldName}-shortcut-list`}
          className="shortcut-list"
        >
          {shortcuts.map(shortcut => {
            const shortcutLinkProps = {
              [this.props.objectType.getModelNameLinkTo]: shortcut,
              isLink: false,
              forShortcut: true
            }
            return (
              <Button
                key={shortcut.uuid}
                bsStyle="link"
                onClick={() => this.props.handleAddItem(shortcut)}
              >
                Add <LinkTo {...shortcutLinkProps} />
              </Button>
            )
          })}
        </div>
      )
    )
  }
}

AdvancedSelect.propTypes = propTypes
