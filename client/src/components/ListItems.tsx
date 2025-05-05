import React from "react"

interface ListItemsProps {
  value: string
  forceList?: boolean
  compact?: boolean
}

const ListItems = ({ value, forceList, compact }: ListItemsProps) => {
  const items = value.split(/[\r\n\v\f\u2028\u2029]+/)
  if (items.length > 1 || forceList) {
    return (
      <ul
        style={
          compact ? { margin: 0 } : { marginLeft: "-18px", marginBottom: 0 }
        }
      >
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    )
  }
  return <>{value}</>
}

export default ListItems
