import PropTypes from 'prop-types'
import React, { Component } from 'react'

import { Button, Col, Row, Table, Overlay, Popover, FormGroup } from 'react-bootstrap'
import { Classes, Icon } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import classNames from 'classnames'

import {Person, Position} from 'models'
import LinkTo from 'components/LinkTo'
import UltimatePagination from 'components/UltimatePagination'
import './AttendeesMultiSelect.css'

import { Field } from 'formik'
import { renderInputField } from 'components/FieldHelper'

import API from 'api'
import _debounce from 'lodash/debounce'

const AttendeesTable = (props) => {
	const { attendees, selectedAttendees, addItem, removeItem } = props
	const selectedAttendeesUuids = selectedAttendees.map(a => a.uuid)
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
				{Person.map(attendees, person => {
					const isSelected = selectedAttendeesUuids.includes(person.uuid)
					return <tr key={person.uuid}>
						<td>
						{isSelected ?
							<button
								type="button"
								className={classNames(Classes.BUTTON)}
								title="Remove attendee"
								onClick={() => removeItem(person)}
							>
								<Icon icon={IconNames.REMOVE} />
							</button>
						:
						<button
							type="button"
							className={classNames(Classes.BUTTON)}
							title="Add attendee"
							onClick={() => addItem(person)}
							>
								<Icon icon={IconNames.ADD} />
							</button>
						}
						</td>
						<td>
							<img src={person.iconUrl()} alt={person.role} height={20} className="person-icon" />
							<LinkTo person={person}/>
						</td>
						<td><LinkTo position={person.position} />{person.position && person.position.code ? `, ${person.position.code}`: ``}</td>
						<td><LinkTo whenUnspecified="" anetLocation={person.position && person.position.location} /></td>
						<td>{person.position && person.position.organization && <LinkTo organization={person.position.organization} />}</td>
					</tr>
				})}
			</tbody>
		</Table>
	)
}

export default class AttendeesMultiSelect extends Component {
	static propTypes = {
		addFieldName: PropTypes.string.isRequired, // name of the autocomplete field
		addFieldLabel: PropTypes.string, // label of the autocomplete field
		selectedItems: PropTypes.array.isRequired,
		renderSelected: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired, // how to render the selected items
		onAddItem: PropTypes.func.isRequired,
		onRemoveItem: PropTypes.func,
		filterDefs: PropTypes.object,
		renderExtraCol: PropTypes.bool, // set to false if you want this column completely removed
		addon: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),

