import React, { Component } from 'react'
import { Table } from 'react-bootstrap'
import { Classes, Icon } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import classNames from 'classnames'


const AdvancedMultiSelectOverlayTable = (props) => {
	const { objectType, items, selectedItems, addItem, removeItem, columns, renderRow } = props
	const selectedItemsUuids = selectedItems.map(a => a.uuid)
	return (
		<Table responsive hover striped>
			<thead>
				<tr>
					<th />
					{columns.map(col => <th key={col}>{col}</th>)}
				</tr>
			</thead>
			<tbody>
				{objectType.map(items, item => {
					const isSelected = selectedItemsUuids.includes(item.uuid)
					return <tr key={item.uuid}>
						<td>
						{isSelected ?
							<button
								type="button"
								className={classNames(Classes.BUTTON)}
								title="Remove"
								onClick={() => removeItem(item)}
							>
								<Icon icon={IconNames.REMOVE} />
							</button>
						:
						<button
							type="button"
							className={classNames(Classes.BUTTON)}
							title="Add"
							onClick={() => addItem(item)}
							>
								<Icon icon={IconNames.ADD} />
							</button>
						}
						</td>
						{renderRow(item)}
					</tr>
				})}
			</tbody>
		</Table>
	)
}

export default AdvancedMultiSelectOverlayTable
