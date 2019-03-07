import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Button, Col, Row, Overlay, Popover } from 'react-bootstrap'
import { Field } from 'formik'
import _cloneDeep from 'lodash/cloneDeep'
import _debounce from 'lodash/debounce'
import _isEmpty from 'lodash/isEmpty'

import { renderInputField } from 'components/FieldHelper'
import UltimatePagination from 'components/UltimatePagination'
import LinkTo from 'components/LinkTo'
import './AdvancedMultiSelect.css'
import API from 'api'

const AdvancedMultiSelectTarget = ({ overlayRef, children }) =>
	<React.Fragment>
		<Row>
			<Col sm={9} className="form-group" ref={overlayRef} style={{position: 'relative', marginBottom: 0}} />
		</Row>
		<Row>
			<Col smOffset={2} sm={7}>{children}</Col>
		</Row>
	</React.Fragment>

export default class AdvancedMultiSelect extends Component {
	static propTypes = {
		fieldName: PropTypes.string.isRequired,  // input field name
		fieldLabel: PropTypes.string,  // input field label
		placeholder: PropTypes.string,  // input field placeholder
		selectedItems: PropTypes.array.isRequired,  // already selected items
		renderSelected: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,  // how to render the selected items
		overlayComponent: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),  // search results component for in the overlay
		filterDefs: PropTypes.object,  // config of the search filters
		onChange: PropTypes.func.isRequired,
		//Required: ANET Object Type (Person, Report, etc) to search for.
		objectType: PropTypes.func.isRequired,
		//Optional: Parameters to pass to all search filters.
		queryParams: PropTypes.object,
		//Optional: GraphQL string of fields to return from search.
		fields: PropTypes.string,
		shortcuts: PropTypes.array,
		shortcutsTitle: PropTypes.string,
		renderExtraCol: PropTypes.bool, // set to false if you want this column completely removed
		addon: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
	}

	static defaultProps = {
		fieldLabel: 'Add item',
		filterDefs: {},
		shortcuts: [],
		shortcutsTitle: 'Recents',
		renderExtraCol: true,
	}

	state = {
		searchTerms: '',
		filterType: Object.keys(this.props.filterDefs)[0], // per default use the first filter
		results: {},
		showOverlay: false,
		inputFocused: false,
		isLoading: false,
	}

	render() {
		const { fieldName, fieldLabel, placeholder, selectedItems, renderSelected, filterDefs, renderExtraCol, addon } = this.props
		const { results, filterType, isLoading } = this.state
		const renderSelectedWithDelete = React.cloneElement(renderSelected, {onDelete: this.removeItem})
		const items = results && results[filterType] ? results[filterType].list : []
		return (
			<React.Fragment>
				<Field
					name={fieldName}
					label={fieldLabel}
					component={renderInputField}
					value={this.state.searchTerms}
					placeholder={placeholder}
					onChange={this.changeSearchTerms}
					onFocus={this.handleInputFocus}
					onBlur={this.handleInputBlur}
					innerRef={el => {this.overlayTarget = el}}
					extraColElem={renderExtraCol ? this.renderShortcutsTitle() : null}
					addon={addon}
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
					<Popover id={fieldName} title={null} placement="bottom" style={{width: '100%', maxWidth: '100%', boxShadow: '0 6px 20px hsla(0, 0%, 0%, 0.4)'}}>
						<Row className="border-between">
							<div className="sideBar">
								<Col sm={4} md={3}>
									<ul className="overlayFilters">
										{Object.keys(filterDefs).map(filterType => (
											!filterDefs[filterType].doNotDisplay && 
											<li key={filterType} className={(this.state.filterType === filterType) ? 'active' : null}>
												<Button bsStyle="link" onClick={() => this.changeFilterType(filterType)}>{filterDefs[filterType].label}</Button>
											</li>
										))}
									</ul>
								</Col>
							</div>
							<div className="multiSelectContent">
								<Col sm={8} md={9}>
									<this.props.overlayComponent
										items={items}
										selectedItems={selectedItems}
										addItem={this.addItem}
										removeItem={this.removeItem}
										isLoading={isLoading}
										loaderMessage={"No results found"}
									/>
									<footer className="searchPagination">
										{this.paginationFor(filterType)}
									</footer>
								</Col>
							</div>
						</Row>
					</Popover>
				</Overlay>
				<AdvancedMultiSelectTarget overlayRef={el => this.overlayContainer = el}>
					{renderSelectedWithDelete}
				</AdvancedMultiSelectTarget>
			</React.Fragment>
		)
	}

	handleInputFocus = () => {
		if (this.state.inputFocused === true) {
			return
		}
		this.setState({
			inputFocused: true,
			showOverlay: true,
			isLoading: true,
		}, this.fetchResults())
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
			filterType: Object.keys(this.props.filterDefs)[0],
			searchTerms: '',
			results: {},
			isLoading: false,
			showOverlay: false,
		})
	}

	changeSearchTerms = (event) => {
		// Reset the results state when the search terms change
		this.setState({
			isLoading: true,
			searchTerms: event.target.value,
			results: {}
		}, () => this.fetchResultsDebounced())
	}

	changeFilterType = (filterType) => {
		// When changing the filter type, only fetch the results if they were not fetched before
		const { results } = this.state
		const filterResults = results[filterType]
		const fetchResults = _isEmpty(filterResults)
		this.setState({	filterType,	isLoading: fetchResults }, () => {
			if (fetchResults) {
				this.fetchResults()
			}
		})
	}

	fetchResults = (pageNum = 0) => {
		const { filterType, results } = this.state
		const filterDefs = this.props.filterDefs[filterType]
		if (pageNum === undefined) {
			pageNum = results && results[filterType] ? results[filterType].pageNum : 0
		}
		if (filterDefs.list) {
			// No need to fetch the data, it is already provided in the filter definition
			this.setState({
				isLoading: !_isEmpty(filterDefs.list),
				results: {
					...results,
					[filterType]: {list: filterDefs.list, pageNum: pageNum, pageSize: 6, totalCount: filterDefs.list.length}
				}
			})
		} else {
			this.queryResults(filterDefs, filterType, results, pageNum)
		}
	}

	queryResults = (filterDefs, filterType, oldResults, pageNum) => {
		const resourceName = this.props.objectType.resourceName
		const listName = filterDefs.listName || this.props.objectType.listName
		this.setState({isLoading: true}, () => {
			if (filterDefs.searchQuery) {
				// GraphQL search type of query
				const graphQlQuery = listName + ' (query: $query) { '
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
					const isLoading = data[listName].totalCount !== 0
					this.setState({
						isLoading,
						results: {
							...oldResults,
							[filterType]: data[listName]
						}
					})
				})
			}
			else {
				// GraphQL query other than search type
				API.query(/* GraphQL */`
						` + listName + `(` + filterDefs.listArgs + `) {
					pageNum, pageSize, totalCount, list { ` + this.props.fields + ` }
						}`
				).then(data => {
					const isLoading = data[listName].totalCount !== 0
					this.setState({
						isLoading,
						results: {
							...oldResults,
							[filterType]: data[listName]
						}
					})
				})
			}
		})
	}

	fetchResultsDebounced = _debounce(this.fetchResults, 400)

	addItem = (newItem) => {
		if (!newItem || !newItem.uuid) {
			return
		}
		if (!this.props.selectedItems.find(obj => obj.uuid === newItem.uuid)) {
			const selectedItems = _cloneDeep(this.props.selectedItems)
			selectedItems.push(newItem)
			this.props.onChange(selectedItems)
		}
	}

	removeItem = (oldItem) => {
		if (this.props.selectedItems.find(obj => obj.uuid === oldItem.uuid)) {
			const selectedItems = _cloneDeep(this.props.selectedItems)
			const index = selectedItems.findIndex(item => item.uuid === oldItem.uuid)
			selectedItems.splice(index, 1)
			this.props.onChange(selectedItems)
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

	renderShortcutsTitle = () => {
		return <div className="shortcut-title"><h5>{this.props.shortcutsTitle}</h5></div>
	}

	renderShortcuts = () => {
		const shortcuts = this.props.shortcuts
		return (shortcuts && shortcuts.length > 0 &&
			<div className="shortcut-list">
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
}
