import AdvancedSelect, {
  propTypes as advancedSelectPropTypes
} from "components/advancedSelectWidget/AdvancedSelect"
import { AdvancedMultiSelectOverlayTable } from "components/advancedSelectWidget/AdvancedSelectOverlayTable"
import _cloneDeep from "lodash/cloneDeep"
import PropTypes from "prop-types"
import React, { Component } from "react"

export default class AdvancedMultiSelect extends Component {
  static propTypes = {
    ...advancedSelectPropTypes,
    value: PropTypes.array.isRequired
  }

  static defaultProps = {
    value: [],
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
    if (!newItem || !newItem.uuid) {
      return
    }
    if (!this.props.value.find(obj => obj.uuid === newItem.uuid)) {
      const value = _cloneDeep(this.props.value)
      value.push(newItem)
      this.props.onChange(value)
    }
  }

  handleRemoveItem = oldItem => {
    if (this.props.value.find(obj => obj.uuid === oldItem.uuid)) {
      const value = _cloneDeep(this.props.value)
      const index = value.findIndex(item => item.uuid === oldItem.uuid)
      value.splice(index, 1)
      this.props.onChange(value)
    }
  }
}
