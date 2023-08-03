import { Popover2, Popover2InteractionKind } from "@blueprintjs/popover2"
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css"
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
  Dropdown,
  FormGroup,
  FormLabel,
  Row
} from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"
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
  const navigate = useNavigate()
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
    <Dropdown style={{ maxHeight: "400px", overflowY: "auto" }}>
      {Object.keys(filterDefs).map(filterKey => (
        <Dropdown.Item
          disabled={existingKeys.includes(filterKey)}
          key={filterKey}
          onClick={() => addFilter(filterKey)}
          // shouldDismissPopover={false}
        >
          {filterKey}
        </Dropdown.Item>
      ))}
    </Dropdown>
  )

  const possibleFilterTypes = Object.keys(ALL_FILTERS).filter(type =>
    searchObjectTypes.includes(type)
  )

  return (
    <Formik>
      {() => (
        <div className="advanced-search form-horizontal">
          <Form onSubmit={onSubmit}>
            <FormGroup style={{ marginBottom: "15px" }}>
              <ButtonGroupContainerS>
                <ButtonToggleGroup
                  value={objectType}
                  onChange={changeObjectType}
                >
                  {possibleFilterTypes.map(type => (
                    <Button
                      variant="outline-secondary"
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
                        : "hidden",
                    marginLeft: "1rem"
                  }}
                >
                  <RemoveButton title="Clear type" onClick={clearObjectType} />
                </div>
              </ButtonGroupContainerS>
            </FormGroup>

            {/* <FormControl defaultValue={text} className="hidden" /> */}

            <div
              className="advanced-search-content"
              style={{ paddingLeft: "15px" }}
            >
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
                  <Popover2
                    content={advancedSearchMenuContent}
                    captureDismiss
                    interactionKind={Popover2InteractionKind.CLICK}
                    usePortal={false}
                    autoFocus
                    enforceFocus
                    placement="right"
                    modifiers={{
                      preventOverflow: {
                        options: {
                          rootBoundary: "viewport"
                        }
                      },
                      flip: {
                        enabled: false
                      }
                    }}
                  >
                    <Button variant="link" id="addFilterDropdown">
                      + Add {filters.length > 0 && "another"} filter
                    </Button>
                  </Popover2>
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
                  variant="outline-secondary"
                  onClick={onCancel}
                  style={{ marginLeft: 20 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
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
    const defaultFiltersForObjectType = objectType
      ? Object.entries(ALL_FILTERS[objectType].filters)
        .filter(([, filter]) => filter.isDefault)
        .map(([k]) => ({
          key: k,
          // Keep any previous value for the default filters
          value: filters.find(f => f.key === k)?.value
        }))
      : []

    setFilters(
      filters
        .filter(
          f =>
            // Keep the common filters for every object type
            commonFiltersForAllObjectTypes[f.key] &&
            // Discard the default filters as they will be concatenated later
            !ALL_FILTERS[objectType]?.filters[f.key].isDefault
        )
        // Add defaults as well
        .concat(defaultFiltersForObjectType)
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
      navigate("/search")
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
    <FormGroup controlId={queryKey} className="form-group">
      <Row>
        <Col xs={12} sm={3} lg={2} className="label-align">
          <FormLabel>{label}</FormLabel>
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
        <Col xs={2} sm={1} lg={1}>
          <RemoveButton
            title="Remove this filter"
            onClick={() => onRemove(filter)}
          />
        </Col>
      </Row>
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
  justify-content: space-between;

  & > .btn-group {
    display: flex;
    flex-direction: row;
  }

  @media (max-width: 768px) {
    & > .btn-group {
      display: flex;
      flex-wrap: wrap;
      & > * {
        flex: 1 1 auto;
      }
    }
  }
`
