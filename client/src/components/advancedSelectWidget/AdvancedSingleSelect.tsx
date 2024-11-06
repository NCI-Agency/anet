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

const AdvancedSingleSelect = (props: AdvancedSingleSelectProps) => {
  return (
    <AdvancedSelect
      {...props}
      handleAddItem={handleAddItem}
      handleRemoveItem={handleRemoveItem}
      createEntityComponent={props.createEntityComponent}
      closeOverlayOnAdd
      selectedValueAsString={
        _isEmpty(props.value)
          ? ""
          : props.valueFunc(props.value, props.valueKey)
      }
      extraAddon={
        props.showRemoveButton && !_isEmpty(props.value) ? (
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
AdvancedSingleSelect.defaultProps = {
  value: {},
  valueFunc: (v, k) => v?.[k],
  overlayTable: AdvancedSingleSelectOverlayTable,
  showRemoveButton: true // whether to display a remove button in the input field to allow removing the selected value
}

export default AdvancedSingleSelect
