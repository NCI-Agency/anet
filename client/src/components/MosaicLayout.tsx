import { Classes, Icon, IconSize } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
// needed for the mosaic tile buttons (expand, close):
import "@blueprintjs/icons/lib/css/blueprint-icons.css"
import classNames from "classnames"
import _cloneDeep from "lodash/cloneDeep"
import _dropRight from "lodash/dropRight"
import React, { useState } from "react"
import { Button } from "react-bootstrap"
import {
  Corner,
  createBalancedTreeFromLeaves,
  getLeaves,
  getNodeAtPath,
  getOtherDirection,
  getPathToCorner,
  Mosaic,
  MosaicNode,
  MosaicWindow,
  updateTree
} from "react-mosaic-component"
import "react-mosaic-component/react-mosaic-component.css"
import "./MosaicLayout.css"

interface MosaicLayoutProps {
  visualizations: {
    id: string
    icons: string[]
    title: string // icon names from @blueprintjs/icons IconNames
    renderer: (...args: unknown[]) => unknown
  }[]
  initialNode?: any | string
  description?: MosaicNode
  style?: any
}

const MosaicLayout = ({
  visualizations,
  initialNode,
  description,
  style
}: MosaicLayoutProps) => {
  const [currentNode, setCurrentNode] = useState(initialNode)
  return (
    <div className="mosaic-box" style={style}>
      <div className="mosaic-container">
        {renderNavBar()}
        <Mosaic
          blueprintNamespace="bp5"
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
          <Icon size={IconSize.LARGE} icon={IconNames.MENU} />
          <Button
            className={classNames(Classes.BUTTON)}
            onClick={autoArrange}
            variant="outline-secondary"
            title="Auto Arrange"
          >
            <Icon icon={IconNames.GRID_VIEW} />
          </Button>
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
          <Button
            key={viz.id}
            className={classNames(Classes.BUTTON)}
            onClick={() => addChart(viz.id)}
            variant="outline-secondary"
            title={viz.title}
          >
            {viz.icons.map((icon, i) => (
              <Icon key={i} icon={icon} />
            ))}
          </Button>
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

export default MosaicLayout
