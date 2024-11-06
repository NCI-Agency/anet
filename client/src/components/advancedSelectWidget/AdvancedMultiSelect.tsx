import AdvancedSelect, {
  AdvancedSelectProps
} from "components/advancedSelectWidget/AdvancedSelect"
import { AdvancedMultiSelectOverlayTable } from "components/advancedSelectWidget/AdvancedSelectOverlayTable"
import * as FieldHelper from "components/FieldHelper"
import React from "react"

interface AdvancedMultiSelectProps extends AdvancedSelectProps {
  value: any[]
}

const AdvancedMultiSelect = (props: AdvancedMultiSelectProps) => {
  return (
    <AdvancedSelect
      {...props}
      handleAddItem={handleAddItem}
      handleRemoveItem={handleRemoveItem}
    />
  )

  function handleAddItem(newItem) {
    FieldHelper.handleMultiSelectAddItem(newItem, props.onChange, props.value)
  }

  function handleRemoveItem(oldItem) {
    FieldHelper.handleMultiSelectRemoveItem(
      oldItem,
      props.onChange,
      props.value
    )
  }
}
AdvancedMultiSelect.defaultProps = {
  value: [],
  overlayTable: AdvancedMultiSelectOverlayTable
}

export default AdvancedMultiSelect
