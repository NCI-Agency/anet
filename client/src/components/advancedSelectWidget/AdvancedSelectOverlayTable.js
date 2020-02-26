import Checkbox from "components/Checkbox"
import LoaderHOC from "HOC/LoaderHOC"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"
import { Radio, Table } from "react-bootstrap"

const AdvancedSelectOverlayTable = ({
  fieldName,
  objectType,
  items,
  pageNum,
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
        {objectType.map(items, (item, i) => {
          const isSelected = selectedItemsUuids.includes(item.uuid)
          const handleClick = () =>
            isSelected ? handleRemoveItem(item) : handleAddItem(item)
          const renderSelectComponent = React.cloneElement(
            selectItemComponent,
            { name: fieldName, checked: isSelected, onChange: handleClick }
          )
          return (
            <tr key={`${item.uuid}-${pageNum}-${i}`} onClick={handleClick}>
              <td style={{ textAlign: "center" }}>{renderSelectComponent}</td>
              {renderRow(item)}
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}
AdvancedSelectOverlayTable.propTypes = {
  fieldName: PropTypes.string.isRequired,
  objectType: PropTypes.func.isRequired,
  items: PropTypes.array.isRequired,
  pageNum: PropTypes.number,
  selectedItems: PropTypes.array.isRequired,
  handleAddItem: PropTypes.func,
  handleRemoveItem: PropTypes.func,
  columns: PropTypes.array.isRequired,
  renderRow: PropTypes.func.isRequired,
  selectItemComponent: PropTypes.element.isRequired,
  tableClassName: PropTypes.string
}
AdvancedSelectOverlayTable.defaultProps = {
  selectedItems: [],
  tableClassName: ""
}

const AdvancedSingleSelectOverlayTableBase = ({
  selectedItems,
  ...otherProps
}) => {
  return (
    <AdvancedSelectOverlayTable
      {...otherProps}
      selectedItems={_isEmpty(selectedItems) ? [] : [selectedItems]}
      selectItemComponent={<Radio />}
    />
  )
}
AdvancedSingleSelectOverlayTableBase.propTypes = {
  selectedItems: PropTypes.oneOfType([PropTypes.object, PropTypes.array])
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
