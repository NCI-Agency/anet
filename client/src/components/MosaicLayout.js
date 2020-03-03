import { Classes, Icon } from "@blueprintjs/core"
import "@blueprintjs/core/lib/css/blueprint.css"
import { IconNames } from "@blueprintjs/icons"
import "@blueprintjs/icons/lib/css/blueprint-icons.css" // needed for the mosaic tile buttons (expand, close)
import classNames from "classnames"
import _cloneDeep from "lodash/cloneDeep"
import _dropRight from "lodash/dropRight"
import PropTypes from "prop-types"
import React, { useState } from "react"
import {
  Corner,
  createBalancedTreeFromLeaves,
  getLeaves,
  getNodeAtPath,
  getOtherDirection,
  getPathToCorner,
  Mosaic,
  MosaicWindow,
  updateTree
} from "react-mosaic-component"
import "react-mosaic-component/react-mosaic-component.css"
import "./MosaicLayout.css"

const MosaicLayout = ({ visualizations, initialNode, description, style }) => {
  const [currentNode, setCurrentNode] = useState(initialNode)
  return (
    <div className="mosaic-box" style={style}>
      <div className="mosaic-container">
        {renderNavBar()}
        <Mosaic
          value={currentNode}
          onChange={updateCurrentNode}
          renderTile={(id, path) => {
            const viz = visualizations.find(viz => viz.id === id)
            return (
              <MosaicWindow title={viz.title} path={path}>
                {viz.renderer(id)}
              </MosaicWindow>
            )
          }}
        />
      </div>
    </div>
  )

  function renderNavBar() {
    return (
      <div className={classNames(Classes.NAVBAR)}>
        <div className={classNames(Classes.NAVBAR_GROUP, Classes.BUTTON_GROUP)}>
          <Icon iconSize={Icon.SIZE_LARGE} icon={IconNames.MENU} />
          <button
            className={classNames(Classes.BUTTON)}
            onClick={autoArrange}
            title="Auto Arrange"
          >
            <Icon icon={IconNames.GRID_VIEW} />
          </button>
          {renderButtons()}
          {description && (
            <span className="chart-description">{description}</span>
          )}
        </div>
      </div>
    )
  }

  function renderButtons() {
    const buttons = []
    const leaves = getLeaves(currentNode)
    visualizations.forEach(viz => {
      if (!leaves.includes(viz.id)) {
        buttons.push(
          <button
            key={viz.id}
            className={classNames(Classes.BUTTON)}
            onClick={() => addChart(viz.id)}
            title={viz.title}
          >
            {viz.icons.map((icon, i) => (
              <Icon key={i} icon={icon} />
            ))}
          </button>
        )
      }
    })
    return buttons
  }

  function updateCurrentNode(newCurrentNode) {
    setCurrentNode(newCurrentNode)
  }

  function autoArrange() {
    const leaves = getLeaves(currentNode)
    updateCurrentNode(createBalancedTreeFromLeaves(leaves))
  }

  function addChart(viz) {
    let curNode = _cloneDeep(currentNode)
    if (!curNode) {
      curNode = viz
    } else {
      const path = getPathToCorner(curNode, Corner.TOP_RIGHT)
      const parent = getNodeAtPath(curNode, _dropRight(path))
      const destination = getNodeAtPath(curNode, path)
      const direction = parent ? getOtherDirection(parent.direction) : "row"
      let first
      let second
      if (direction === "row") {
        first = destination
        second = viz
      } else {
        first = viz
        second = destination
      }
      curNode = updateTree(curNode, [
        {
          path,
          spec: {
            $set: {
              direction,
              first,
              second
            }
          }
        }
      ])
    }
    updateCurrentNode(curNode)
  }
}
MosaicLayout.propTypes = {
  visualizations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icons: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired, // icon names from @blueprintjs/icons IconNames
      title: PropTypes.string.isRequired,
      renderer: PropTypes.func.isRequired
    })
  ).isRequired,
  initialNode: PropTypes.object, // FIXME: actually MosaicNode
  description: PropTypes.string,
  style: PropTypes.object
}

export default MosaicLayout
