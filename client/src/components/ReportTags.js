import "components/reactTags.css"
import _clone from "lodash/clone"
import PropTypes from "prop-types"
import React from "react"
import { WithContext as ReactTags } from "react-tag-input"

const ReportTags = ({ value, suggestions, onChange }) => {
  return (
    <ReactTags
      tags={value}
      suggestions={suggestions}
      classNames={{
        tag: "reportTag label label-info",
        remove: "reportTagRemove label-info"
      }}
      minQueryLength={1}
      autocomplete={1}
      autofocus={false}
      handleFilterSuggestions={handleTagSuggestions}
      handleDelete={handleTagDelete}
      handleAddition={handleTagAddition}
    />
  )

  function handleTagDelete(i) {
    const tags = _clone(value)
    tags.splice(i, 1)
    if (onChange) {
      onChange(tags)
    }
  }

  function handleTagAddition(tag) {
    const newTag = suggestions.find(t => t.id === tag.id)
    if (newTag) {
      const tags = _clone(value)
      tags.push(newTag)
      if (onChange) {
        onChange(tags)
      }
    }
  }

  function handleTagSuggestions(query, suggestions) {
    const text = (query && typeof query === "object"
      ? query.text
      : query
    ).toLowerCase()
    const tags = value
    return suggestions.filter(
      item =>
        item.text.toLowerCase().includes(text) &&
        !tags.some(tag => tag.id === item.id)
    )
  }
}
ReportTags.propTypes = {
  value: PropTypes.array,
  suggestions: PropTypes.array,
  onChange: PropTypes.func
}

export default ReportTags
