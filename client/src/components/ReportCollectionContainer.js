import { setPagination } from "actions"
import API from "api"
import ReportCollection, {
  GQL_BASIC_REPORT_FIELDS,
  GQL_REPORT_FIELDS
} from "components/ReportCollection"
import _isEqualWith from "lodash/isEqualWith"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { connect } from "react-redux"
import utils from "utils"

export const FORMAT_CALENDAR = "calendar"
export const FORMAT_SUMMARY = "summary"
export const FORMAT_TABLE = "table"
export const FORMAT_MAP = "map"

class ReportCollectionContainer extends Component {
  static propTypes = {
    queryParams: PropTypes.object,
    calendarKey: PropTypes.string,
    mapKey: PropTypes.string,
    mapId: PropTypes.string,
    pagination: PropTypes.object,
    paginationKey: PropTypes.string,
    setPagination: PropTypes.func.isRequired
  }

  state = {
    curPageReports: null
  }

  get curPageNum() {
    const { pagination, paginationKey } = this.props
    return pagination[paginationKey] === undefined
      ? 0
      : pagination[paginationKey].pageNum
  }

  componentDidMount() {
    this.fetchReportData()
  }

  componentDidUpdate(prevProps, prevState) {
    // Re-load all data if queryParams has changed
    if (
      !_isEqualWith(
        this.props.queryParams,
        prevProps.queryParams,
        utils.treatFunctionsAsEqual
      )
    ) {
      this.fetchReportData()
    }
  }

  reportsQueryParams = (withPagination, pageNum) => {
    const reportsQueryParams = {}
    Object.assign(reportsQueryParams, this.props.queryParams)
    Object.assign(reportsQueryParams, {
      pageNum: withPagination
        ? pageNum === undefined
          ? this.curPageNum
          : pageNum
        : 0,
      pageSize: withPagination ? 10 : 0
    })
    return reportsQueryParams
  }

  getReportsQuery = (reportsQueryParams, reportFields) => {
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

  fetchReportData(pageNum) {
    // Query used by the paginated views
    const queries = [
      this.getReportsQuery(
        this.reportsQueryParams(true, pageNum),
        GQL_REPORT_FIELDS
      )
    ]
    return Promise.all(queries).then(values => {
      const stateUpdate = {
        curPageReports: values[0].reportList
      }
      this.setState(stateUpdate, () =>
        this.props.setPagination(
          this.props.paginationKey,
          this.state.curPageReports.pageNum
        )
      )
    })
  }

  getReportsQueryForMap = fetchInfo => {
    return this.getReportsQuery(
      {
        ...this.reportsQueryParams(false),
        boundingBox: {
          minLng: fetchInfo.minLng,
          minLat: fetchInfo.minLat,
          maxLng: fetchInfo.maxLng,
          maxLat: fetchInfo.maxLat
        }
      },
      GQL_BASIC_REPORT_FIELDS
    )
  }

  getReportsQueryForCalendar = fetchInfo => {
    return this.getReportsQuery(
      {
        ...this.reportsQueryParams(false),
        engagementDateStart: fetchInfo.start,
        engagementDateEnd: fetchInfo.end
      },
      GQL_BASIC_REPORT_FIELDS
    )
  }

  render() {
    const { curPageReports } = this.state
    const { queryParams, ...othersProps } = this.props
    return (
      curPageReports && (
        <ReportCollection
          paginatedReports={curPageReports}
          calendarKey={this.props.calendarKey}
          getReportsQueryForCalendar={this.getReportsQueryForCalendar}
          mapKey={this.props.mapKey}
          getReportsQueryForMap={this.getReportsQueryForMap}
          goToPage={this.goToReportsPage}
          {...othersProps}
        />
      )
    )
  }

  goToReportsPage = newPageNum => {
    this.fetchReportData(newPageNum)
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  setPagination: (paginationKey, pageNum) =>
    dispatch(setPagination(paginationKey, pageNum))
})

const mapStateToProps = (state, ownProps) => ({
  pagination: state.pagination
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReportCollectionContainer)
