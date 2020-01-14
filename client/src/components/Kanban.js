import { Settings } from "api"
import LinkTo from "components/LinkTo"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { Button, Glyphicon, Panel } from "react-bootstrap"
import Pie from "components/graphs/Pie"
import { EngagementTrends } from "components/Trends"

export default class Kanban extends React.Component {
  static propTypes = {
    tasks: PropTypes.array.isRequired,
    columns: PropTypes.array.isRequired
  }

  render() {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row"
        }}
      >
        {this.props.columns.map(column => {
          return (
            <Column
              name={column.name}
              taskUUIDs={column.tasks}
              key={column.name}
              tasks={this.props.tasks}
            />
          )
        })}
      </div>
    )
  }
}

class Column extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    tasks: PropTypes.array.isRequired,
    taskUUIDs: PropTypes.array.isRequired
  }

  constructor(props, context) {
    super(props, context)

    this.state = { open: false }
  }

  render() {
    const { open } = this.state
    const tasks = this.props.tasks.filter(
      task => this.props.taskUUIDs.indexOf(task.uuid) > -1
    )
    const counters = tasks.reduce((counter, task) => {
      counter[task.customFieldEnum1] = ++counter[task.customFieldEnum1] || 1
      return counter
    }, {})

    return (
      <Panel style={{ flex: "1 1 0%", margin: "4px" }}>
        <Panel.Heading>
          <strong>
            <em>{this.props.name} </em>
          </strong>
        </Panel.Heading>
        <Panel.Body>
          <Pie
            size={{ width: 70, height: 70 }}
            data={counters}
            label={`${tasks.length}`}
            segmentFill={entity => {
              const matching = Object.entries(
                Settings.fields.task.customFieldEnum1.enum
              ).filter(candidate => {
                return candidate[0] === entity.data.key
              })
              return matching.length > 0 ? matching[0][1].color : "#bbbbbb"
            }}
            segmentLabel={d => d.data.value}
          />
          <br />
          <EngagementTrends
            newValue={tasks.reduce(
              (accumulator, task) => accumulator + task.lastMonthReports.length,
              0
            )}
            oldValue={tasks.reduce(
              (accumulator, task) =>
                accumulator + task.preLastMonthReports.length,
              0
            )}
            totalValue={tasks.reduce(
              (accumulator, task) => accumulator + task.allReports.length,
              0
            )}
          />
          <br />
          <br />
          <strong>{Settings.fields.task.longLabel}</strong>
          {"  "}
          <Button bsSize="xs" onClick={() => this.setState({ open: !open })}>
            <Glyphicon glyph={open ? "triangle-top" : "triangle-bottom"} />
          </Button>
          <br />
          {this.state.open &&
            tasks.map(task => <Card task={task} key={task.uuid} />)}
        </Panel.Body>
      </Panel>
    )
  }
}

class Card extends React.Component {
  static propTypes = {
    task: PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)

    this.state = { open: false }
  }

  render() {
    const { open } = this.state
    const { customFieldEnum1 } = this.props.task
    const enumSettings = Settings.fields.task.customFieldEnum1.enum
    return (
      <Panel
        onClick={() => this.setState({ open: !open })}
        style={{
          backgroundColor:
            customFieldEnum1 && // TODO: use optional chaining
            enumSettings[customFieldEnum1] &&
            (enumSettings[customFieldEnum1].color || "#f9f7f7"),
          margin: "3px"
        }}
      >
        <div>
          <LinkTo task={this.props.task}>
            <strong>{this.props.task.shortName}</strong>
          </LinkTo>
          <br />
          <EngagementTrends
            newValue={this.props.task.lastMonthReports.length}
            oldValue={this.props.task.preLastMonthReports.length}
            totalValue={this.props.task.allReports.length}
          />
          <br />
          {/* TODO make a single line when collapsed <div style={this.state.open ? {} : {textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}}> */}
          <div>
            <small>
              {this.state.open || this.props.task.longName.length < 100
                ? this.props.task.longName
                : this.props.task.longName.substring(0, 100) + "..."}
            </small>
          </div>
        </div>

        {this.state.open && (
          <Panel.Body>
            <small>
              <table cellPadding="4">
                <tbody>
                  <tr>
                    <td>created at:</td>
                    <td>
                      {" "}
                      {moment(this.props.task.createdAt).format(
                        Settings.dateFormats.forms.withTime
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>updated at:</td>
                    <td>
                      {" "}
                      {moment(this.props.task.updatedAt).format(
                        Settings.dateFormats.forms.withTime
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>responsible org:</td>
                    <td>
                      {" "}
                      {this.props.task.taskedOrganizations.map(org => (
                        <LinkTo
                          organization={org}
                          isLink={false}
                          key={`${org.uuid}`}
                        />
                      ))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </small>
          </Panel.Body>
        )}
      </Panel>
    )
  }
}
