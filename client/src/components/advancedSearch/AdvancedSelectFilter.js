import API from "api"
import { gql } from "apollo-boost"
import autobind from "autobind-decorator"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import _isEqualWith from "lodash/isEqualWith"
import PropTypes from "prop-types"
import React, { Component } from "react"
import utils from "utils"

export default class AdvancedSelectFilter extends Component {
  static propTypes = {
    // An AdvancedSingleSelect filter allows users to search the ANET database
    // for existing records and use that records ID as the search term.
    // The queryKey property tells this filter what property to set on the
    // search query (ie authorUuid, organizationUuid, etc).
    queryKey: PropTypes.string.isRequired,
    objectType: PropTypes.func.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func,
    valueKey: PropTypes.string.isRequired,
    fields: PropTypes.string,
    asFormField: PropTypes.bool
  }

  static defaultProps = {
    fields: "",
    asFormField: true
  }

  constructor(props) {
    super(props)
    this.state = {
      value: props.value || {}
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
      this.setState({ value: this.props.value }, this.updateFilter)
    }
  }

  render() {
    let advancedSelectProps = Object.without(
      this.props,
      "value",
      "queryKey",
      "asFormField",
      "onChange"
    )
    return !this.props.asFormField ? (
      <>{this.props.value[this.props.valueKey]}</>
    ) : (
      <div>
        <AdvancedSingleSelect
          {...advancedSelectProps}
          fieldName={this.props.queryKey}
          showRemoveButton={false}
          onChange={this.onChange}
          value={this.state.value}
        />
      </div>
    )
  }

  @autobind
  onChange(event) {
    if (typeof event === "object") {
      this.setState({ value: event }, this.updateFilter)
    }
  }

  @autobind
  toQuery() {
    return { [this.props.queryKey]: this.state.value && this.state.value.uuid }
  }

  @autobind
  updateFilter() {
    if (this.props.asFormField) {
      let { value } = this.state
      value.toQuery = this.toQuery
      this.props.onChange(value)
    }
  }

  @autobind
  deserialize(query, key) {
    if (query[this.props.queryKey]) {
      const getInstanceName = this.props.objectType.getInstanceName
      return API.query(
        gql`
          query($uuid: String!) {
            ${getInstanceName}(uuid: $uuid) {
              ${this.props.fields}
            }
          }
        `,
        { uuid: query[this.props.queryKey] }
      ).then(data => {
        if (data[getInstanceName]) {
          const toQueryValue = {
            [this.props.queryKey]: query[this.props.queryKey]
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
