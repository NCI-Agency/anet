import { Settings } from "api"
import Pie from "components/graphs/Pie"
import LinkTo from "components/LinkTo"
import { EngagementTrends } from "components/Trends"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Glyphicon, Panel } from "react-bootstrap"

const Kanban = ({ columns, allTasks }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "row"
    }}
  >
    {columns.map(column => {
      const name =
        column.name || allTasks.find(task => task.uuid === column)?.shortName
      const tasks =
        (column.tasks &&
          allTasks.filter(task => column.tasks.includes(task.uuid))) ||
        allTasks.filter(task => task.customFieldRef1?.uuid === column)

      return <Column name={name} tasks={tasks} key={name} />
    })}
  </div>
)

Kanban.propTypes = {
  allTasks: PropTypes.array.isRequired,
  // a column is either a UUID of a task with children or a {name, tasks[]} object
  columns: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        tasks: PropTypes.arrayOf(PropTypes.string).isRequired
      })
    ])
  ).isRequired
}

const Column = ({ name, tasks }) => {
  const [open, setOpen] = useState(false)
  const counters = tasks.reduce((counter, task) => {
    counter[task.customFieldEnum1] = ++counter[task.customFieldEnum1] || 1
    return counter
  }, {})

  return (
    <Panel style={{ flex: "1 1 0%", margin: "4px" }}>
      <Panel.Heading>
        <strong>
          <em>{name} </em>
        </strong>
      </Panel.Heading>
      <Panel.Body>
        <Pie
          width={70}
          height={70}
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
        <Button bsSize="xs" onClick={() => setOpen(!open)}>
          <Glyphicon glyph={open ? "triangle-top" : "triangle-bottom"} />
        </Button>
        <br />
        {open && tasks.map(task => <Card task={task} key={task.uuid} />)}
      </Panel.Body>
    </Panel>
  )
}

Column.propTypes = {
  name: PropTypes.string.isRequired,
  tasks: PropTypes.array.isRequired
}

const Card = ({ task }) => {
  const [open, setOpen] = useState(false)
  const { customFieldEnum1 } = task
  const enumSettings = Settings.fields.task.customFieldEnum1.enum
  return (
    <Panel
      onClick={() => setOpen(!open)}
      style={{
        backgroundColor:
          customFieldEnum1 &&
          (enumSettings[customFieldEnum1]?.color || "#f9f7f7"),
        margin: "3px"
      }}
    >
      <div>
        <LinkTo modelType="Task" model={task}>
          <strong>{task.shortName}</strong>
        </LinkTo>
        <br />
        <EngagementTrends
          newValue={task.lastMonthReports.length}
          oldValue={task.preLastMonthReports.length}
          totalValue={task.allReports.length}
        />
        <br />
        {/* TODO make a single line when collapsed <div style={this.state.open ? {} : {textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}}> */}
        {task.longName && (
          <div>
            <small>
              {open || task.longName.length < 100
                ? task.longName
                : task.longName.substring(0, 100) + "..."}
            </small>
          </div>
        )}
      </div>

      {open && (
        <Panel.Body>
          <small>
            <table cellPadding="4">
              <tbody>
                <tr>
                  <td>created at:</td>
                  <td>
                    {" "}
                    {moment(task.createdAt).format(
                      Settings.dateFormats.forms.withTime
                    )}
                  </td>
                </tr>
                <tr>
                  <td>updated at:</td>
                  <td>
                    {" "}
                    {moment(task.updatedAt).format(
                      Settings.dateFormats.forms.withTime
                    )}
                  </td>
                </tr>
                <tr>
                  <td>tasked organizations:</td>
                  <td>
                    {" "}
                    {this.props.task.taskedOrganizations.map(org => (
                      <LinkTo
                        modelType="Organization"
                        model={org}
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

Card.propTypes = {
  task: PropTypes.object.isRequired
}

export default Kanban
