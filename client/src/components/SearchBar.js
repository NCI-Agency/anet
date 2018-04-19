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
		onChange: PropTypes.func.isRequired,
		query: PropTypes.string.isRequired
	}

	constructor(props) {
		super(props)

		this.state = {
			showAdvancedSearch: false
		}
	}

	componentWillMount() {
		this.unregisterHistoryListener = this.props.history.listen(this.setQueryState)
	}

	componentWillUnmount() {
		this.unregisterHistoryListener()
	}

	render() {
		return <div>
			<Form onSubmit={this.onSubmit}>
				<InputGroup>
					<FormControl value={this.props.query} placeholder="Search for people, reports, positions, or locations" onChange={this.props.onChange} id="searchBarInput" />
					<InputGroup.Button>
						<Button onClick={this.onSubmit} id="searchBarSubmit"><img src={SEARCH_ICON} height={16} alt="Search" /></Button>
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
	setQueryState(location, action) {
		const qs = utils.parseQueryString(location.search)
		this.setState({query: qs.text || ''})
	}

	@autobind
	onSubmit(event) {
		this.props.history.push({
			pathname: '/search',
			search: utils.formatQueryString({text: this.props.query})
		})
		event.preventDefault()
		event.stopPropagation()
	}

	@autobind
	runAdvancedSearch() {
		this.setState({showAdvancedSearch: false})
	}
}

const mapStateToProps = (state, ownProps) => ({
	query: state.searchQuery.query
})

const mapDispatchToProps = (dispatch, ownProps) => ({
	onChange: event => dispatch(setSearchQuery({query: event.target.value}))
})

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(SearchBar))
