import API from "api"
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

    // Passed by the SearchFilter row
    onChange: PropTypes.func,

    // Passed by the SearchFilterDisplay row
    asFormField: PropTypes.bool

    // All other properties are passed directly to the AdvancedSingleSelect
  }

  static defaultProps = {
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
      <React.Fragment>{this.props.value[this.props.valueKey]}</React.Fragment>
    ) : (
      <AdvancedSingleSelect
        {...advancedSelectProps}
        fieldName={this.props.queryKey}
        fieldLabel={null}
        vertical
        showRemoveButton={false}
        onChange={this.onChange}
        value={this.state.value}
      />
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
      const graphQlQuery =
        getInstanceName +
        '(uuid:"' +
        query[this.props.queryKey] +
        '") { ' +
        this.props.fields +
        "}"
      return API.query(graphQlQuery).then(data => {
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
