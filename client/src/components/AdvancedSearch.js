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
  FormGroup,
  Row
} from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import REMOVE_ICON from "resources/delete.png"

const ORG_QUERY_PARAM_TYPES = {
  NONE: {},
  PRINCIPAL: { type: Organization.TYPE.PRINCIPAL_ORG },
  ADVISOR: { type: Organization.TYPE.ADVISOR_ORG }
}

function getOrgQueryParams(positionType) {
  if (positionType === Position.TYPE.PRINCIPAL) {
    return ORG_QUERY_PARAM_TYPES.PRINCIPAL
  } else if (positionType === Position.TYPE.ADVISOR) {
    return ORG_QUERY_PARAM_TYPES.ADVISOR
  } else {
    return ORG_QUERY_PARAM_TYPES.NONE
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
  // Keep orgFilterQueryParams as it depends on the value selected for the positionTypeFilter
  const [orgFilterQueryParams, setOrgFilterQueryParams] = useState(
    getOrgQueryParams(null)
  )
  const ALL_FILTERS = searchFilters.searchFilters()
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

  return (
    <Formik>
      {() => (
        <div className="advanced-search form-horizontal">
          <Form onSubmit={onSubmit}>
            <FormGroup>
              <Col xs={11}>
                <ButtonToggleGroup
                  value={objectType}
                  onChange={changeObjectType}
                >
                  {Object.keys(ALL_FILTERS).map(
                    type =>
                      searchObjectTypes.indexOf(type) !== -1 && (
                        <Button key={type} value={type}>
                          {SEARCH_OBJECT_LABELS[type]}
                        </Button>
                      )
                  )}
                </ButtonToggleGroup>
              </Col>
              <Col xs={1}>
                <Button bsStyle="link" onClick={clearObjectType}>
                  <img src={REMOVE_ICON} height={14} alt="Clear type" />
                </Button>
              </Col>
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
                      updateOrgFilterQueryParams={setOrgFilterQueryParams}
                      orgFilterQueryParams={orgFilterQueryParams}
                    />
                  )
              )}
            </div>

            <Row style={{ borderTop: "1px solid #ddd", paddingTop: "15px" }}>
              <Col md={6} mdOffset={2}>
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
                      + Add another filter
                    </Button>
                  </Popover>
                )}
              </Col>
              <Col md={4} style={{ whiteSpace: "nowrap", textAlign: "right" }}>
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
              </Col>
            </Row>
          </Form>
        </div>
      )}
    </Formik>
  )

  function changeObjectType(objectType) {
    setObjectType(objectType)
    setFilters([])
    setOrgFilterQueryParams(getOrgQueryParams(null))
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

    if (filter.key === POSTITION_POSITION_TYPE_FILTER_KEY) {
      setOrgFilterQueryParams(getOrgQueryParams(null))
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

const SearchFilter = ({
  onRemove,
  filter,
  element,
  orgFilterQueryParams,
  updateOrgFilterQueryParams
}) => {
  const label = filter.key
  const ChildComponent = element.component
  const { queryKey } = element.props || undefined

  return (
    <FormGroup controlId={queryKey}>
      <Col xs={1} sm={2}>
        <ControlLabel>{label}</ControlLabel>
      </Col>
      <Col xs={10} sm={9}>
        <ChildComponent
          value={filter.value || ""}
          onChange={onChange}
          orgFilterQueryParams={orgFilterQueryParams}
          {...element.props}
        />
      </Col>
      <Col xs={1} sm={1}>
        <Button bsStyle="link" onClick={() => onRemove(filter)}>
          <img src={REMOVE_ICON} height={14} alt="Remove this filter" />
        </Button>
      </Col>
    </FormGroup>
  )

  function onChange(value) {
    filter.value = value
    if (filter.key === POSTITION_POSITION_TYPE_FILTER_KEY) {
      const positionType = filter.value.value || ""
      updateOrgFilterQueryParams(getOrgQueryParams(positionType))
    }
  }
}

SearchFilter.propTypes = {
  onRemove: PropTypes.func,
  filter: PropTypes.object,
  orgFilterQueryParams: PropTypes.object,
  updateOrgFilterQueryParams: PropTypes.func,
  element: PropTypes.shape({
    component: PropTypes.func.isRequired,
    props: PropTypes.object
  })
}
