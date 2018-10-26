import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Table} from 'react-bootstrap'

import UltimatePagination from 'components/UltimatePagination'
import LinkTo from 'components/LinkTo'
import {Position} from 'models'

import utils from 'utils'
import _get from 'lodash/get'

import REMOVE_ICON from 'resources/delete.png'

export default class PositionTable extends Component {
	static propTypes = {
		positions: PropTypes.array, // list of positions, when no pagination wanted
		showDelete: PropTypes.bool,
		onDelete: PropTypes.func,
		paginatedPositions: PropTypes.shape({
			totalCount: PropTypes.number,
			pageNum: PropTypes.number,
			pageSize: PropTypes.number,
			list: PropTypes.array.isRequired,
		}),
		goToPage: PropTypes.func,
	}

	render() {
		let positions
		let numPages = 0
		if (this.props.paginatedPositions) {
			var {pageSize, pageNum, totalCount} = this.props.paginatedPositions
			numPages = (pageSize <= 0) ? 1 : Math.ceil(totalCount / pageSize)
			positions = this.props.paginatedPositions.list
			pageNum++
		} else {
			positions = this.props.positions
		}

		let positionsExist = _get(positions, 'length', 0) > 0
		return <div>
			{positionsExist ?
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

				<Table responsive hover striped className="positions_table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Location</th>
							<th>Org</th>
							<th>Current Occupant</th>
							<th>Status</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{Position.map(positions, pos => {
							let nameComponents =  []
							pos.name && nameComponents.push(pos.name)
							pos.code && nameComponents.push(pos.code)
							return <tr key={pos.id}>
									<td>
										<img src={pos.iconUrl()} alt={pos.type} height={20} className="person-icon" />
										<LinkTo position={pos} >{nameComponents.join(' - ')}</LinkTo>
									</td>
									<td><LinkTo anetLocation={pos.location} /></td>
									<td>{pos.organization && <LinkTo organization={pos.organization} />}</td>
									<td>{pos.person && <LinkTo person={pos.person} />}</td>
									<td>{utils.sentenceCase(pos.status)}</td>
									{this.props.showDelete && <td onClick={this.props.onDelete.bind(this, pos)} id={'positionDelete_' + pos.id} >
										<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt="Remove position" /></span>
									</td>}
								</tr>
							}
						)}
					</tbody>
				</Table>
			</div>
		:
			<em>No positions found</em>
		}
		</div>
	}
}