		//Required: ANET Object Type (Person, Report, etc) to search for.
		objectType: PropTypes.func.isRequired,
		//Optional: Parameters to pass to search function.
		queryParams: PropTypes.object,
		//Optional: GraphQL string of fields to return from search.
		fields: PropTypes.string,
		currentUser: PropTypes.instanceOf(Person),
	}

	static defaultProps = {
		addFieldLabel: 'Add item',
		filterDefs: {},
		renderExtraCol: true,
	}

	state = {
		searchTerms: '',
		filterType: Object.keys(this.props.filterDefs)[0], // per default use the first filter
		results: {},
		showOverlay: false,
		inputFocused: false,
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.selectedItems !== this.props.selectedItems) {
			// Update the list of filter results to consider the already selected items
			this.fetchResults()
		}
	}

	handleInputFocus = () => {
		if (this.state.inputFocused === true) {
			return
		}
		this.setState({
			inputFocused: true,
			showOverlay: true,
		})
	}

	handleInputBlur = () => {
		this.setState({
			inputFocused: false,
		})
	}

	handleHideOverlay = () => {
		if (this.state.inputFocused) {
			return
		}
		this.setState({
			showOverlay: false
		})
	}

	render() {
		const { addFieldName, addFieldLabel, renderSelected, selectedItems, onAddItem, onRemoveItem, filterDefs, renderExtraCol, addon, ...autocompleteProps } = this.props
		const { results, filterType } = this.state
		const renderSelectedWithDelete = React.cloneElement(renderSelected, {onDelete: this.removeItem})
		const attendees = results && results[filterType] ? results[filterType].list : []
		return (
			<React.Fragment>
				<Field
					name={addFieldName}
					label={addFieldLabel}
					component={renderInputField}
					value={this.state.searchTerms}
					onChange={this.changeSearchTerms}
					onFocus={this.handleInputFocus}
					onBlur={this.handleInputBlur}
					innerRef={el => {this.overlayTarget = el}}
				/>
				<Overlay
					show={this.state.showOverlay}
					container={this.overlayContainer}
					target={this.overlayTarget}
					rootClose={true}
					onHide={this.handleHideOverlay}
					placement="bottom"
					animation={false}
					delayHide={200}
				>
					<Popover id={addFieldName} title={null} placement="bottom" style={{width: '100%', maxWidth: '100%'}}>
						<Row className="border-between">
							<Col sm={3}>
								<div className="hide-for-print">
									{Object.keys(filterDefs).map(filterType =>
										<Button key={filterType} style={{textAlign: 'right'}} bsStyle="link" onClick={() => this.changeFilterType(filterType)}>{filterDefs[filterType].label}</Button>
									)}
								</div>
							</Col>
							<Col sm={9}>
								<header className="searchPagination">
									{this.paginationFor(this.state.filterType)}
								</header>
								<AttendeesTable
									attendees={attendees}
									selectedAttendees={selectedItems}
									addItem={this.addItem}
									removeItem={this.removeItem}
								/>
								<footer className="searchPagination">
									{this.paginationFor(this.state.filterType)}
								</footer>
							</Col>
						</Row>
					</Popover>
				</Overlay>
				<Row>
					<Col sm={9} className="form-group" ref={el => {this.overlayContainer = el}} style={{position: 'relative'}} />
					<Col sm={3} />
				</Row>
				<Row>
					<Col sm={2} />
					<Col sm={7}>{renderSelectedWithDelete}</Col>
					<Col sm={3} />
				</Row>
			</React.Fragment>
		)
	}

	changeSearchTerms = (event) => {
		this.setState({searchTerms: event.target.value}, () => this.fetchResultsDebounced(0))
	}

	changeFilterType = (filterType) => {
		this.setState({filterType}, () => this.fetchResults(0))
	}

	_getSelectedItemsUuids = () => {
		const {selectedItems} = this.props
		if (Array.isArray(selectedItems)) {
			return selectedItems.map(object => object.uuid)
		}
		return []
	}

	fetchResults = (pageNum) => {
		const { filterType, results } = this.state
		if (pageNum === undefined) {
			pageNum = results && results[filterType] ? results[filterType].pageNum : 0
		}
		const filterDefs = this.props.filterDefs[filterType]
		const resourceName = this.props.objectType.resourceName
		const listName = filterDefs.listName || this.props.objectType.listName
		if (filterDefs.list) {
			this.setState({
				results: {
					...results,
					[filterType]: {list: filterDefs.list, pageNum: pageNum, pageSize: 6, totalCount: filterDefs.list.length}
				}
			})
		}
		else if (filterDefs.searchQuery) {
			// GraphQL search type of query
			let graphQlQuery = listName + ' (query: $query) { '
			+ 'pageNum, pageSize, totalCount, list { ' + this.props.fields + '}'
			+ '}'
			const variableDef = '($query: ' + resourceName + 'SearchQueryInput)'
			let queryVars = {pageNum: pageNum, pageSize: 6}
			if (this.props.queryParams) {
				Object.assign(queryVars, this.props.queryParams)
			}
			if (filterDefs.queryVars) {
				Object.assign(queryVars, filterDefs.queryVars)
			}
			if (this.state.searchTerms) {
				Object.assign(queryVars, {text: this.state.searchTerms + "*"})
			}
			API.query(graphQlQuery, {query: queryVars}, variableDef).then(data => {
				this.setState({
					results: {
						...results,
						[filterType]: data[listName]
					}
				})
			})
		}
		else {
			API.query(/* GraphQL */`
					` + listName + `(` + filterDefs.listArgs + `) {
				pageNum, pageSize, totalCount, list { ` + this.props.fields + ` }
					}`
			).then(data => {
				this.setState({
					results: {
						...results,
						[filterType]: data[listName]
					}
				})
			})
		}
	}

	fetchResultsDebounced = _debounce(this.fetchResults, 200)

	addItem = (newItem) => {
		if (!newItem || !newItem.uuid) {
			return
		}
		if (!this.props.selectedItems.find(obj => obj.uuid === newItem.uuid)) {
			this.props.onAddItem(newItem)
		}
	}

	removeItem = (oldItem) => {
		if (this.props.selectedItems.find(obj => obj.uuid === oldItem.uuid)) {
			this.props.onRemoveItem(oldItem)
		}
	}

	paginationFor = (filterType) => {
		const {results} = this.state
		const pageSize = results && results[filterType] ? results[filterType].pageSize : 6
		const pageNum = results && results[filterType] ? results[filterType].pageNum : 0
		const totalCount = results && results[filterType] ? results[filterType].totalCount : 0
		const numPages = (pageSize <= 0) ? 1 : Math.ceil(totalCount / pageSize)
		if (numPages <= 1) { return }
		return <UltimatePagination
			className="pull-right"
			currentPage={pageNum + 1}
			totalPages={numPages}
			boundaryPagesRange={1}
			siblingPagesRange={2}
			hideEllipsis={false}
			hidePreviousAndNextPageLinks={false}
			hideFirstAndLastPageLinks={true}
			onChange={(value) => this.goToPage(value - 1)}
		/>
	}

	goToPage = (pageNum) => {
		this.fetchResults(pageNum)
	}
}
