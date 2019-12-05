import { resetPagination, SEARCH_OBJECT_LABELS, setSearchQuery } from "actions"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import searchFilters, {
  POSTITION_POSITION_TYPE_FILTER_KEY
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
  DropdownButton,
  FormControl,
  FormGroup,
  MenuItem,
  Row
} from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import REMOVE_ICON from "resources/delete.png"

const AdvancedSearch = props => {
  const { query, text } = props
  const history = useHistory()
  const [objectType, setObjectType] = useState(query.objectType)
  const [filters, setFilters] = useState(
    query.filters ? query.filters.slice() : []
  )
  // Keep orgFilterQueryParams as it depends on the value selected for the positonTypeFilter
  const [orgFilterQueryParams, setOrgFilterQueryParams] = useState({})
  const ALL_FILTERS = searchFilters.searchFilters()
  // console.log("RENDER AdvancedSearch", objectType, text, filters)
  const filterDefs = objectType ? ALL_FILTERS[objectType].filters : {}
  const existingKeys = filters.map(f => f.key)
  const moreFiltersAvailable =
    existingKeys.length < Object.keys(filterDefs).length
  return (
    <Formik>
      {() => (
        <div className="advanced-search form-horizontal">
          <Form onSubmit={onSubmit}>
            <FormGroup>
              <Col xs={11} style={{ textAlign: "center" }}>
                <ButtonToggleGroup
                  value={objectType}
                  onChange={changeObjectType}
                >
                  {Object.keys(ALL_FILTERS).map(
                    type =>
                      props.searchObjectTypes.indexOf(type) !== -1 && (
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

            <Row>
              <Col xs={6} xsOffset={3}>
                {!objectType ? (
                  "To add filters, first pick a type above"
                ) : !moreFiltersAvailable ? (
                  "No additional filters available"
                ) : (
                  <DropdownButton
                    bsStyle="link"
                    title="+ Add another filter"
                    onSelect={addFilter}
                    id="addFilterDropdown"
                  >
                    {Object.keys(filterDefs).map(filterKey => (
                      <MenuItem
                        disabled={existingKeys.indexOf(filterKey) > -1}
                        eventKey={filterKey}
                        key={filterKey}
                      >
                        {filterKey}
                      </MenuItem>
                    ))}
                  </DropdownButton>
                )}
              </Col>
            </Row>

            <Row>
              <div className="pull-right">
                <Button onClick={props.onCancel} style={{ marginRight: 20 }}>
                  Cancel
                </Button>
                <Button
                  bsStyle="primary"
                  type="submit"
                  onClick={onSubmit}
                  style={{ marginRight: 20 }}
                >
                  Search
                </Button>
              </div>
            </Row>
          </Form>
        </div>
      )}
    </Formik>
  )

  function changeObjectType(objectType) {
    setObjectType(objectType)
    setFilters([])
    setOrgFilterQueryParams({})
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
      setOrgFilterQueryParams({})
    }
  }

  function onSubmit(event) {
    if (typeof props.onSearch === "function") {
      props.onSearch()
    }
    // We only update the Redux state on submit
    props.resetPagination()
    props.setSearchQuery({
      objectType,
      filters,
      text
    })
    if (props.onSearchGoToSearchPage) {
      history.push({
        pathname: "/search"
      })
    }
    event.preventDefault()
    event.stopPropagation()
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    query: _cloneDeep(state.searchQuery),
    onSearchGoToSearchPage: state.searchProps.onSearchGoToSearchPage,
    searchObjectTypes: state.searchProps.searchObjectTypes
  }
}

AdvancedSearch.propTypes = {
  onSearch: PropTypes.func,
  onCancel: PropTypes.func,
  setSearchQuery: PropTypes.func.isRequired,
  resetPagination: PropTypes.func.isRequired,
  query: PropTypes.shape({
    text: PropTypes.string,
    filters: PropTypes.any,
    objectType: PropTypes.string
  }),
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

const SearchFilter = props => {
  const {
    onRemove,
    filter,
    element,
    orgFilterQueryParams,
    updateOrgFilterQueryParams
  } = props
  const label = filter.key
  const ChildComponent = element.component

  return (
    <FormGroup>
      <Col xs={3}>
        <ControlLabel>{label}</ControlLabel>
      </Col>
      <Col xs={8}>
        <ChildComponent
          value={filter.value || ""}
          onChange={onChange}
          orgFilterQueryParams={orgFilterQueryParams}
          {...element.props}
        />
      </Col>
      <Col xs={1}>
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
      let orgQueryParams = {}
      if (positionType === Position.TYPE.PRINCIPAL) {
        orgQueryParams = { type: Organization.TYPE.PRINCIPAL_ORG }
      } else if (positionType === Position.TYPE.ADVISOR) {
        orgQueryParams = { type: Organization.TYPE.ADVISOR_ORG }
      }
      updateOrgFilterQueryParams(orgQueryParams)
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
