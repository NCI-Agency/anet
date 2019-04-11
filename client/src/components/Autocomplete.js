import API from "api"
import autobind from "autobind-decorator"
import _debounce from "lodash/debounce"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import PropTypes from "prop-types"
import React, { Component } from "react"
import Autosuggest from "react-autosuggest-ie11-compatible"
import { FormControl } from "react-bootstrap"
import SEARCH_ICON from "resources/search.png"
import "./Autocomplete.css"

export default class Autocomplete extends Component {
  static propTypes = {
    value: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.string,
      PropTypes.array // MultiSelectAutocomplete
    ]),

    // The property of the selected object to display.
    valueKey: PropTypes.string,

    // Optional: A function to render each item in the list of suggestions.
    template: PropTypes.func,

    // Optional: Parameters to pass to search function.
    queryParams: PropTypes.object,

    // Optional: ANET Object Type (Person, Report, etc) to search for.
    objectType: PropTypes.func,

    // GraphQL string of fields to return from search.
    fields: PropTypes.string,

    // Function to call when a selection is made.
    onChange: PropTypes.func,

    // If this Autocomplete should clear the text area after a valid selection.
    // This is being used when the autocomplete is used for adding a value to an
    // array. After the selection was made, the autocomplete is being cleared
    // in order to make it possible to make a new selection.
    clearOnSelect: PropTypes.bool,

    // Array of values to exclude from the list of suggestions when searching
    excludeValues: PropTypes.array
  }

  constructor(props) {
    super(props)

    this.fetchSuggestionsDebounced = _debounce(this.fetchSuggestions, 200)
    this.noSuggestions = <i>No suggestions found</i>

    const stringValue = this.getStringValue(props.value, props.valueKey)
    this.state = {
      suggestions: [],
      stringValue: stringValue,
      originalStringValue: stringValue
    }
    this.latestRequest = null
  }

  componentDidUpdate(prevProps, prevState) {
    // Ensure that we update the stringValue if we get an updated value
    if (!_isEqual(prevProps.value, this.props.value)) {
      const stringValue = this.getStringValue(
        this.props.value,
        this.props.valueKey
      )
      this.setState({
        stringValue: stringValue,
        originalStringValue: stringValue
      })
    }
  }

  render() {
    let inputProps = Object.without(
      this.props,
      "clearOnSelect",
      "valueKey",
      "template",
      "queryParams",
      "objectType",
      "fields",
      "excludeValues"
    )
    inputProps.value = this.state.stringValue
    inputProps.onChange = this.onInputChange
    inputProps.onBlur = this.onInputBlur
    const renderSuggestion = this.props.template
      ? this.renderSuggestionTemplate
      : this.renderSuggestion

    return (
      <div style={{ position: "relative" }} ref={el => (this.container = el)}>
        <img
          src={SEARCH_ICON}
          className="form-control-icon"
          alt=""
          onClick={this.focus}
        />

        <Autosuggest
          suggestions={this.state.suggestions}
          onSuggestionsFetchRequested={this.fetchSuggestionsDebounced}
          onSuggestionsClearRequested={this.clearSuggestions}
          onSuggestionSelected={this.onSuggestionSelected}
          getSuggestionValue={() =>
            this.getStringValue(this.props.value, this.props.valueKey)
          }
          inputProps={inputProps}
          renderInputComponent={this.renderInputComponent}
          renderSuggestion={renderSuggestion}
          focusInputOnSuggestionClick={false}
        />
      </div>
    )
  }

  @autobind
  renderSuggestion(suggestion) {
    return (
      <span>
        {_isEmpty(suggestion)
          ? this.noSuggestions
          : this.getStringValue(suggestion, this.props.valueKey)}
      </span>
    )
  }

  @autobind
  renderSuggestionTemplate(suggestion) {
    return _isEmpty(suggestion)
      ? this.noSuggestions
      : this.props.template(suggestion)
  }

  @autobind
  renderInputComponent(inputProps) {
    return <FormControl {...inputProps} />
  }

  @autobind
  getStringValue(suggestion, valueKey) {
    if (this.props.clearOnSelect) {
      return ""
    }
    if (typeof suggestion === "object") {
      return suggestion[valueKey] || ""
    }
    return suggestion || ""
  }

  @autobind
  _getExcludedUuids() {
    const { excludeValues } = this.props
    if (Array.isArray(excludeValues)) {
      return excludeValues.map(object => object.uuid)
    }
    return []
  }

  @autobind
  _setSuggestions(list) {
    const excludedUuids = this._getExcludedUuids()
    if (excludedUuids) {
      list = list.filter(
        suggestion =>
          suggestion &&
          suggestion.uuid &&
          excludedUuids.indexOf(suggestion.uuid) === -1
      )
    }
    if (!list.length) {
      list = [{}] // use an empty object so we render the 'noSuggestions' text
    }
    this.setState({ suggestions: list })
  }

  @autobind
  fetchSuggestions(value) {
    let resourceName = this.props.objectType.resourceName
    let listName = this.props.objectType.listName
    let graphQlQuery =
      listName +
      " (query: $query) { " +
      "list { " +
      this.props.fields +
      "}" +
      "}"
    let variableDef = "($query: " + resourceName + "SearchQueryInput)"
    let queryVars = { text: value.value + "*", pageNum: 0, pageSize: 25 }
    if (this.props.queryParams) {
      Object.assign(queryVars, this.props.queryParams)
    }
    const thisRequest = (this.latestRequest = API.query(
      graphQlQuery,
      { query: queryVars },
      variableDef
    ).then(data => {
      // If this is true there's a newer request happening, stop everything
      if (thisRequest !== this.latestRequest) {
        return
      }
      this._setSuggestions(data[listName].list)
    }))
  }

  @autobind
  clearSuggestions() {
    this.setState({ suggestions: [] })
  }

  @autobind
  onSuggestionSelected(event, { suggestion, suggestionValue }) {
    event.stopPropagation()
    event.preventDefault()

    let stringValue = this.props.clearOnSelect ? "" : suggestionValue
    this.currentSelected = suggestion
    this.setState({ stringValue: stringValue })
    if (this.props.onChange) {
      this.props.onChange(suggestion)
    }
  }

  @autobind
  onInputChange(event) {
    if (!event.target.value) {
      if (!this.props.clearOnSelect) {
        // If the component had a value, and the user just cleared the input
        // then set the selection to an empty object. We need to do this because we need to
        // tell the server that value was cleared, rather than that there was no change.
        // This is so the server sees that the value is not-null, but that uuid is NULL.
        // Which tells the server specifically that the uuid should be set to NULL on the foreignKey
        this.onSuggestionSelected(event, {
          suggestion: {},
          suggestionValue: ""
        })
      }
    }

    // The user is typing!
    this.currentSelected = null
    this.setState({ stringValue: event.target.value })
    event.stopPropagation()
  }

  @autobind
  onInputBlur(event) {
    if (this.currentSelected) {
      return
    }
    let val = this.state.stringValue
    if (val) {
      // If the value is the original string value that was passed in, the user
      // probably tabbed past the field, so we should do nothing.
      if (val === this.state.originalStringValue) {
        return
      }
      // If the user clicks off this Autocomplete with a value left in the input
      // field we call the onChange and further it is the responsibility of the
      // form field validation to decide on what to do.
      this.setState({ stringValue: val })
      if (this.props.onChange) {
        this.props.onChange(val) // make sure field validation is called
      }
    }
    if (this.props.onBlur) {
      this.props.onBlur(event) // make sure the field is being marked as touched
    }
  }

  @autobind
  focus() {
    if (!this.container) {
      return
    }
    this.container.querySelector("input").focus()
  }
}
