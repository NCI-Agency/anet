import AdvancedSelect, {
  propTypes as advancedSelectPropTypes
} from "components/advancedSelectWidget/AdvancedSelect"
import { AdvancedMultiSelectOverlayTable } from "components/advancedSelectWidget/AdvancedSelectOverlayTable"
import * as FieldHelper from "components/FieldHelper"
import PropTypes from "prop-types"
import React from "react"

const AdvancedMultiSelect = props => {
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
AdvancedMultiSelect.propTypes = {
  ...advancedSelectPropTypes,
  value: PropTypes.array.isRequired
}
AdvancedMultiSelect.defaultProps = {
  value: [],
  overlayTable: AdvancedMultiSelectOverlayTable
}

export default AdvancedMultiSelect
