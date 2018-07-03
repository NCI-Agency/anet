import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Form, Button, InputGroup, FormControl, Popover, Overlay} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import AdvancedSearch from 'components/AdvancedSearch'
import searchFilters from 'components/SearchFilters'

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
		this.ALL_FILTERS = searchFilters.searchFilters()
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.query.text !== this.props.query.text) {
			this.setState({searchTerms: this.props.query.text})
		}
	}

	render() {
		const filterDefs = this.props.query.objectType ? this.ALL_FILTERS[this.props.query.objectType].filters: {}
		const filters = this.props.query.filters.filter(f => filterDefs[f.key])
		return <div>
			<Form onSubmit={this.onSubmit}>
				<InputGroup>
					<FormControl value={this.state.searchTerms} placeholder="Search for people, reports, positions, or locations" onChange={this.onChange} id="searchBarInput" />
					<InputGroup.Button>
						<Button onClick={this.onSubmit} id="searchBarSubmit"><img src={SEARCH_ICON} height={16} alt="Search" /></Button>
					</InputGroup.Button>
				</InputGroup>
			</Form>

			<small ref={(el) => this.advancedSearchLink = el} onClick={() => this.setState({showAdvancedSearch: true})}>
				<span className="asLink">
					<React.Fragment>
					{(filters.length > 0) ?
							<React.Fragment>
								<React.Fragment>{this.props.query.objectType} filtered on </React.Fragment> 
								{filters.map(filter =>
									filterDefs[filter.key] && <SearchFilterDisplay key={filter.key} filter={filter} element={filterDefs[filter.key]} />
								)}
							</React.Fragment>
						:
							"Add filters"
					}
					</React.Fragment>
				</span></small>
			<Overlay show={this.state.showAdvancedSearch} onHide={() => this.setState({showAdvancedSearch: false})} placement="bottom" target={this.advancedSearchLink}>
				<Popover id="advanced-search" placement="bottom" title="Filters">
					<AdvancedSearch onSearch={this.runAdvancedSearch} onCancel={() => this.setState({showAdvancedSearch: false})} text={this.state.searchTerms} />
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
	onSearchGoToSearchPage: state.searchProps.onSearchGoToSearchPage,
})

const mapDispatchToProps = (dispatch, ownProps) => ({
	setSearchQuery: searchTerms => dispatch(setSearchQuery(searchTerms))
})

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(SearchBar))


class SearchFilterDisplay extends Component {
	static propTypes = {
		filter: PropTypes.object,
		element: PropTypes.node,
	}

	render() {
		const {filter, element} = this.props
		const label = filter.key
		const children = React.cloneElement(
			element,
			{value: filter.value || "", asFormField: false}
		)
		return <React.Fragment>{label}: {children}, </React.Fragment>
	}
}
