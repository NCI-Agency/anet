import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import React, { useRef } from "react"
import { useDrag, useDrop } from "react-dnd"

interface DraggableRowProps {
  itemType: string
  row: any
  index: number
  moveRow: (from: number, to: number) => void
  onDropRow: (uuid: string, toIndex: number) => void
  dragHandleProps?: any
  asTableRow?: boolean
  children: React.ReactNode
}

const DraggableRow = ({
  itemType,
  row,
  index,
  moveRow,
  onDropRow,
  dragHandleProps,
  asTableRow,
  children
}: DraggableRowProps) => {
  const ref = useRef(null)
  const [, drop] = useDrop({
    accept: itemType,
    hover(item, monitor) {
      if (!ref.current) {
        return
      }
      if (item.index === index) {
        return
      }
      moveRow(item.index, index)
      item.index = index
    }
  })
  const [{ isDragging: dragActive }, drag, preview] = useDrag({
    type: itemType,
    item: { uuid: row.uuid, index },
    end: (item, monitor) => {
      if (!monitor.didDrop()) {
        return
      }
      onDropRow(item.uuid, item.index)
    },
    collect: monitor => ({
      isDragging: monitor.isDragging()
    })
  })
  drag(drop(ref))
  if (asTableRow) {
    return (
      <tr
        ref={ref}
        style={{
          opacity: dragActive ? 0.4 : 1,
          background: dragActive ? "#f0f4ff" : undefined,
          cursor: "pointer",
          verticalAlign: "baseline",
          textAlign: "center"
        }}
      >
        <td>
          <span {...dragHandleProps} style={{ cursor: "grab" }}>
            <Icon
              icon={IconNames.DRAG_HANDLE_VERTICAL}
              style={{ fontSize: 22 }}
            />
          </span>
        </td>
        {children}
      </tr>
    )
  }
  return (
    <div
      ref={ref}
      style={{
        opacity: dragActive ? 0.4 : 1,
        background: dragActive ? "#f0f4ff" : undefined,
        cursor: "pointer"
      }}
    >
      <div className="d-flex align-items-center">
        <span {...dragHandleProps} style={{ cursor: "grab", marginRight: 12 }}>
          <Icon
            icon={IconNames.DRAG_HANDLE_VERTICAL}
            style={{ fontSize: 22 }}
          />
        </span>
        <div className="flex-grow-1">{children}</div>
      </div>
    </div>
  )
}

export default DraggableRow
