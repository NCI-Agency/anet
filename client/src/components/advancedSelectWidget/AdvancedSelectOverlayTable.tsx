import Checkbox from "components/Checkbox"
import Model from "components/Model"
import LoaderHOC from "HOC/LoaderHOC"
import _isEmpty from "lodash/isEmpty"
import React from "react"
import { Form, Table } from "react-bootstrap"

interface AdvancedSelectOverlayTableProps {
  fieldName: string
  objectType: typeof Model
  items: any[]
  valueKey: string
  pageNum?: number
  selectedItems: any[]
  handleAddItem?: (...args: unknown[]) => unknown
  handleRemoveItem?: (...args: unknown[]) => unknown
  columns: string[]
  renderRow: (...args: unknown[]) => React.ReactNode
  selectItemComponent: React.ReactElement
}

const AdvancedSelectOverlayTable = ({
  fieldName,
  objectType,
  items,
  valueKey,
  pageNum,
  selectedItems = [],
  handleAddItem,
  handleRemoveItem,
  columns,
  renderRow,
  selectItemComponent
}: AdvancedSelectOverlayTableProps) => {
  const selectedItemsUuids = selectedItems.map(a => a[valueKey])
  return (
    <Table responsive hover striped>
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th className={idx === 0 ? "col-1" : undefined} key={col}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {objectType.map(items, (item, i) => {
          const isSelected =
            "isSelected" in item
              ? item.isSelected
              : selectedItemsUuids.includes(item.uuid)
          const handleClick = () =>
            isSelected ? handleRemoveItem(item) : handleAddItem(item)
          const renderSelectComponent = React.cloneElement(
            selectItemComponent,
            { name: fieldName, checked: isSelected, onChange: () => null }
          )
          return (
            <tr
              key={`${item.uuid}-${pageNum}-${i}`}
              onClick={handleClick}
              style={{ cursor: "pointer" }}
            >
              <td style={{ textAlign: "center" }}>{renderSelectComponent}</td>
              {renderRow(item)}
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}

interface AdvancedSingleSelectOverlayTableBaseProps {
  selectedItems?: any | any[]
}

const AdvancedSingleSelectOverlayTableBase = ({
  selectedItems,
  ...otherProps
}: AdvancedSingleSelectOverlayTableBaseProps) => (
  <AdvancedSelectOverlayTable
    {...otherProps}
    selectedItems={_isEmpty(selectedItems) ? [] : [selectedItems]}
    selectItemComponent={<Form.Check type="radio" />}
  />
)

const AdvancedMultiSelectOverlayTableBase = props => (
  <AdvancedSelectOverlayTable {...props} selectItemComponent={<Checkbox />} />
)

export const AdvancedSingleSelectOverlayTable = LoaderHOC("isLoading")("items")(
  AdvancedSingleSelectOverlayTableBase
)
export const AdvancedMultiSelectOverlayTable = LoaderHOC("isLoading")("items")(
  AdvancedMultiSelectOverlayTableBase
)
