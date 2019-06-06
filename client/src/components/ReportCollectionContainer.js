import PropTypes from "prop-types"
import React, { Component } from "react"
import ReportCollection, {
  GQL_REPORT_FIELDS,
  GQL_BASIC_REPORT_FIELDS
} from "components/ReportCollection"

import API from "api"

export const FORMAT_CALENDAR = "calendar"
export const FORMAT_SUMMARY = "summary"
export const FORMAT_TABLE = "table"
export const FORMAT_MAP = "map"

export default class ReportCollectionContainer extends Component {
  static propTypes = {
    queryParams: PropTypes.object,
    mapId: PropTypes.string
  }

  state = {
    pageNum: 0,
    curPageReports: null,
    allReports: null
  }

  componentDidMount() {
    this.fetchReportData(true)
  }

  componentDidUpdate(prevProps, prevState) {
    // Re-load all data if queryParams has changed
    if (this.props.queryParams !== prevProps.queryParams) {
      this.fetchReportData(true)
    }
  }

  reportsQueryParams = withPagination => {
    const reportsQueryParams = {}
    Object.assign(reportsQueryParams, this.props.queryParams)
    Object.assign(reportsQueryParams, {
      pageNum: withPagination ? this.state.pageNum : 0,
      pageSize: withPagination ? 10 : 0
    })
    return reportsQueryParams
  }

  runReportsQuery = (reportsQueryParams, reportFields) => {
    return API.query(
      /* GraphQL */ `
      reportList(query:$reportsQueryParams) {
        pageNum, pageSize, totalCount, list {
          ${reportFields}
        }
      }`,
      { reportsQueryParams },
      "($reportsQueryParams: ReportSearchQueryInput)"
    )
  }

  fetchReportData(includeAll) {
    // Query used by the paginated views
    const queries = [
      this.runReportsQuery(this.reportsQueryParams(true), GQL_REPORT_FIELDS)
    ]
    if (includeAll) {
      // Query used by the map and calendar views
      queries.push(
        this.runReportsQuery(
          this.reportsQueryParams(false),
          GQL_BASIC_REPORT_FIELDS
        )
      )
    }
    return Promise.all(queries).then(values => {
      const stateUpdate = {
        curPageReports: values[0].reportList
      }
      if (includeAll) {
        Object.assign(stateUpdate, {
          allReports: values[1].reportList.list
        })
      }
      this.setState(stateUpdate)
    })
  }

  render() {
    const { curPageReports, allReports } = this.state
    const { queryParams, ...othersProps } = this.props
    return (
      (curPageReports !== null || allReports !== null) && (
        <ReportCollection
          paginatedReports={curPageReports}
          reports={allReports}
          goToPage={this.goToReportsPage}
          {...othersProps}
        />
      )
    )
  }

  goToReportsPage = newPageNum => {
    this.setState({ pageNum: newPageNum }, () => this.fetchReportData(false))
  }
}
