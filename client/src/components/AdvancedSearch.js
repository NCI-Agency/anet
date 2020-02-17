import {
  Classes,
  Menu,
  MenuItem,
  Popover,
  PopoverInteractionKind,
  Position as PopoverPosition
} from "@blueprintjs/core"
import { resetPagination, SEARCH_OBJECT_LABELS, setSearchQuery } from "actions"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import searchFilters, {
  POSTITION_ORGANIZATION_FILTER_KEY,
  POSTITION_POSITION_TYPE_FILTER_KEY,
  SearchQueryPropType
} from "components/SearchFilters"
import { Form, Formik } from "formik"
import _cloneDeep from "lodash/cloneDeep"
import { Organization, Position } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import {
  Button,
  Col,
  ControlLabel,
  FormControl,
  FormGroup
} from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import REMOVE_ICON from "resources/delete.png"

function updateOrganizationFilterState(organizationFilter, positionType) {
  if (organizationFilter) {
    if (positionType === Position.TYPE.PRINCIPAL) {
      organizationFilter.setState({
        queryParams: { type: Organization.TYPE.PRINCIPAL_ORG }
      })
    } else if (positionType === Position.TYPE.ADVISOR) {
      organizationFilter.setState({
        queryParams: { type: Organization.TYPE.ADVISOR_ORG }
      })
    } else {
      organizationFilter.setState({ queryParams: {} })
    }
  }
}

