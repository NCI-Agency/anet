import autobind from "autobind-decorator"
import _isEqualWith from "lodash/isEqualWith"
import PropTypes from "prop-types"
import React, { Component } from "react"
import utils from "utils"

export default class SelectSearchFilter extends Component {
  static propTypes = {
    queryKey: PropTypes.string.isRequired,
    values: PropTypes.array.isRequired,
    labels: PropTypes.array,

    // Passed by the SearchFilterDisplay row
    asFormField: PropTypes.bool

    // From SearchFilter row
    // value
    // onChange
  }

  static defaultProps = {
    asFormField: true
  }

  constructor(props) {
    super(props)

    const value = props.value || {}
    this.state = {
      value: {
        value: value.value || props.values[0] || ""
      }
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
    let values = this.props.values
    let labels = this.props.labels || values.map(v => utils.sentenceCase(v))
    return !this.props.asFormField ? (
      <React.Fragment>
        {labels[values.indexOf(this.state.value.value)]}
      </React.Fragment>
    ) : (
      <select value={this.state.value.value} onChange={this.onChange}>
        {values.map((v, idx) => (
          <option key={idx} value={v}>
            {labels[idx]}
          </option>
        ))}
      </select>
    )
  }

  @autobind
  onChange(event) {
    let { value } = this.state
    value.value = event.target.value
    this.setState({ value }, this.updateFilter)
  }

  @autobind
  toQuery() {
    return { [this.props.queryKey]: this.state.value.value }
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
      const toQueryValue = { [this.props.queryKey]: query[this.props.queryKey] }
      return {
        key: key,
        value: {
          value: query[this.props.queryKey],
          toQuery: () => toQueryValue
        }
      }
    }
    return null
  }
}
