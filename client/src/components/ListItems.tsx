import React from "react"

interface ListItemsProps {
  value: string
  forceList?: boolean
}

const ListItems = ({ value, forceList }: ListItemsProps) => {
  const items = value.split(/[\r\n\v\f\u2028\u2029]+/)
  if (items.length > 1 || forceList) {
    return (
      <ul style={{ marginLeft: "-18px" }}>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    )
  }
  return <>{value}</>
}

export default ListItems
