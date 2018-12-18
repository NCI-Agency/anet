import PropTypes from 'prop-types'
import React, { Component } from 'react'

import { Button, Col, FormGroup, Grid, Row, Table } from 'react-bootstrap'
import ButtonToggleGroup from 'components/ButtonToggleGroup'
import {Person, Position} from 'models'
import LinkTo from 'components/LinkTo'
import { Field } from 'formik'
import { renderInputField } from 'components/FieldHelper'
import API from 'api'
import AdvancedSearchForm from 'components/AdvancedSearchForm'
import autobind from 'autobind-decorator'
import GQL from 'graphqlapi'
import {SEARCH_CONFIG, searchFormToQuery} from 'searchUtils'

export default class AttendeesMultiSelect extends Component {
	static propTypes = {
		addFieldName: PropTypes.string.isRequired, // name of the autocomplete field
		addFieldLabel: PropTypes.string, // label of the autocomplete field
		items: PropTypes.array.isRequired,
		renderSelected: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired, // how to render the selected items
		onAddItem: PropTypes.func.isRequired,
		onRemoveItem: PropTypes.func,
		shortcuts: PropTypes.array,
		shortcutsTitle: PropTypes.string,
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
		shortcuts: [],
		shortcutsTitle: 'Recents',
		renderExtraCol: true,
	}

	state = {
		searchTerms: '',
		suggestions: [],
		advanced: false,
		pageNum: 0,
	}

	render() {
		const {addFieldName, addFieldLabel, renderSelected, items, onAddItem, onRemoveItem, shortcuts, shortcutsTitle, renderExtraCol, addon, ...autocompleteProps} = this.props
		const renderSelectedWithDelete = React.cloneElement(renderSelected, {onDelete: this.removeItem})
		return (
			<React.Fragment>
				<Field
					name={addFieldName}
					label={addFieldLabel}
					component={renderInputField}
					value={this.state.searchTerms}
					onChange={this.changeSearchTerms}
				/>
				<Grid fluid>
					<Row>
						<Col xs={3} style={{textAlign: "left"}}>
							<Row>
								<ButtonToggleGroup value={this.state.advanced ? 'advanced': 'common'} onChange={this.changeSearchType}> 
									<Button value="common" onClick={() => this.setState({advanced: false})}>Common</Button>
									<Button value="advanced" onClick={() => this.setState({advanced: true})}>Advanced</Button>
								</ButtonToggleGroup>
							</Row>
							{this.state.advanced ?
								<AdvancedSearchForm
									query={{objectType: this.props.objectType.searchObjectType}}
									searchObjectTypes={[this.props.objectType]}
									onSearchCallback={this.onSearchCallback}
									hideObjectType={true}
									hideTextField={true} />
							:
								<Row className="shortcut-list">
									<Button value="common" bsStyle="link" onClick={() => this.fetchMyColleagues()}>My colleagues</Button>
									<Button value="common" bsStyle="link" onClick={() => this.fetchRecentContacts()}>Recent contacts</Button>
									<Button value="common" bsStyle="link" onClick={() => this.fetchActivePrincipals()}>Active principals</Button>
								</Row>
							}
						</Col>
						<Col xs={9}>
								<Table responsive hover striped className="people-search-results">
									<thead>
										<tr>
											<th>Name</th>
											<th>Position</th>
											<th>Location</th>
											<th>Organization</th>
											<th>&nbsp;</th>
										</tr>
									</thead>
									<tbody>
										{Person.map(this.state.suggestions, person =>
											<tr key={person.uuid}>
												<td>
													<img src={person.iconUrl()} alt={person.role} height={20} className="person-icon" />
													<LinkTo person={person}/>
												</td>
												<td><LinkTo position={person.position} />{person.position && person.position.code ? `, ${person.position.code}`: ``}</td>
												<td><LinkTo whenUnspecified="" anetLocation={person.position && person.position.location} /></td>
												<td>{person.position && person.position.organization && <LinkTo organization={person.position.organization} />}</td>
												<td>
													<Table responsive hover striped className="people-search-results">
														<tbody>
															<tr>
																<td>{person.position.type === Position.TYPE.PRINCIPAL ? 'Is advised by' : 'Advises'}</td>
																<td>counterpart 1 name</td>
																<td>counterpart 1 position</td>
																<td>counterpart 1 location</td>
																<td>counterpart 1 org</td>
															</tr>
															<tr>
																<td>{person.position.type === Position.TYPE.PRINCIPAL ? 'Is advised by' : 'Advises'}</td>
																<td>counterpart 2 name</td>
																<td>counterpart 2 position</td>
																<td>counterpart 2 location</td>
																<td>counterpart 2 org</td>
															</tr>
														</tbody>
													</Table>
												</td>
											</tr>
										)}
									</tbody>
								</Table>
						</Col>
					</Row>
				</Grid>
			</React.Fragment>
		)
	}

	changeSearchTerms = (event) => {
		this.setState({searchTerms: event.target.value}, () => this.fetchSuggestions)
	}

