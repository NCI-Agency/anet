import API from "api"
import autobind from "autobind-decorator"
import { OrganizationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import _isEqualWith from "lodash/isEqualWith"
import { Organization } from "models"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Checkbox } from "react-bootstrap"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import utils from "utils"

export default class OrganizationFilter extends Component {
  static propTypes = {
    // An OrganizationFilter filter allows users to search the ANET database
    // for existing organizations and use that records ID as the search term.
    // The queryKey property tells this filter what property to set on the
    // search query (ie authorUuid, organizationUuid, etc).
    queryKey: PropTypes.string.isRequired,
    queryIncludeChildOrgsKey: PropTypes.string.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func,
    queryParams: PropTypes.object,
    asFormField: PropTypes.bool
  }

  static defaultProps = {
    asFormField: true
  }

  constructor(props) {
    super(props)

    const value = props.value || {}
    this.state = {
      value: value,
      includeChildOrgs: value.includeChildOrgs || false,
      queryParams: props.queryParams || {}
    }
  }

  componentDidMount() {
    this.updateFilter()
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      !_isEqualWith(
        prevProps.value,
        this.props.value,
        utils.treatFunctionsAsEqual
      )
    ) {
      this.setState(
        {
          value: this.props.value,
          includeChildOrgs: this.props.value.includeChildOrgs || false
        },
        this.updateFilter
      )
    }
  }

  render() {
    const advancedSelectProps = Object.without(
      this.props,
      "value",
      "queryKey",
      "queryIncludeChildOrgsKey",
      "queryParams",
      "asFormField"
    )
    let msg = this.props.value.shortName
    if (msg && this.state.includeChildOrgs) {
      msg += ", including sub-organizations"
    }
    const organizationWidgetFilters = {
      all: {
        label: "All",
        searchQuery: true,
        queryVars: this.state.queryParams
      }
    }

    return !this.props.asFormField ? (
      <React.Fragment>{msg}</React.Fragment>
    ) : (
      <div>
        <AdvancedSingleSelect
          {...advancedSelectProps}
          fieldName={this.props.queryKey}
          fieldLabel={null}
          vertical
          showRemoveButton={false}
          filterDefs={organizationWidgetFilters}
          overlayColumns={["Name"]}
          overlayRenderRow={OrganizationOverlayRow}
          objectType={Organization}
          valueKey="shortName"
          fields={Organization.autocompleteQuery}
          placeholder="Filter by organization..."
          addon={ORGANIZATIONS_ICON}
          onChange={this.onChange}
          value={this.state.value}
        />
        <Checkbox
          inline
          checked={this.state.includeChildOrgs}
          onChange={this.changeIncludeChildren}
        >
          Include sub-organizations
        </Checkbox>
      </div>
    )
  }

  @autobind
  changeIncludeChildren(event) {
    this.setState({ includeChildOrgs: event.target.checked }, this.updateFilter)
  }

  @autobind
  onChange(event) {
    if (typeof event === "object") {
      this.setState({ value: event }, this.updateFilter)
    }
  }

  @autobind
  toQuery() {
    return {
      [this.props.queryKey]: this.state.value.uuid,
      [this.props.queryIncludeChildOrgsKey]: this.state.includeChildOrgs
    }
  }

  @autobind
  updateFilter() {
    if (this.props.asFormField) {
      let { value } = this.state
      if (typeof value === "object") {
        value.includeChildOrgs = this.state.includeChildOrgs
        value.toQuery = this.toQuery
      }
      this.props.onChange(value)
    }
  }

  @autobind
  deserialize(query, key) {
    if (query[this.props.queryKey]) {
      let getInstanceName = Organization.getInstanceName
      let graphQlQuery =
        /* GraphQL */ getInstanceName +
        '(uuid:"' +
        query[this.props.queryKey] +
        '") { uuid, shortName }'
      return API.query(graphQlQuery).then(data => {
        if (data[getInstanceName]) {
          const toQueryValue = {
            [this.props.queryKey]: query[this.props.queryKey]
          }
          if (query[this.props.queryIncludeChildOrgsKey]) {
            data[getInstanceName].includeChildOrgs =
              query[this.props.queryIncludeChildOrgsKey]
            toQueryValue[this.props.queryIncludeChildOrgsKey] =
              query[this.props.queryIncludeChildOrgsKey]
          }
          return {
            key: key,
            value: {
              ...data[getInstanceName],
              toQuery: () => toQueryValue
            }
          }
        } else {
          return null
        }
      })
    }
    return null
  }
}
