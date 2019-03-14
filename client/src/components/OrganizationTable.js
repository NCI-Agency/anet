import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Table} from 'react-bootstrap'

import UltimatePagination from 'components/UltimatePagination'
import LinkTo from 'components/LinkTo'
import RemoveButton from 'components/RemoveButton'
import {Organization} from 'models'
import Settings from 'Settings'

import _get from 'lodash/get'
import pluralize from 'pluralize'

import REMOVE_ICON from 'resources/delete.png'

export default class OrganizationTable extends Component {
	static propTypes = {
		items: PropTypes.array, // list of items, when no pagination wanted
		showDelete: PropTypes.bool,
		onDelete: PropTypes.func,
		paginatedItems: PropTypes.shape({
			totalCount: PropTypes.number,
			pageNum: PropTypes.number,
			pageSize: PropTypes.number,
			list: PropTypes.array.isRequired,
		}),
		goToPage: PropTypes.func,
		optional: PropTypes.bool,
		tableClassName: PropTypes.string
	}

	render() {
		let items = []
		let numPages = 0
		if (this.props.paginatedItems) {
			var {pageSize, pageNum, totalCount} = this.props.paginatedItems
			numPages = (pageSize <= 0) ? 1 : Math.ceil(totalCount / pageSize)
			items = this.props.paginatedItems.list
			pageNum++
		} else {
			items = this.props.items
		}

		const itemsExist = _get(items, 'length', 0) > 0
		return <div>
			{itemsExist ?
				<div>
					{numPages > 1 &&
						<header className="searchPagination">
							<UltimatePagination
								className="pull-right"
								currentPage={pageNum}
								totalPages={numPages}
								boundaryPagesRange={1}
								siblingPagesRange={2}
								hideEllipsis={false}
								hidePreviousAndNextPageLinks={false}
								hideFirstAndLastPageLinks={true}
								onChange={(value) => this.props.goToPage(value - 1)}
							/>
						</header>
					}
					<Table striped condensed hover responsive className={this.props.tableClassName}>
						<thead>
							<tr>
								<th>Name</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{Organization.map(items, item =>
								<tr key={item.uuid}>
									<td><LinkTo organization={item} /></td>
									{this.props.showDelete && <td>
										<RemoveButton handleOnClick={this.props.onDelete.bind(this, item)} className="pull-right" title="Remove organization" />
									</td>}
								</tr>
							)}
						</tbody>
					</Table>
				</div>
			:
				<em>No organization found</em>
		}
		</div>
	}
}
