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

	@autobind
	onChange(event) {
		this.setState({searchTerms: event.target.value})
	}

	@autobind
	onSubmit(event) {
		// We only update the Redux state on submit
		this.props.setSearchQuery({text: this.state.searchTerms})
		if (this.props.onSearchGoToSearchPage) {
			this.props.history.push({
				pathname: '/search'
			})
		}
		event.preventDefault()
		event.stopPropagation()
	}

	@autobind
	runAdvancedSearch() {
		this.setState({showAdvancedSearch: false})
	}
}

const mapStateToProps = (state, ownProps) => ({
	query: state.searchQuery,
	onSearchGoToSearchPage: state.pageProps.onSearchGoToSearchPage,
})

const mapDispatchToProps = (dispatch, ownProps) => ({
	setSearchQuery: searchTerms => dispatch(setSearchQuery(searchTerms))
})

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(SearchBar))
