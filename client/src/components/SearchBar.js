import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Form, Button, InputGroup, FormControl, Popover, Overlay} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import AdvancedSearch from 'components/AdvancedSearch'
import searchFilters from 'components/SearchFilters'

import SEARCH_ICON from 'resources/search-alt.png'

import { withRouter } from 'react-router-dom'
import { resetPages, resetPagination, setSearchQuery } from 'actions'
import { connect } from 'react-redux'

class SearchBar extends Component {

	static propTypes = {
		setSearchQuery: PropTypes.func.isRequired,
		query: PropTypes.shape({
			text: PropTypes.string,
			filters: PropTypes.any,
			objectType: PropTypes.string
		}),
		searchObjectTypes: PropTypes.array,
		resetPages: PropTypes.func,
		resetPagination: PropTypes.func,
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
		const placeholder = this.props.query.objectType
			? "Filter " + this.props.query.objectType
			: "Search for " + this.props.searchObjectTypes.join(", ")
		return <div>
			<Form onSubmit={this.onSubmit}>
				<InputGroup>
					<FormControl value={this.state.searchTerms} placeholder={placeholder} onChange={this.onChange} id="searchBarInput" />
					{!this.state.showAdvancedSearch && <InputGroup.Button>
						<Button onClick={this.onSubmit} id="searchBarSubmit"><img src={SEARCH_ICON} height={16} alt="Search" /></Button>
					</InputGroup.Button>}
				</InputGroup>
			</Form>

			<div className="add-search-filter" ref={(el) => this.advancedSearchLink = el} onClick={() => this.setState({showAdvancedSearch: !this.state.showAdvancedSearch})}>
				<span className="asLink">
					{(this.props.query.objectType) ?
						<React.Fragment>
							<b>{this.props.query.objectType}</b>
							{(filters.length > 0) ?
								<React.Fragment>
									<React.Fragment> filtered on </React.Fragment>
									{filters.map((filter, i) =>
										filterDefs[filter.key] && <SearchFilterDisplay key={filter.key} filter={filter} element={filterDefs[filter.key]} showSeparator={i !== filters.length-1} />
									)}
								</React.Fragment>
							:
								" - add filters"
							}
						</React.Fragment>
					:
						"Add filters"
					}
				</span></div>
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
		if (!this.state.showAdvancedSearch) {
			// We only update the Redux state on submit
			this.props.resetPagination()
			this.props.setSearchQuery({text: this.state.searchTerms})
			if (this.props.onSearchGoToSearchPage) {
				this.props.history.push({
					pathname: '/search'
				})
			}
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
	searchObjectTypes: state.searchProps.searchObjectTypes
})

const mapDispatchToProps = (dispatch, ownProps) => ({
	setSearchQuery: searchTerms => dispatch(setSearchQuery(searchTerms)),
	resetPages: () => dispatch(resetPages()),
	resetPagination: () => dispatch(resetPagination()),
})

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(SearchBar))


class SearchFilterDisplay extends Component {
	static propTypes = {
		filter: PropTypes.object,
		element: PropTypes.shape({
			component: PropTypes.func.isRequired,
			props: PropTypes.object,
		}),
		showSeparator: PropTypes.bool,
	}

	render() {
		const {filter, element} = this.props
		const label = filter.key
		const ChildComponent = element.component
		const sep = this.props.showSeparator ? ", " : ""
		return <React.Fragment>
			<b>{label}</b>:	<em>
				<ChildComponent
					value={filter.value || ""}
					asFormField={false}
					{...element.props}
				/>
			</em>{sep}
		</React.Fragment>
	}
}
