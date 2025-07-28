import styled from "@emotion/styled"
import { resetPagination, SEARCH_OBJECT_LABELS, setSearchQuery } from "actions"
import AppContext from "components/AppContext"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import DictionaryField from "components/DictionaryField"
import RemoveButton from "components/RemoveButton"
import {
  findCommonFiltersForAllObjectTypes,
  searchFilters,
  SearchQueryPropType
} from "components/SearchFilters"
import { Form, Formik } from "formik"
import _cloneDeep from "lodash/cloneDeep"
import React, { useContext, useState } from "react"
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

interface CustomToggleProps {
  onClick: (...args: unknown[]) => unknown
  children?: React.ReactNode
}

const CustomToggle = React.forwardRef<HTMLElement, CustomToggleProps>(
  ({ onClick, children }, ref) => (
    <Button
      variant="link"
      id="addFilterDropdown"
      className="dropdown-toggle"
      ref={ref}
      onClick={e => {
        e.preventDefault()
        onClick(e)
      }}
    >
      {children}
    </Button>
  )
)
CustomToggle.displayName = "CustomToggle"

interface CustomMenuProps {
  style?: any
  className?: string
  "aria-labelledby"?: string
  children?: React.ReactNode
}

const CustomMenu = React.forwardRef<HTMLElement, CustomMenuProps>(
  ({ style, className, "aria-labelledby": labeledBy, children }, ref) => {
    return (
      <div
        ref={ref}
        style={style}
        className={className}
        aria-labelledby={labeledBy}
      >
        <ul className="list-unstyled mb-0">{children}</ul>
      </div>
    )
  }
)
CustomMenu.displayName = "CustomMenu"

interface AdvancedSearchProps {
  onSearch?: (...args: unknown[]) => unknown
  onCancel?: (...args: unknown[]) => unknown
  setSearchQuery: (...args: unknown[]) => unknown
  resetPagination: (...args: unknown[]) => unknown
  searchQuery?: SearchQueryPropType
  onSearchGoToSearchPage?: boolean
  searchObjectTypes?: any[]
  text?: string
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
}: AdvancedSearchProps) => {
  const { currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [objectType, setObjectType] = useState(searchQuery.objectType)
  const [filters, setFilters] = useState(
    searchQuery.filters ? searchQuery.filters.slice() : []
  )
  const ALL_FILTERS = searchFilters(currentUser?.isAdmin())
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
    <>
      {Object.entries(filterDefs).map(([filterKey, filterDef]) => {
        const dictProps = filterDef.dictProps
        const label = dictProps?.label || filterKey
        const ChildComponent = dictProps ? DictionaryField : Dropdown.Item
        const additionalProps = dictProps
          ? { wrappedComponent: Dropdown.Item, dictProps }
          : {}
        return dictProps?.exclude ? null : (
          <ChildComponent
            disabled={existingKeys.includes(filterKey)}
            key={filterKey}
            onClick={() => addFilter(filterKey)}
            {...additionalProps}
            // shouldDismissPopover={false}
          >
            {label}
          </ChildComponent>
        )
      })}
    </>
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
                  <Dropdown drop="end">
                    <Dropdown.Toggle as={CustomToggle}>
                      + Add {filters.length > 0 && "another"} filter
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                      as={CustomMenu}
                      popperConfig={{ strategy: "fixed" }}
                      renderOnMount
                      rootCloseEvent="click"
                      style={{ maxHeight: "400px" }}
                    >
                      {advancedSearchMenuContent}
                    </Dropdown.Menu>
                  </Dropdown>
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

const mapDispatchToProps = (dispatch, ownProps) => ({
  setSearchQuery: advancedSearchQuery =>
    dispatch(setSearchQuery(advancedSearchQuery)),
  resetPagination: () => dispatch(resetPagination())
})

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedSearch)

interface SearchFilterProps {
  onRemove?: (...args: unknown[]) => unknown
  filter?: any
  element?: {
    component: React.ReactNode
    dictProps?: any
    labelClass?: string
    props?: any
  }
}

const SearchFilter = ({ onRemove, filter, element }: SearchFilterProps) => {
  const dictProps = element.dictProps
  const label = dictProps?.label || filter.key
  const ChildComponent = dictProps ? DictionaryField : element.component
  const additionalProps = dictProps
    ? { wrappedComponent: element.component, dictProps }
    : {}
  const { queryKey } = element.props || undefined

  return dictProps?.exclude ? null : (
    <FormGroup controlId={queryKey} className="form-group">
      <Row>
        <Col xs={12} sm={3} lg={2} className="label-align">
          <FormLabel className={element.labelClass}>{label}</FormLabel>
        </Col>
        <Col xs={10} sm={8} lg={9}>
          <div>
            <ChildComponent
              value={filter.value || ""}
              onChange={onChange}
              {...additionalProps}
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
  }
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
