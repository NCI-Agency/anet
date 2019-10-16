import autobind from "autobind-decorator"
import _isEqualWith from "lodash/isEqualWith"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { FormGroup } from "react-bootstrap"
import utils from "utils"

export default class SelectSearchFilter extends Component {
  static propTypes = {
    queryKey: PropTypes.string.isRequired,
    values: PropTypes.array.isRequired,
    labels: PropTypes.array,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string,
        toQuery: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
      })
    ]),
    onChange: PropTypes.func,
    asFormField: PropTypes.bool
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
      <>{labels[values.indexOf(this.state.value.value)]}</>
    ) : (
      <FormGroup>
        <select value={this.state.value.value} onChange={this.onChange}>
          {values.map((v, idx) => (
            <option key={idx} value={v}>
              {labels[idx]}
            </option>
          ))}
        </select>
      </FormGroup>
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
