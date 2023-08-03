import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import Pie from "components/graphs/Pie"
import LinkTo from "components/LinkTo"
import { EngagementTrends } from "components/Trends"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Card } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

const Kanban = ({ columns, allTasks }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "row",
      overflowX: "auto"
    }}
  >
    {columns.map(column => {
      const name =
        column.name ||
        allTasks.find(task => task.uuid === column)?.shortName ||
        column
      const tasks =
        (column.tasks &&
          allTasks.filter(task => column.tasks.includes(task.uuid))) ||
        allTasks.filter(task => task.parentTask?.uuid === column)

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
  const enumSettings =
    Settings.fields.task.customFields?.projectStatus?.choices || {}
  const counters = tasks.reduce((counter, task) => {
    const { projectStatus } = utils.parseJsonSafe(task.customFields)
    counter[projectStatus] = ++counter[projectStatus] || 1
    return counter
  }, {})

  return (
    <Card style={{ flex: "1 1 0%", margin: "4px" }}>
      <Card.Header>
        <strong>
          <em>{name}</em>
        </strong>
      </Card.Header>
      <Card.Body>
        <Pie
          width={70}
          height={70}
          data={counters}
          label={`${tasks.length}`}
          segmentFill={entity => {
            const matching = Object.entries(enumSettings).filter(
              ([key, val]) => {
                return key === entity.data.key
              }
            )
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
        <Button
          size="xs"
          onClick={() => setOpen(!open)}
          variant="outline-secondary"
        >
          <Icon
            icon={
              open
                ? IconNames.SYMBOL_TRIANGLE_UP
                : IconNames.SYMBOL_TRIANGLE_DOWN
            }
          />
        </Button>
        <br />
        {open && tasks.map(task => <CardView task={task} key={task.uuid} />)}
      </Card.Body>
    </Card>
  )
}

Column.propTypes = {
  name: PropTypes.string.isRequired,
  tasks: PropTypes.array.isRequired
}

const CardView = ({ task }) => {
  const [open, setOpen] = useState(false)
  const { projectStatus } = utils.parseJsonSafe(task.customFields)
  const enumSettings =
    Settings.fields.task.customFields?.projectStatus?.choices || {}
  return (
    <Card
      onClick={() => setOpen(!open)}
      style={{
        backgroundColor:
          projectStatus && (enumSettings[projectStatus]?.color || "#f9f7f7"),
        margin: "3px"
      }}
    >
      <div>
        <BreadcrumbTrail
          modelType="Task"
          leaf={task}
          ascendantObjects={task.ascendantTasks}
          parentField="parentTask"
        />
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
              {open ? task.longName : utils.ellipsize(task.longName, 100)}
            </small>
          </div>
        )}
      </div>

      {open && (
        <Card.Body>
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
                    {task.taskedOrganizations.map(org => (
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
        </Card.Body>
      )}
    </Card>
  )
}

CardView.propTypes = {
  task: PropTypes.object.isRequired
}

export default Kanban
