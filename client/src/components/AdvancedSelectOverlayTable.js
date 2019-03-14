import React, { Component } from 'react'
import { Radio, Table } from 'react-bootstrap'
import { Classes, Icon } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import classNames from 'classnames'
import Checkbox from 'components/Checkbox'


const AdvancedSelectOverlayTable = (props) => {
	const { fieldName, objectType, items, selectedItems, handleAddItem, handleRemoveItem, columns, renderRow, selectItemComponent } = props
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
						{selectItemComponent(fieldName, item, isSelected, handleAddItem, handleRemoveItem )}
						{renderRow(item)}
					</tr>
				})}
			</tbody>
		</Table>
	)
}

export const AdvancedSingleSelectOverlayTable = (props) => {
	return (
		<AdvancedSelectOverlayTable
			{...props}
			selectItemComponent={
				(fieldName, item, isSelected, handleAddItem, handleRemoveItem) => (
					<td style={{ textAlign: "center" }}>
						<Radio name={fieldName}
							checked={isSelected}
							style={{paddingTop: '3px', textAlign: 'center'}}
							onChange={() => handleAddItem(item)}>
						</Radio>
					</td>
				)
			}
		/>
	)
}

export const AdvancedMultiSelectOverlayTable = (props) => {
	return (
		<AdvancedSelectOverlayTable
			{...props}
			selectItemComponent={
				(fieldName, item, isSelected, handleAddItem, handleRemoveItem) => (
					<td style={{ textAlign: "center" }}>
					{isSelected ?
						<Checkbox checked={isSelected} onChange={() => handleRemoveItem(item)} />
					:
						<Checkbox checked={isSelected} onChange={() => handleAddItem(item)} />
					}
					</td>
				)
			}
		/>
	)
}
