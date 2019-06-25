import autobind from "autobind-decorator"
import "components/reactTags.css"
import _clone from "lodash/clone"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { WithContext as ReactTags } from "react-tag-input"

export default class ReportTags extends Component {
  static propTypes = {
    value: PropTypes.array,
    suggestions: PropTypes.array
  }

  render() {
    return (
      <ReactTags
        tags={this.props.value}
        suggestions={this.props.suggestions}
        classNames={{
          tag: "reportTag label label-info",
          remove: "reportTagRemove label-info"
        }}
        minQueryLength={1}
        autocomplete={1}
        autofocus={false}
        handleFilterSuggestions={this.handleTagSuggestions}
        handleDelete={this.handleTagDelete}
        handleAddition={this.handleTagAddition}
      />
    )
  }

  @autobind
  handleTagDelete(i) {
    let tags = _clone(this.props.value)
    tags.splice(i, 1)
    if (this.props.onChange) {
      this.props.onChange(tags)
    }
  }

  @autobind
  handleTagAddition(tag) {
    const newTag = this.props.suggestions.find(t => t.id === tag.id)
    if (newTag) {
      let tags = _clone(this.props.value)
      tags.push(newTag)
      if (this.props.onChange) {
        this.props.onChange(tags)
      }
    }
  }

  @autobind
  handleTagSuggestions(query, suggestions) {
    const text = (query && typeof query === "object"
      ? query.text
      : query
    ).toLowerCase()
    const tags = this.props.value
    return suggestions.filter(
      item =>
        item.text.toLowerCase().includes(text) &&
        !tags.some(tag => tag.id === item.id)
    )
  }
}
