import {
  Classes,
  Menu,
  MenuItem,
  Popover,
  PopoverInteractionKind,
  Position as PopoverPosition
} from "@blueprintjs/core"
import styled from "@emotion/styled"
import { resetPagination, SEARCH_OBJECT_LABELS, setSearchQuery } from "actions"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import RemoveButton from "components/RemoveButton"
import {
  findCommonFiltersForAllObjectTypes,
  searchFilters,
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
import { POSITION_POSITION_TYPE_FILTER_KEY } from "searchUtils"

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
  const ALL_FILTERS = searchFilters()
  const commonFiltersForAllObjectTypes = findCommonFiltersForAllObjectTypes(
    searchObjectTypes,
    ALL_FILTERS
  )
  const filterDefs = objectType
    ? ALL_FILTERS[objectType].filters
    : commonFiltersForAllObjectTypes
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

  return (
    <Formik>
      {() => (
        <div className="advanced-search form-horizontal">
          <Form onSubmit={onSubmit}>
            <FormGroup>
              <ButtonGroupContainerS>
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

                <div
                  style={{
                    visibility:
                      possibleFilterTypes.length > 1 && objectType
                        ? "visible"
                        : "hidden"
                  }}
                >
                  <RemoveButton
                    title="Clear type"
                    altText="Clear type"
                    onClick={clearObjectType}
                    buttonStyle="link"
                  />
                </div>
              </ButtonGroupContainerS>
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
                {!moreFiltersAvailable ? (
                  !objectType ? (
                    "To add more filters, first pick a type above"
                  ) : (
                    "No additional filters available"
                  )
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

  function changeObjectType(objectType) {
    setObjectType(objectType)
    setFilters(
      filters.filter(value => commonFiltersForAllObjectTypes[value.key])
    )
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

    if (filter.key === POSITION_POSITION_TYPE_FILTER_KEY) {
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
    // Prevent browser navigation to the url
    event.preventDefault()
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
      <Col xs={12} sm={3} lg={2} componentClass={ControlLabel}>
        {label}
      </Col>
      <Col xs={10} sm={8} lg={9}>
        <div>
          <ChildComponent
            value={filter.value || ""}
            onChange={onChange}
            orgFilterQueryParams={orgFilterQueryParams}
            {...element.props}
          />
        </div>
      </Col>
      <Col xs={1} sm={1} lg={1}>
        <RemoveButton
          title="Remove this filter"
          altText="Remove this filter"
          onClick={() => onRemove(filter)}
          buttonStyle="link"
        />
      </Col>
    </FormGroup>
  )

  function onChange(value) {
    filter.value = value
    if (filter.key === POSITION_POSITION_TYPE_FILTER_KEY) {
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

const ButtonGroupContainerS = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: no-wrap;
  padding: 10px;

  & > .btn-group {
    display: flex;
    flex-direction: row;
  }

  @media (max-width: 876px) {
    & > .btn-group {
      display: flex;
      flex-wrap: wrap;
      & > * {
        max-width: min-content;
      }
    }
  }
`
