import AdvancedSelect, {
  AdvancedSelectProps
} from "components/advancedSelectWidget/AdvancedSelect"
import { AdvancedMultiSelectOverlayTable } from "components/advancedSelectWidget/AdvancedSelectOverlayTable"
import * as FieldHelper from "components/FieldHelper"
import React from "react"

interface AdvancedMultiSelectProps extends AdvancedSelectProps {
  value: any[]
}

const AdvancedMultiSelect = ({
  value = [],
  overlayTable = AdvancedMultiSelectOverlayTable,
  ...props
}: AdvancedMultiSelectProps) => {
  return (
    <AdvancedSelect
      value={value}
      overlayTable={overlayTable}
      {...props}
      handleAddItem={handleAddItem}
      handleRemoveItem={handleRemoveItem}
    />
  )

  function handleAddItem(newItem) {
    FieldHelper.handleMultiSelectAddItem(newItem, props.onChange, value)
  }

  function handleRemoveItem(oldItem) {
    FieldHelper.handleMultiSelectRemoveItem(oldItem, props.onChange, value)
  }
}

export default AdvancedMultiSelect
