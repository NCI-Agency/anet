import { SEARCH_OBJECT_TYPES } from "actions"
import API from "api"
import autobind from "autobind-decorator"
import ReportCollection from "components/ReportCollection"
import PropTypes from "prop-types"
import React, { Component } from "react"

export default class SavedSearchTable extends Component {
  static propTypes = {
    search: PropTypes.any.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      reports: []
    }
  }

  componentDidMount() {
    if (this.props.search) {
      this.runSearch(this.props.search)
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.search && prevProps.search.uuid !== this.props.search.uuid) {
      this.runSearch(this.props.search)
    }
  }

  @autobind
  runSearch(search) {
    const objType =
      SEARCH_OBJECT_TYPES[search.objectType] || SEARCH_OBJECT_TYPES.REPORTS
    if (objType !== SEARCH_OBJECT_TYPES.REPORTS) {
      // This table only shows reports
      this.setState({ reports: { list: [] } })
    } else {
      let query = JSON.parse(search.query)
      // Add default sorting (if not specified/saved in the query); see SEARCH_CONFIG in pages/Search.js
      query.sortBy = query.sortBy || "ENGAGEMENT_DATE"
      query.sortOrder = query.sortOrder || "DESC"
      query.pageNum = query.pageNum || 0
      query.pageSize = query.pageSize || 10
      let fields = ReportCollection.GQL_REPORT_FIELDS
      API.query(
        /* GraphQL */ `
          reports: reportList(query: $query) {
            pageNum
            pageSize
            totalCount
            list {
              ${fields}
            }
          }
      `,
        { query },
        "($query: ReportSearchQueryInput)"
      ).then(data => this.setState({ reports: data.reports }))
    }
  }

  render() {
    return this.state.reports.list ? (
      <ReportCollection reports={this.state.reports.list} />
    ) : null
  }
}
