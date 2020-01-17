import API from "api"
import { gql } from "apollo-boost"
import autobind from "autobind-decorator"
import { OrganizationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import _isEqualWith from "lodash/isEqualWith"
import { Organization } from "models"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { ToggleButton, ToggleButtonGroup } from "react-bootstrap"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import utils from "utils"
import { RECURSE_STRATEGY } from "components/SearchFilters"

const GQL_GET_ORGANIZATION = gql`
  query($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
    }
  }
`

export default class OrganizationFilter extends Component {
  static propTypes = {
    // An OrganizationFilter filter allows users to search the ANET database
    // for existing organizations and use that records ID as the search term.
    // The queryKey property tells this filter what property to set on the
    // search query (ie authorUuid, organizationUuid, etc).
    queryKey: PropTypes.string.isRequired,
    queryOrgRecurseStrategyKey: PropTypes.string.isRequired,
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
      orgRecurseStrategy: value.orgRecurseStrategy || RECURSE_STRATEGY.NONE,
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
          orgRecurseStrategy:
            this.props.value.orgRecurseStrategy || RECURSE_STRATEGY.NONE
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
      "queryOrgRecurseStrategyKey",
      "queryParams",
      "asFormField"
    )
    let msg = this.props.value.shortName
  if (msg && (this.state.orgRecurseStrategy === RECURSE_STRATEGY.CHILDREN)) {
      msg += ", including sub-organizations"
    } else if (msg && (this.state.orgRecurseStrategy === RECURSE_STRATEGY.PARENTS)) {
      msg += ", including parent organizations"
    }
    const organizationWidgetFilters = {
      all: {
        label: "All",
        queryVars: this.state.queryParams
      }
    }

    return !this.props.asFormField ? (
      <>{msg}</>
    ) : (
      <div>
        <AdvancedSingleSelect
          {...advancedSelectProps}
          fieldName={this.props.queryKey}
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
        <div>
          <ToggleButtonGroup
            type="radio"
            name="orgRecurseStrategy"
            value={this.state.orgRecurseStrategy}
            onChange={this.changeOrgRecurseStrategy}
          >
            <ToggleButton value={RECURSE_STRATEGY.NONE}>exact match</ToggleButton>
            <ToggleButton value={RECURSE_STRATEGY.CHILDREN}>
              include sub-orgs
            </ToggleButton>
            <ToggleButton value={RECURSE_STRATEGY.PARENTS}>
              include parent orgs
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>
    )
  }

  @autobind
  changeOrgRecurseStrategy(value) {
    this.setState({ orgRecurseStrategy: value }, this.updateFilter)
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
      [this.props.queryOrgRecurseStrategyKey]: this.state.orgRecurseStrategy
    }
  }

  @autobind
  updateFilter() {
    if (this.props.asFormField) {
      const { value } = this.state
      if (typeof value === "object") {
        value.orgRecurseStrategy = this.state.orgRecurseStrategy
        value.toQuery = this.toQuery
      }
      this.props.onChange(value)
    }
  }

  @autobind
  deserialize(query, key) {
    if (query[this.props.queryKey]) {
      return API.query(GQL_GET_ORGANIZATION, {
        uuid: query[this.props.queryKey]
      }).then(data => {
        if (data.organization) {
          const toQueryValue = {
            [this.props.queryKey]: query[this.props.queryKey]
          }
          if (query[this.props.queryOrgRecurseStrategyKey]) {
            data.organization.orgRecurseStrategy =
              query[this.props.queryOrgRecurseStrategyKey]
            toQueryValue[this.props.queryOrgRecurseStrategyKey] =
              query[this.props.queryOrgRecurseStrategyKey]
          }
          return {
            key: key,
            value: {
              ...data.organization,
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
