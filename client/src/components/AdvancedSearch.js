import PropTypes from 'prop-types'
import React, { Component } from 'react'
import autobind from 'autobind-decorator'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import _cloneDeep from 'lodash/cloneDeep'

import AdvancedSearchForm from 'components/AdvancedSearchForm'

import { setSearchQuery } from 'actions'

class AdvancedSearch extends Component {
	static propTypes = {
		onSearch: PropTypes.func,
		onCancel: PropTypes.func,
		setSearchQuery: PropTypes.func.isRequired,
		query: PropTypes.shape({
			text: PropTypes.string,
			filters: PropTypes.any,
			objectType: PropTypes.string
		}),
		onSearchGoToSearchPage: PropTypes.bool,
		searchObjectTypes: PropTypes.array,
		text: PropTypes.string,
	}

	render() {
		const advancedSearchProps = Object.without(this.props, 'onSearchGoToSearchPage', 'setSearchQuery')
		return <AdvancedSearchForm {...advancedSearchProps} onSearchCallback={this.onSearchCallback} />
	}

	@autobind
	onSearchCallback(queryState) {
		if (typeof this.props.onSearch === 'function') {
			this.props.onSearch()
		}
		// We only update the Redux state on submit
		this.props.setSearchQuery(queryState)
		if (this.props.onSearchGoToSearchPage) {
			this.props.history.push({
				pathname: '/search'
			})
		}
	}
}

const mapStateToProps = (state, ownProps) => {
	return {
		query: _cloneDeep(state.searchQuery),
		onSearchGoToSearchPage: state.searchProps.onSearchGoToSearchPage,
		searchObjectTypes: state.searchProps.searchObjectTypes
	}
}

const mapDispatchToProps = (dispatch, ownProps) => ({
	setSearchQuery: advancedSearchQuery => dispatch(setSearchQuery(advancedSearchQuery))
})

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(AdvancedSearch))
