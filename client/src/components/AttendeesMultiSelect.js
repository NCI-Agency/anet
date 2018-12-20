import PropTypes from 'prop-types'
import React, { Component } from 'react'

import { Button, Col, Collapse, FormGroup, Grid, Row, Table, Tabs, Tab } from 'react-bootstrap'
import ButtonToggleGroup from 'components/ButtonToggleGroup'
import Checkbox from 'components/Checkbox'
import {Person, Position} from 'models'
import LinkTo from 'components/LinkTo'
import { Field } from 'formik'
import { renderInputField } from 'components/FieldHelper'
import API from 'api'
import AdvancedSearchForm from 'components/AdvancedSearchForm'
import autobind from 'autobind-decorator'
import GQL from 'graphqlapi'
import {SEARCH_CONFIG, searchFormToQuery} from 'searchUtils'
import _debounce from 'lodash/debounce'

const AttendeesTable = (props) => {
	return (
		<Table responsive hover striped className="people-search-results">
			<thead>
				<tr>
					<th />
					<th>Name</th>
					<th>Position</th>
					<th>Location</th>
					<th>Organization</th>
				</tr>
			</thead>
			<tbody>
				{Person.map(props.attendees, person => (
					<tr key={person.uuid}>
						<td><Checkbox checked={ props.attendees.checked } onChange={ () => props.onSelectRow(person) } /></td>
						<td>
							<img src={person.iconUrl()} alt={person.role} height={20} className="person-icon" />
							<LinkTo person={person}/>
						</td>
						<td><LinkTo position={person.position} />{person.position && person.position.code ? `, ${person.position.code}`: ``}</td>
						<td><LinkTo whenUnspecified="" anetLocation={person.position && person.position.location} /></td>
						<td>{person.position && person.position.organization && <LinkTo organization={person.position.organization} />}</td>
					</tr>
				))}
			</tbody>
		</Table>
	)
}

export default class AttendeesMultiSelect extends Component {
	static propTypes = {
		addFieldName: PropTypes.string.isRequired, // name of the autocomplete field
		addFieldLabel: PropTypes.string, // label of the autocomplete field
		items: PropTypes.array.isRequired,
		renderSelected: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired, // how to render the selected items
		onAddItem: PropTypes.func.isRequired,
		onRemoveItem: PropTypes.func,
		shortcutDefs: PropTypes.object,
		renderExtraCol: PropTypes.bool, // set to false if you want this column completely removed
		addon: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),

		//Needed for the autocomplete widget
		//Required: ANET Object Type (Person, Report, etc) to search for.
		objectType: PropTypes.func.isRequired,
		//Optional: The property of the selected object to display.
		valueKey: PropTypes.string,
		//Optional: A function to render each item in the list of suggestions.
		template: PropTypes.func,
		//Optional: Parameters to pass to search function.
		queryParams: PropTypes.object,
		//Optional: GraphQL string of fields to return from search.
		fields: PropTypes.string,
		currentUser: PropTypes.instanceOf(Person),
	}

	static defaultProps = {
		addFieldLabel: 'Add item',
		shortcutDefs: {},
		renderExtraCol: true,
	}

	state = {
		searchTerms: '',
		shortcutKey: Object.keys(this.props.shortcutDefs)[0],
		suggestions: [],
		pageNum: 0,
		showShortcuts: false,
	}

	render() {
		const {addFieldName, addFieldLabel, renderSelected, items, onAddItem, onRemoveItem, shortcutDefs, renderExtraCol, addon, ...autocompleteProps} = this.props
		const renderSelectedWithDelete = React.cloneElement(renderSelected, {onDelete: this.removeItem})
		return (
			<React.Fragment>
				<Field
					name={addFieldName}
					label={addFieldLabel}
					component={renderInputField}
					value={this.state.searchTerms}
					onChange={this.changeSearchTerms}
					onFocus={() => this.setState({showShortcuts: true}, () => this.fetchSuggestions())}
				/>
				<Collapse in={this.state.showShortcuts}>
					<Row>
						<Col sm={2} />
						<Col sm={7}>
							<ButtonToggleGroup value={this.state.shortcutKey} onChange={this.changeShortcut} className="hide-for-print">
								{Object.keys(shortcutDefs).map(shortcutKey =>
									<Button key={shortcutKey} value={shortcutKey}>{shortcutDefs[shortcutKey].label}</Button>
								)}
							</ButtonToggleGroup>
							<AttendeesTable attendees={this.state.suggestions} onSelectRow={this.addItem} />
						</Col>
					</Row>
				</Collapse>
				{renderSelectedWithDelete}
			</React.Fragment>
		)
	}

	changeSearchTerms = (event) => {
		this.setState({searchTerms: event.target.value}, () => this.fetchSuggestionsDebounced())
	}

	changeShortcut = (shortcutKey) => {
		this.setState({shortcutKey}, () => this.fetchSuggestions())
	}

	fetchSuggestions = () => {
		const {shortcutKey} = this.state
		const shortcutDefs = this.props.shortcutDefs[shortcutKey]
		const resourceName = this.props.objectType.resourceName
		const listName = shortcutDefs.listName || this.props.objectType.listName
		if (shortcutDefs.searchQuery) {
			// GraphQL search type of query
			let graphQlQuery = listName + ' (query: $query) { '
			+ 'list { ' + this.props.fields + '}'
			+ '}'
			const variableDef = '($query: ' + resourceName + 'SearchQueryInput)'
			let queryVars = {pageNum: 0, pageSize: 6}
			if (this.props.queryParams) {
				Object.assign(queryVars, this.props.queryParams)
			}
			if (shortcutDefs.queryVars) {
				Object.assign(queryVars, shortcutDefs.queryVars)
			}
			if (this.state.searchTerms) {
				Object.assign(queryVars, {text: this.state.searchTerms + "*"})
			}
			API.query(graphQlQuery, {query: queryVars}, variableDef).then(data => {
				this.setState({suggestions: data[listName].list})
			})
		}
		else {
			API.query(/* GraphQL */`
					` + listName + `(` + shortcutDefs.listArgs + `) {
						list { ` + this.props.fields + ` }
					}`
			).then(data => {
				this.setState({suggestions: data[listName].list})
			})
		}
	}

	fetchSuggestionsDebounced = _debounce(this.fetchSuggestions, 200)

	addItem = (newItem) => {
		if (!newItem || !newItem.uuid) {
			return
		}
		if (!this.props.items.find(obj => obj.uuid === newItem.uuid)) {
			this.props.onAddItem(newItem)
		}
	}

	removeItem = (oldItem) => {
		if (this.props.items.find(obj => obj.uuid === oldItem.uuid)) {
			this.props.onRemoveItem(oldItem)
		}
	}
}