const AdvancedSearch = ({
  onSearch,
  onCancel,
  setSearchQuery,
  resetPagination,
  searchQuery,
  onSearchGoToSearchPage,
  searchObjectTypes,
  text
}) => {
  const history = useHistory()
  const [objectType, setObjectType] = useState(searchQuery.objectType)
  const [filters, setFilters] = useState(
    searchQuery.filters ? searchQuery.filters.slice() : []
  )
  const [positionTypeFilter, setPositionTypeFilter] = useState(null)
  const [organizationFilter, setOrganizationFilter] = useState(null)

  const ALL_FILTERS = searchFilters.searchFilters(
    changePositionTypeFilter,
    changeOrganizationFilter
  )

  const filterDefs = objectType ? ALL_FILTERS[objectType].filters : {}
  const existingKeys = filters.map(f => f.key)
  const moreFiltersAvailable =
    existingKeys.length < Object.keys(filterDefs).length

  const advancedSearchMenuContent = (
    <Menu
      className={Classes.POPOVER_DISMISS}
      style={{ maxHeight: "400px", overflowY: "auto" }}
    >
      {Object.keys(filterDefs).map(filterKey => (
        <MenuItem
          disabled={existingKeys.includes(filterKey)}
          key={filterKey}
          onClick={() => addFilter(filterKey)}
          text={filterKey}
          shouldDismissPopover={false}
        />
      ))}
    </Menu>
  )

  const possibleFilterTypes = Object.keys(ALL_FILTERS).filter(type =>
    searchObjectTypes.includes(type)
  )
  const hasObjectType = possibleFilterTypes.length > 1 && objectType
  const colWidth = hasObjectType ? 11 : 12

  return (
    <Formik>
      {() => (
        <div className="advanced-search form-horizontal">
          <Form onSubmit={onSubmit}>
            <FormGroup>
              <Col xs={colWidth}>
                <ButtonToggleGroup
                  value={objectType}
                  onChange={changeObjectType}
                >
                  {possibleFilterTypes.map(type => (
                    <Button
                      key={type}
                      value={type}
                      disabled={possibleFilterTypes.length < 2}
                    >
                      {SEARCH_OBJECT_LABELS[type]}
                    </Button>
                  ))}
                </ButtonToggleGroup>
              </Col>
              {hasObjectType && (
                <Col xs={1}>
                  <Button bsStyle="link" onClick={clearObjectType}>
                    <img src={REMOVE_ICON} height={14} alt="Clear type" />
                  </Button>
                </Col>
              )}
            </FormGroup>

            <FormControl defaultValue={text} className="hidden" />

            <div className="advanced-search-content">
              {filters.map(
                filter =>
                  filterDefs[filter.key] && (
                    <SearchFilter
                      key={filter.key}
                      filter={filter}
                      onRemove={removeFilter}
                      element={filterDefs[filter.key]}
                      organizationFilter={organizationFilter}
                    />
                  )
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
                borderTop: "1px solid #ddd",
                paddingTop: "15px"
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexGrow: 1
                }}
              >
                {!objectType ? (
                  "To add filters, first pick a type above"
                ) : !moreFiltersAvailable ? (
                  "No additional filters available"
                ) : (
                  <Popover
                    content={advancedSearchMenuContent}
                    captureDismiss
                    interactionKind={PopoverInteractionKind.CLICK}
                    usePortal={false}
                    position={PopoverPosition.RIGHT}
                    modifiers={{
                      preventOverflow: {
                        boundariesElement: "viewport"
                      },
                      flip: {
                        enabled: false
                      }
                    }}
                  >
                    <Button bsStyle="link" id="addFilterDropdown">
                      + Add {filters.length > 0 && "another"} filter
                    </Button>
                  </Popover>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "flex-end"
                }}
              >
                <Button
                  className={Classes.POPOVER_DISMISS}
                  intent="danger"
                  onClick={onCancel}
                  style={{ marginLeft: 20 }}
                >
                  Cancel
                </Button>
                <Button
                  bsStyle="primary"
                  className={Classes.POPOVER_DISMISS}
                  type="submit"
                  intent="success"
                  onClick={onSubmit}
                  style={{ marginLeft: 20 }}
                >
                  Search
                </Button>
              </div>
            </div>
          </Form>
        </div>
      )}
    </Formik>
  )

  function changePositionTypeFilter(positionTypeFilter) {
    updateOrganizationFilter(positionTypeFilter, organizationFilter)
    setPositionTypeFilter(positionTypeFilter)
  }

  function changeOrganizationFilter(organizationFilter) {
    updateOrganizationFilter(positionTypeFilter, organizationFilter)
    setOrganizationFilter(organizationFilter)
  }

  function updateOrganizationFilter(positionTypeFilter, organizationFilter) {
    const positionType = positionTypeFilter
      ? positionTypeFilter.state.value.value
      : ""
    updateOrganizationFilterState(organizationFilter, positionType)
  }

  function changeObjectType(objectType) {
    setObjectType(objectType)
    setFilters([])
  }

  function clearObjectType() {
    changeObjectType("")
  }

  function addFilter(filterKey) {
    if (filterKey) {
      const newFilters = filters.slice()
      newFilters.push({ key: filterKey })
      setFilters(newFilters)
    }
  }

  function removeFilter(filter) {
    const newFilters = filters.slice()
    newFilters.splice(newFilters.indexOf(filter), 1)
    setFilters(newFilters)

    if (filter.key === POSTITION_ORGANIZATION_FILTER_KEY) {
      changeOrganizationFilter(null)
    } else if (filter.key === POSTITION_POSITION_TYPE_FILTER_KEY) {
      changePositionTypeFilter(null)
    }
  }

  function onSubmit(event) {
    if (typeof onSearch === "function") {
      onSearch()
    }
    // We only update the Redux state on submit
    resetPagination()
    setSearchQuery({
      objectType,
      filters,
      text
    })
    if (onSearchGoToSearchPage) {
      history.push({
        pathname: "/search"
      })
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    searchQuery: _cloneDeep(state.searchQuery),
    onSearchGoToSearchPage: state.searchProps.onSearchGoToSearchPage,
    searchObjectTypes: state.searchProps.searchObjectTypes
  }
}

AdvancedSearch.propTypes = {
  onSearch: PropTypes.func,
  onCancel: PropTypes.func,
  setSearchQuery: PropTypes.func.isRequired,
  resetPagination: PropTypes.func.isRequired,
  searchQuery: SearchQueryPropType,
  onSearchGoToSearchPage: PropTypes.bool,
  searchObjectTypes: PropTypes.array,
  text: PropTypes.string
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  setSearchQuery: advancedSearchQuery =>
    dispatch(setSearchQuery(advancedSearchQuery)),
  resetPagination: () => dispatch(resetPagination())
})

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedSearch)

const SearchFilter = ({ onRemove, filter, organizationFilter, element }) => {
  const label = filter.key
  const ChildComponent = element.component
  const { queryKey } = element.props || undefined

  return (
    <FormGroup controlId={queryKey}>
      <Col sm={3} lg={2} componentClass={ControlLabel}>
        {label}
      </Col>
      <Col sm={8} lg={9}>
        <div>
          <ChildComponent
            value={filter.value || ""}
            onChange={onChange}
            {...element.props}
          />
        </div>
      </Col>
      <Col sm={1} lg={1}>
        <Button bsStyle="link" onClick={() => onRemove(filter)}>
          <img src={REMOVE_ICON} height={14} alt="Remove this filter" />
        </Button>
      </Col>
    </FormGroup>
  )

  function onChange(value) {
    filter.value = value

    if (filter.key === POSTITION_POSITION_TYPE_FILTER_KEY) {
      updateOrganizationFilterState(
        organizationFilter,
        filter.value.value || ""
      )
    }
  }
}

SearchFilter.propTypes = {
  onRemove: PropTypes.func,
  filter: PropTypes.object,
  organizationFilter: PropTypes.object,
  element: PropTypes.shape({
    component: PropTypes.func.isRequired,
    props: PropTypes.object
  })
}
