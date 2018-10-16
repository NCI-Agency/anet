import React, {Component} from 'react'
import PropTypes from 'prop-types'
import autobind from 'autobind-decorator'

import ContainerDimensions from 'react-container-dimensions'
import { createBalancedTreeFromLeaves, getLeaves, getNodeAtPath, getOtherDirection, getPathToCorner, updateTree,
	Corner, Mosaic, MosaicWindow } from 'react-mosaic-component'
import { Classes } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import classNames from 'classnames'
import _dropRight from 'lodash/dropRight'
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import 'react-mosaic-component/react-mosaic-component.css'
import './MosaicLayout.css'

export default class MosaicLayout extends Component {
  static propTypes = {
    visualizations: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        renderer: PropTypes.func.isRequired,
      })
    ).isRequired,
    initialNode: PropTypes.object, // FIXME: actually MosaicNode
    description: PropTypes.string,
  }

  constructor(props) {
    super(props)
    this.state = {
      currentNode: this.props.initialNode,
    }
  }

  render() {
    return <div>
      {this.props.description &&
        <p className="chart-description">{this.props.description}</p>
      }
      {this.renderNavBar()}
      <div id="mosaic-container">
      <Mosaic
        value={this.state.currentNode}
        onChange={this.updateCurrentNode}
        renderTile={(id, path) => {
          const viz = this.props.visualizations.find(viz => viz.id === id)
          return <MosaicWindow
            title={viz.title}
            path={path}>
            {viz.renderer(id)}
          </MosaicWindow>
        }}
      />
      </div>
    </div>
  }

  @autobind
  renderNavBar() {
    return (
      <div className={classNames(Classes.NAVBAR)}>
        <div className={classNames(Classes.NAVBAR_GROUP, Classes.BUTTON_GROUP)}>
          <span className="actions-label">Actions:</span>
          <button
            className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.GRID_VIEW))}
            onClick={this.autoArrange}
          >
            Auto Arrange
          </button>
          {this.renderButtons()}
        </div>
      </div>
    )
  }

  renderButtons() {
    const buttons = []
    const leaves = getLeaves(this.state.currentNode)
    this.props.visualizations.forEach(viz => {
      if (!leaves.includes(viz.id)) {
        buttons.push(
          <button
            key={viz.id}
            className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.ARROW_TOP_RIGHT))}
            onClick={this.addChart.bind(this, viz.id)}
          >
            {viz.title}
          </button>
        )
      }
    })
    return buttons
  }

  @autobind
  updateCurrentNode(currentNode) {
    this.setState({ currentNode })
  }

  autoArrange = () => {
    const leaves = getLeaves(this.state.currentNode)
    this.updateCurrentNode(createBalancedTreeFromLeaves(leaves))
  }

  addChart = (viz) => {
    let { currentNode } = this.state
    if (!currentNode) {
     currentNode = viz
    } else {
      const path = getPathToCorner(currentNode, Corner.TOP_RIGHT)
      const parent = getNodeAtPath(currentNode, _dropRight(path))
      const destination = getNodeAtPath(currentNode, path)
      const direction = parent ? getOtherDirection(parent.direction) : 'row'
      let first
      let second
      if (direction === 'row') {
        first = destination
        second = viz
      } else {
        first = viz
        second = destination
      }
      currentNode = updateTree(currentNode, [
        {
          path,
          spec: {
            $set: {
              direction,
              first,
              second,
            },
          },
        },
      ])
    }
    this.updateCurrentNode(currentNode)
  }

}
