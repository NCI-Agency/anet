import React, { Component } from "react"
import { Radio, Table } from "react-bootstrap"
import Checkbox from "components/Checkbox"
import LoaderHOC from "HOC/LoaderHOC"
import _isEmpty from "lodash/isEmpty"

const AdvancedSelectOverlayTable = ({
  fieldName,
  objectType,
  items,
  selectedItems,
  handleAddItem,
  handleRemoveItem,
  columns,
  renderRow,
  selectItemComponent,
  tableClassName
}) => {
  const selectedItemsUuids = selectedItems.map(a => a.uuid)
  return (
    <Table responsive hover striped className={tableClassName}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {objectType.map(items, item => {
          const isSelected = selectedItemsUuids.includes(item.uuid)
          const handleClick = () =>
            isSelected ? handleRemoveItem(item) : handleAddItem(item)
          const renderSelectComponent = React.cloneElement(
            selectItemComponent,
            { name: fieldName, checked: isSelected, onChange: handleClick }
          )
          return (
            <tr key={item.uuid} onClick={handleClick}>
              <td style={{ textAlign: "center" }}>{renderSelectComponent}</td>
              {renderRow(item)}
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}

const AdvancedSingleSelectOverlayTableBase = props => {
  const { selectedItems, ...otherProps } = props
  return (
    <AdvancedSelectOverlayTable
      {...otherProps}
      selectedItems={_isEmpty(selectedItems) ? [] : [selectedItems]}
      selectItemComponent={
        <Radio style={{ paddingTop: "3px", textAlign: "center" }} />
      }
    />
  )
}

const AdvancedMultiSelectOverlayTableBase = props => {
  return (
    <AdvancedSelectOverlayTable {...props} selectItemComponent={<Checkbox />} />
  )
}

export const AdvancedSingleSelectOverlayTable = LoaderHOC("isLoading")("items")(
  AdvancedSingleSelectOverlayTableBase
)
export const AdvancedMultiSelectOverlayTable = LoaderHOC("isLoading")("items")(
  AdvancedMultiSelectOverlayTableBase
)
