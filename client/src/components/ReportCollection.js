import autobind from "autobind-decorator"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import Leaflet from "components/Leaflet"
import ReportSummary from "components/ReportSummary"
import ReportTable from "components/ReportTable"
import UltimatePagination from "components/UltimatePagination"
import _escape from "lodash/escape"
import _get from "lodash/get"
import { Location } from "models"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Button } from "react-bootstrap"

export const FORMAT_SUMMARY = "summary"
export const FORMAT_TABLE = "table"
export const FORMAT_MAP = "map"

export const GQL_REPORT_FIELDS = /* GraphQL */ `
  uuid, intent, engagementDate, duration, keyOutcomes, nextSteps, cancelledReason
  atmosphere, atmosphereDetails, state
  author { uuid, name, rank, role }
  primaryAdvisor { uuid, name, rank, role },
  primaryPrincipal { uuid, name, rank, role },
  advisorOrg { uuid, shortName },
  principalOrg { uuid, shortName },
  location { uuid, name, lat, lng },
  tasks { uuid, shortName },
  tags { uuid, name, description }
  workflow {
    type, createdAt
    step { uuid, name
      approvers { uuid, name, person { uuid, name, rank, role } }
    },
    person { uuid, name, rank, role }
  }
  updatedAt
`

export default class ReportCollection extends Component {
  static propTypes = {
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    marginBottom: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    reports: PropTypes.array,
    paginatedReports: PropTypes.shape({
      totalCount: PropTypes.number,
      pageNum: PropTypes.number,
      pageSize: PropTypes.number,
      list: PropTypes.array
    }),
    goToPage: PropTypes.func,
    mapId: PropTypes.string,
    viewFormats: PropTypes.arrayOf(PropTypes.string),
    isSuperUser: PropTypes.bool
  }

  static defaultProps = {
    viewFormats: [FORMAT_SUMMARY, FORMAT_TABLE, FORMAT_MAP]
  }

  constructor(props) {
    super(props)

    this.state = {
      viewFormat: this.props.viewFormats[0]
    }
  }

  render() {
    var reports

    if (this.props.paginatedReports) {
      var { pageSize, pageNum, totalCount } = this.props.paginatedReports
      var numPages = pageSize <= 0 ? 1 : Math.ceil(totalCount / pageSize)
      reports = this.props.paginatedReports.list
      pageNum++
    } else {
      reports = this.props.reports
    }

    let reportsExist = _get(reports, "length", 0) > 0
    const showHeader = this.props.viewFormats.length > 1 || numPages > 1

    return (
      <div className="report-collection">
        <div>
          {showHeader && (
            <header>
              {reportsExist && this.props.viewFormats.length > 1 && (
                <ButtonToggleGroup
                  value={this.state.viewFormat}
                  onChange={this.changeViewFormat}
                  className="hide-for-print"
                >
                  {this.props.viewFormats.includes(FORMAT_SUMMARY) && (
                    <Button value={FORMAT_SUMMARY}>Summary</Button>
                  )}
                  {this.props.viewFormats.includes(FORMAT_TABLE) && (
                    <Button value={FORMAT_TABLE}>Table</Button>
                  )}
                  {this.props.viewFormats.includes(FORMAT_MAP) && (
                    <Button value={FORMAT_MAP}>Map</Button>
                  )}
                </ButtonToggleGroup>
              )}

              {numPages > 1 && (
                <UltimatePagination
                  className="pull-right"
                  currentPage={pageNum}
                  totalPages={numPages}
                  boundaryPagesRange={1}
                  siblingPagesRange={2}
                  hideEllipsis={false}
                  hidePreviousAndNextPageLinks={false}
                  hideFirstAndLastPageLinks
                  onChange={value => this.props.goToPage(value - 1)}
                />
              )}

              {this.props.isSuperUser && (
                <div className="reports-filter">
                  Filter: {this.renderToggleFilterButton(this.props)}
                </div>
              )}
            </header>
          )}

          {reportsExist && (
            <div>
              {this.state.viewFormat === FORMAT_TABLE &&
                this.renderTable(reports)}
              {this.state.viewFormat === FORMAT_SUMMARY &&
                this.renderSummary(reports)}
              {this.state.viewFormat === FORMAT_MAP && this.renderMap(reports)}
            </div>
          )}

          {numPages > 1 && (
            <footer>
              <UltimatePagination
                className="pull-right"
                currentPage={pageNum}
                totalPages={numPages}
                boundaryPagesRange={1}
                siblingPagesRange={2}
                hideEllipsis={false}
                hidePreviousAndNextPageLinks={false}
                hideFirstAndLastPageLinks
                onChange={value => this.props.goToPage(value - 1)}
              />
            </footer>
          )}
        </div>
        {!reportsExist && <em>No reports found</em>}
      </div>
    )
  }

  renderToggleFilterButton(props) {
    let showAll = "Show all reports"
    let showPendingApproval = "Show pending approval"
    let buttonText = props.filterIsSet ? showAll : showPendingApproval
    let button = (
      <Button
        value="toggle-filter"
        className="btn btn-sm"
        onClick={props.setReportsFilter}
      >
        {buttonText}
      </Button>
    )
    return button
  }

  renderTable(reports) {
    return <ReportTable showAuthors reports={reports} />
  }

  renderSummary(reports) {
    return (
      <div>
        {reports.map(report => (
          <ReportSummary report={report} key={report.uuid} />
        ))}
      </div>
    )
  }

  renderMap(reports) {
    let markers = []
    reports.forEach(report => {
      if (Location.hasCoordinates(report.location)) {
        let label = _escape(report.intent || "<undefined>") // escape HTML in intent!
        label += `<br/>@ <b>${_escape(report.location.name)}</b>` // escape HTML in locationName!
        markers.push({
          id: report.uuid,
          lat: report.location.lat,
          lng: report.location.lng,
          name: label
        })
      }
    })
    return (
      <Leaflet
        markers={markers}
        mapId={this.props.mapId}
        width={this.props.width}
        height={this.props.height}
        marginBottom={this.props.marginBottom}
      />
    )
  }

  @autobind
  changeViewFormat(value) {
    this.setState({ viewFormat: value })
  }
}

ReportCollection.GQL_REPORT_FIELDS = GQL_REPORT_FIELDS