	fetchSuggestions = () => {
		let resourceName = this.props.objectType.resourceName
		let listName = this.props.objectType.listName
		let graphQlQuery = listName + ' (query: $query) { '
				+ 'list { ' + this.props.fields + '}'
				+ '}'
		let variableDef = '($query: ' + resourceName + 'SearchQueryInput)'
		//Only perform search when a value is filled in
		let queryVars = {text: this.state.searchTerms + "*", pageNum: 0, pageSize: 25}
		if (this.props.queryParams) {
			Object.assign(queryVars, this.props.queryParams)
		}
		API.query(graphQlQuery, {query: queryVars}, variableDef).then(data => {
			this.setState({suggestions: data[listName].list})
		})
	}

	fetchMyColleagues = () => {
		let resourceName = this.props.objectType.resourceName
		let listName = this.props.objectType.listName
		let graphQlQuery = listName + ' (query: $query) { '
				+ 'list { ' + this.props.fields + '}'
				+ '}'
		let variableDef = '($query: ' + resourceName + 'SearchQueryInput)'
		let queryVars = {orgUuid: this.props.currentUser.position.organization.uuid, pageNum: 0, pageSize: 25}
		API.query(graphQlQuery, {query: queryVars}, variableDef).then(data => {
			this.setState({suggestions: data[listName].list})
		})		
	}

	fetchMyCounterparts = () => {
		let resourceName = this.props.objectType.resourceName
		let listName = this.props.objectType.listName
		let graphQlQuery = listName + ' (query: $query) { '
				+ 'list { ' + this.props.fields + '}'
				+ '}'
		let variableDef = '($query: ' + resourceName + 'SearchQueryInput)'
		let queryVars = {position: this.props.currentUser.position.associatedPositions, pageNum: 0, pageSize: 25}
		API.query(graphQlQuery, {query: queryVars}, variableDef).then(data => {
			this.setState({suggestions: data[listName].list})
		})		

	}

	fetchRecentContacts = () => {
		API.query(/* GraphQL */`
				personRecents(maxResults:6) {
					list { ` + this.props.fields + ` }
				}`
		).then(data => {
			this.setState({suggestions: data.personRecents.list})
		})
	}

	fetchActivePrincipals = () => {
		let resourceName = this.props.objectType.resourceName
		let listName = this.props.objectType.listName
		let graphQlQuery = listName + ' (query: $query) { '
				+ 'list { ' + this.props.fields + '}'
				+ '}'
		let variableDef = '($query: ' + resourceName + 'SearchQueryInput)'
		let queryVars = {status: Person.STATUS.ACTIVE, role: Person.ROLE.ADVISOR, pageNum: 0, pageSize: 25}
		API.query(graphQlQuery, {query: queryVars}, variableDef).then(data => {
			this.setState({suggestions: data[listName].list})
		})
	}

	getSearchPart(type, query, pageSize) {
		type = type.toLowerCase()
		let subQuery = Object.assign({}, query)
		subQuery.pageSize = (pageSize === undefined) ? 10 : pageSize
		subQuery.pageNum = this.state.pageNum

		let config = SEARCH_CONFIG[type]
		if (config.sortBy) {
			subQuery.sortBy = config.sortBy
		}
		if (config.sortOrder) {
			subQuery.sortOrder = config.sortOrder
		}
		let part = new GQL.Part(/* GraphQL */`
			${config.listName} (query:$${type}Query) {
				pageNum, pageSize, totalCount, list { ${config.fields} }
			}
			`).addVariable(type + "Query", config.variableType, subQuery)
		return part
	}

	@autobind
	_dataFetcher(callback, pageSize) {
		let type = this.props.objectType.searchObjectType.toLowerCase()
		let config = SEARCH_CONFIG[type]
		let {searchQuery} = this.state
		let query = searchFormToQuery(searchQuery)
		return callback([this.getSearchPart(this.props.objectType.searchObjectType, query, pageSize)], config.dataKey)
	}

	@autobind
	_fetchDataCallback(parts, resultsListName) {
		return GQL.run(parts).then(data => {
			this.setState({suggestions: data[resultsListName].list})
		}).catch(error =>
			this.setState({success: null, error: error, didSearch: true})
		)
	}

	fetchSearchData() {
		return this._dataFetcher(this._fetchDataCallback)
	}	
	@autobind
	onSearchCallback(queryState) {
		this.setState({searchQuery: queryState}, () => this.fetchSearchData())
	}

	@autobind
	changeSearchType(searchType) {
		this.setState({advanced: searchType === 'advanced' ? true : false})
	}

	renderShortcuts = () => {
		const shortcuts = this.props.shortcuts
		return (shortcuts && shortcuts.length > 0 &&
			<div className="shortcut-list">
				<h5>{this.props.shortcutsTitle}</h5>
				{shortcuts.map(shortcut => {
					const shortcutLinkProps = {
						[this.props.objectType.getModelNameLinkTo]: shortcut,
						isLink: false,
						forShortcut: true
					}
					return <Button key={shortcut.uuid} bsStyle="link" onClick={() => this.addItem(shortcut)}>Add <LinkTo {...shortcutLinkProps} /></Button>
				})}
			</div>
		)
	}

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
