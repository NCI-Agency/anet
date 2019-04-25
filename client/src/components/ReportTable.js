import LinkTo from "components/LinkTo"
import { Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Table } from "react-bootstrap"

export default class ReportTable extends Component {
  static propTypes = {
    showAuthors: PropTypes.bool,
    showStatus: PropTypes.bool,
    reports: PropTypes.array.isRequired
  }

  render() {
    let { showAuthors, showStatus } = this.props
    let reports = Report.fromArray(this.props.reports)

    return (
      <Table striped>
        <thead>
          <tr>
            {showAuthors && <th>Author</th>}
            <th>Organization</th>
            <th>Summary</th>
            {showStatus && <th>Status</th>}
            <th>Engagement Date</th>
          </tr>
        </thead>

        <tbody>
          {reports.map(report => (
            <tr key={report.uuid}>
              {showAuthors && (
                <td>
                  <LinkTo person={report.author} />
                </td>
              )}
              <td>{<LinkTo organization={report.advisorOrg} />}</td>
              <td>
                {<LinkTo report={report} className="read-report-button" />}
              </td>
              {showStatus && <td>{report.state}</td>}
              <td>
                {moment(report.engagementDate).format(
                  Report.getEngagementDateFormat()
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    )
  }
}
