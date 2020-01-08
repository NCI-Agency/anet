import autobind from "autobind-decorator"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Checkbox, FormGroup } from "react-bootstrap"

export default class CheckboxSearchFilter extends Component {
  static propTypes = {
    queryKey: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    asFormField: PropTypes.bool
  }

  static defaultProps = {
    asFormField: true
  }

  constructor(props) {
    super(props)

    this.state = {
      value: {
        value: true
      }
    }
  }

  componentDidMount() {
    this.updateFilter()
  }

  render() {
    const msg = "Authorized for me"
    return !this.props.asFormField ? (
      <>{msg}</>
    ) : (
      <FormGroup>
        <Checkbox readOnly checked={this.state.value.value}>
          {msg}
        </Checkbox>
      </FormGroup>
    )
  }

  @autobind
  toQuery() {
    return { [this.props.queryKey]: this.state.value.value }
  }

  @autobind
  updateFilter() {
    if (this.props.asFormField) {
      const { value } = this.state
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
