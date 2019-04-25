import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  SEARCH_OBJECT_TYPES
} from "actions"
import { Settings } from "api"
import autobind from "autobind-decorator"
import LinkTo from "components/LinkTo"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import GQL from "graphqlapi"
import { Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { Panel, Table } from "react-bootstrap"
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"
import { deserializeQueryParams } from "searchUtils"

const _SEARCH_PROPS = Object.assign({}, DEFAULT_SEARCH_PROPS, {
  onSearchGoToSearchPage: false,
  searchObjectTypes: [SEARCH_OBJECT_TYPES.REPORTS]
})

class DecisivesDashboard extends Page {
  static propTypes = { ...pagePropTypes }

  constructor(props) {
    super(props, DEFAULT_PAGE_PROPS, _SEARCH_PROPS)
  }

  componentDidMount() {
    this.setState({ isLoading: true })
    super.componentDidMount()
    deserializeQueryParams(
      SEARCH_OBJECT_TYPES.REPORTS,
      {
        state: [Report.STATE.PUBLISHED],
        engagementDateStart: moment()
          .subtract(8, "d")
          .endOf("day")
          .valueOf(),
        engagementDateEnd: moment()
          .subtract(1, "d")
          .endOf("day")
          .valueOf()
      },
      this.deserializeCallback
    )
    this.fetchStaticData()
  }

  @autobind
  deserializeCallback(objectType, filters, text) {
    // We update the Redux state
    this.props.setSearchQuery({
      objectType: objectType,
      filters: filters,
      text: text
    })
  }

  fetchData(props) {
    const searchQuery = this.getSearchQuery()
    const searchPreviousQuery = {
      ...searchQuery,
      engagementDateEnd: searchQuery.engagementDateStart,
      engagementDateStart:
        2 * searchQuery.engagementDateStart - searchQuery.engagementDateEnd
    }

    const reportsPart = new GQL.Part(/* GraphQL */ `
      currentList: reportList(query: $reportQuery) {
        list {
          uuid
          location { uuid }
          attendees {
            position { uuid }
          }
        }
      }
      previousList: reportList(query: $reportPreviousQuery) {
        list {
          uuid
          location { uuid }
          attendees {
            position { uuid }
          }
        }
      }`)
      .addVariable("reportQuery", "ReportSearchQueryInput", {
        pageNum: 0,
        pageSize: 0,
        ...searchQuery
      })
      .addVariable("reportPreviousQuery", "ReportSearchQueryInput", {
        pageNum: 0,
        pageSize: 0,
        ...searchPreviousQuery
      })
    GQL.run([reportsPart]).then(data => {
      const reports = data.currentList.list
      const reportStats = reports.reduce(
        (counter, report) => {
          counter.locationStats[report.location.uuid] =
            ++counter.locationStats[report.location.uuid] || 1
          report.attendees.reduce((counterNested, attendee) => {
            if (attendee.position) {
              counterNested.positionStats[attendee.position.uuid] =
                ++counterNested.positionStats[attendee.position.uuid] || 1
            }
            return counterNested
          }, counter)
          return counter
        },
        { locationStats: {}, positionStats: {} }
      )

      const prevReportStats = data.previousList.list.reduce(
        (counter, report) => {
          counter.locationStats[report.location.uuid] =
            ++counter.locationStats[report.location.uuid] || 1
          report.attendees.reduce((counterNested, attendee) => {
            if (attendee.position) {
              counterNested.positionStats[attendee.position.uuid] =
                ++counterNested.positionStats[attendee.position.uuid] || 1
            }
            return counterNested
          }, counter)
          return counter
        },
        { locationStats: {}, positionStats: {} }
      )

      this.setState({
        reports: reports,
        locationStats: reportStats.locationStats,
        positionStats: reportStats.positionStats,
        prevLocationStats: prevReportStats.locationStats,
        prevPositionStats: prevReportStats.positionStats,
        isLoading: !this.state.decisives
      })
    })
  }

  fetchStaticData() {
    // TODO: replace this with a way ask graphql for the content of a set of UUIDs
    const dataPart = new GQL.Part(/* GraphQL */ `
      positionList(query: $positionQuery) {
        list {
          uuid, name
        }
      }
      locationList(query: $locationQuery) {
        list {
          uuid, name
        }
      }
      taskList(query: $taskQuery) {
        list {
          uuid, shortName
        }
      }
      
      `)
      .addVariable("positionQuery", "PositionSearchQueryInput", {
        // TODO: make this work with AbstractSearchQueryInput
        pageNum: 0,
        pageSize: 0,
        status: "ACTIVE"
      })
      .addVariable("locationQuery", "LocationSearchQueryInput", {
        pageNum: 0,
        pageSize: 0,
        status: "ACTIVE"
      })
      .addVariable("taskQuery", "TaskSearchQueryInput", {
        pageNum: 0,
        pageSize: 0,
        status: "ACTIVE"
      })

    GQL.run([dataPart]).then(data => {
      this.setState({
        decisives:
          Settings.decisives &&
          Settings.decisives.map(decisive => {
            return {
              label: decisive.label,
              positions: data.positionList.list.filter(item =>
                decisive.positions.includes(item.uuid)
              ),
              tasks: data.taskList.list.filter(item =>
                decisive.locations.includes(item.uuid)
              ),
              locations: data.locationList.list.filter(item =>
                decisive.locations.includes(item.uuid)
              )
            }
          }),
        isLoading: !this.state.reports
      })
    })
  }

  render() {
    if (!this.state.decisives || !this.state.reports) return null
    return (
      <>
        <Panel>
          <Panel.Heading>
            <Panel.Title componentClass="h3">People</Panel.Title>
          </Panel.Heading>
          <Panel.Body>
            {this.state.decisives.map(decisive => (
              <StatsTable
                label={decisive.label}
                key={decisive.label}
                data={decisive.positions}
                contentData={this.state.positionStats}
                prevContentData={this.state.prevPositionStats}
                itemLabel={item => <LinkTo position={item}>{item.name}</LinkTo>}
              />
            ))}
          </Panel.Body>
        </Panel>
        <Panel>
          <Panel.Heading>
            <Panel.Title componentClass="h3">Places</Panel.Title>
          </Panel.Heading>
          <Panel.Body>
            {this.state.decisives.map(decisive => (
              <StatsTable
                label={decisive.label}
                key={decisive.label}
                data={decisive.locations}
                contentData={this.state.locationStats}
                prevContentData={this.state.prevLocationStats}
                itemLabel={item => (
                  <LinkTo anetLocation={item}>{item.name}</LinkTo>
                )}
              />
            ))}
          </Panel.Body>
        </Panel>
        <Panel>
          <Panel.Heading>
            <Panel.Title componentClass="h3">Processes</Panel.Title>
          </Panel.Heading>
          <Panel.Body>{/* <StatsTable data={[]} /> */}</Panel.Body>
        </Panel>
      </>
    )
  }
}

class StatsTable extends React.Component {
  static propTypes = {
    data: PropTypes.array.isRequired,
    itemLabel: PropTypes.func.isRequired,
    label: PropTypes.string.isRequired,
    contentData: PropTypes.object.isRequired,
    prevContentData: PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)

    this.state = { open: false }
  }

  render() {
    return (
      <Table responsive>
        <thead>
          <tr>
            <th>{this.props.label}</th>
            {this.props.data.map(item => (
              <th key={item.uuid}>{this.props.itemLabel(item)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td />
            {this.props.data.map(item => {
              const previous = this.props.prevContentData[item.uuid] || 0
              const current = this.props.contentData[item.uuid] || 0
              const color =
                current > 1.3 * previous
                  ? "green"
                  : current < 0.7 * previous
                    ? "red"
                    : "white"
              return (
                <td bgcolor={color} key={item.uuid}>
                  {current}/{previous}
                </td>
              )
            })}
          </tr>
        </tbody>
      </Table>
    )
  }
}

const mapStateToProps = (state, ownProps) => ({
  searchQuery: state.searchQuery
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(DecisivesDashboard))
