import AdvancedSelect, {
  AdvancedSelectProps
} from "components/advancedSelectWidget/AdvancedSelect"
import { AdvancedSingleSelectOverlayTable } from "components/advancedSelectWidget/AdvancedSelectOverlayTable"
import * as FieldHelper from "components/FieldHelper"
import _isEmpty from "lodash/isEmpty"
import React from "react"
import RemoveButton from "../RemoveButton"

interface AdvancedSingleSelectProps extends AdvancedSelectProps {
  value?: any
  valueFunc?: (...args: unknown[]) => unknown
  showRemoveButton: boolean
}

const AdvancedSingleSelect = ({
  value = {},
  valueFunc = (v, k) => v?.[k],
  overlayTable = AdvancedSingleSelectOverlayTable,
  showRemoveButton = true,
  ...props
}: AdvancedSingleSelectProps) => {
  return (
    <AdvancedSelect
      value={value}
      valueFunc={valueFunc}
      overlayTable={overlayTable}
      {...props}
      handleAddItem={handleAddItem}
      handleRemoveItem={handleRemoveItem}
      closeOverlayOnAdd
      selectedValueAsString={
        _isEmpty(value) ? "" : valueFunc(value, props.valueKey)
      }
      extraAddon={
        showRemoveButton && !_isEmpty(value) ? (
          <RemoveButton title="Clear selection" onClick={handleRemoveItem} />
        ) : null
      }
    />
  )

  function handleAddItem(newItem) {
    FieldHelper.handleSingleSelectAddItem(newItem, props.onChange)
  }

  function handleRemoveItem(oldItem) {
    FieldHelper.handleSingleSelectRemoveItem(oldItem, props.onChange)
  }
}

export default AdvancedSingleSelect
