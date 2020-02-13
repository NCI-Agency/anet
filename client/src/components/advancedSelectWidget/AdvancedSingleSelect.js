import AdvancedSelect, {
  propTypes as advancedSelectPropTypes
} from "components/advancedSelectWidget/AdvancedSelect"
import { AdvancedSingleSelectOverlayTable } from "components/advancedSelectWidget/AdvancedSelectOverlayTable"
import * as FieldHelper from "components/FieldHelper"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"
import REMOVE_ICON from "resources/delete.png"

const AdvancedSingleSelect = props => {
  return (
    <AdvancedSelect
      {...props}
      handleAddItem={handleAddItem}
      handleRemoveItem={handleRemoveItem}
      closeOverlayOnAdd
      selectedValueAsString={
        !_isEmpty(props.value) ? props.value[props.valueKey] : ""
      }
      extraAddon={
        props.showRemoveButton && !_isEmpty(props.value) ? (
          <img
            src={REMOVE_ICON}
            height={16}
            alt=""
            onClick={handleRemoveItem}
          />
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
AdvancedSingleSelect.propTypes = {
  ...advancedSelectPropTypes,
  value: PropTypes.object
}
AdvancedSingleSelect.defaultProps = {
  overlayTable: AdvancedSingleSelectOverlayTable,
  showRemoveButton: true // whether to display a remove button in the input field to allow removing the selected value
}

export default AdvancedSingleSelect
