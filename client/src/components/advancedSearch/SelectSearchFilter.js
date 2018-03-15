import PropTypes from 'prop-types'
import React, { Component } from 'react'
import autobind from 'autobind-decorator'
import utils from 'utils'

export default class SelectSearchFilter extends Component {
	static propTypes = {
		queryKey: PropTypes.string.isRequired,
		values: PropTypes.array.isRequired,
		labels: PropTypes.array

		//From SearchFilter row
		//value
		//onChange
	}

	constructor(props) {
		super(props)

		let {value} = props

		this.state = {
			value: {
				value: value.value || this.props.values[0] || ''

			}
		}

		this.updateFilter()
	}

	componentDidUpdate() {
		this.updateFilter()
	}

	render() {
		let values = this.props.values
		let labels = this.props.labels || values.map(v => utils.sentenceCase(v))

		return <select value={this.state.value.value} onChange={this.onChange} >
			{values.map((v,idx) =>
				<option key={idx} value={v}>{labels[idx]}</option>
			)}
		</select>
	}

	@autobind
	onChange(event) {
		let {value} = this.state
		value.value = event.target.value
		this.setState({value}, this.updateFilter)
	}

	@autobind
	toQuery() {
		return {[this.props.queryKey]: this.state.value.value}
	}

	@autobind
	updateFilter() {
		let {value} = this.state
		value.toQuery = this.toQuery
		this.props.onChange(value)
	}
}
