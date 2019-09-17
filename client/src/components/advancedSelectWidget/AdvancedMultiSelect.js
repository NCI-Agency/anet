import AdvancedSelect, {
  propTypes as advancedSelectPropTypes
} from "components/advancedSelectWidget/AdvancedSelect"
import { AdvancedMultiSelectOverlayTable } from "components/advancedSelectWidget/AdvancedSelectOverlayTable"
import * as FieldHelper from "components/FieldHelper"
import PropTypes from "prop-types"
import React, { Component } from "react"

export default class AdvancedMultiSelect extends Component {
  static propTypes = {
    ...advancedSelectPropTypes,
    value: PropTypes.array
  }

  static defaultProps = {
    overlayTable: AdvancedMultiSelectOverlayTable
  }

  render() {
    return (
      <AdvancedSelect
        {...this.props}
        handleAddItem={this.handleAddItem}
        handleRemoveItem={this.handleRemoveItem}
      />
    )
  }

  handleAddItem = newItem => {
    FieldHelper.handleMultiSelectAddItem(
      this.props.value,
      newItem,
      this.props.onChange
    )
  }

  handleRemoveItem = oldItem => {
    FieldHelper.handleMultiSelectRemoveItem(
      this.props.value,
      oldItem,
      this.props.onChange
    )
  }
}
