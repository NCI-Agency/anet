import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Form, Button, InputGroup, FormControl, Popover, Overlay} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import AdvancedSearch from 'components/AdvancedSearch'

import SEARCH_ICON from 'resources/search-alt.png'

import { withRouter } from 'react-router-dom'
import { setSearchQuery } from 'actions'
import { connect } from 'react-redux'
import utils from 'utils'

class SearchBar extends Component {

	static propTypes = {
		setSearchQuery: PropTypes.func.isRequired,
		query: PropTypes.shape({
			text: PropTypes.string,
			filters: PropTypes.any,
			objectType: PropTypes.string
		})
	}

	constructor(props) {
		super(props)
		this.state = {
			searchTerms: props.query.text,
			showAdvancedSearch: false
		}
	}

//FIXME: should we do something with the history?
//	componentWillMount() {
//		this.unregisterHistoryListener = this.props.history.listen(this.setSearchTermsState)
//	}

	componentWillUnmount() {
		this.unregisterHistoryListener()
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		if (nextProps.query.text === prevState.searchTerms) {
			return null
		}
		return {
			searchTerms: nextProps.query.text
		}
	}
	render() {
		return <div>
			<Form onSubmit={this.onSubmit}>
				<InputGroup>
					<FormControl value={this.state.searchTerms} placeholder="Search for people, reports, positions, or locations" onChange={this.onChange} id="searchBarInput" />
					<InputGroup.Button>
						<Button onClick={this.props.onSubmit} id="searchBarSubmit"><img src={SEARCH_ICON} height={16} alt="Search" /></Button>
					</InputGroup.Button>
				</InputGroup>
			</Form>

			<small ref={(el) => this.advancedSearchLink = el} onClick={() => this.setState({showAdvancedSearch: true})}><a>Advanced search</a></small>
			<Overlay show={this.state.showAdvancedSearch} onHide={() => this.setState({showAdvancedSearch: false})} placement="bottom" target={this.advancedSearchLink}>
				<Popover id="advanced-search" placement="bottom" title="Advanced search">
					<AdvancedSearch onSearch={this.runAdvancedSearch} onCancel={() => this.setState({showAdvancedSearch: false})} />
				</Popover>
			</Overlay>
		</div>
	}

//	@autobind
//	setSearchTermsState(location, action) {
//		const qs = utils.parseQueryString(location.search)
//		this.setState({searchTerms: qs.text || ''})
//	}

	@autobind
	onChange(event) {
		this.setState({searchTerms: event.target.value})
	}

	@autobind
	onSubmit(event) {
//FIXME: should we do something with the history
//		this.props.history.push({
//			pathname: '/search',
//			search: utils.formatQueryString({text: this.props.query})
//		})
		event.preventDefault()
		event.stopPropagation()
		// We only update the Redux state on submit
		this.props.setSearchQuery({text: this.state.searchTerms})
	}

	@autobind
	runAdvancedSearch() {
		this.setState({showAdvancedSearch: false})
		return true
	}
}

const mapStateToProps = (state, ownProps) => ({
	query: state.searchQuery
})

const mapDispatchToProps = (dispatch, ownProps) => ({
	setSearchQuery: searchTerms => dispatch(setSearchQuery(searchTerms))
})

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(SearchBar))
