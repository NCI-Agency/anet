import AdvancedSelect, {
  propTypes as advancedSelectPropTypes
} from "components/advancedSelectWidget/AdvancedSelect"
import { AdvancedSingleSelectOverlayTable } from "components/advancedSelectWidget/AdvancedSelectOverlayTable"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React, { Component } from "react"
import REMOVE_ICON from "resources/delete.png"

export default class AdvancedSingleSelect extends Component {
  static propTypes = {
    ...advancedSelectPropTypes,
    value: PropTypes.object
  }

  static defaultProps = {
    overlayTable: AdvancedSingleSelectOverlayTable,
    showRemoveButton: true  // whether to display a remove button in the input field to allow removing the selected value
  }

  render() {
    return (
      <AdvancedSelect
        {...this.props}
        handleAddItem={this.handleAddItem}
        handleRemoveItem={this.handleRemoveItem}
        closeOverlayOnAdd
        searchTerms={
          !_isEmpty(this.props.value)
            ? this.props.value[this.props.valueKey]
            : ""
        }
        extraAddon={
          this.props.showRemoveButton && !_isEmpty(this.props.value) ? (
            <img
              src={REMOVE_ICON}
              height={16}
              alt=""
              onClick={this.handleRemoveItem}
            />
          ) : null
        }
      />
    )
  }

  handleAddItem = newItem => {
    if (!newItem || !newItem.uuid) {
      return
    }
    this.props.onChange(newItem)
  }

  handleRemoveItem = oldItem => {
    this.props.onChange(null)
  }
}
