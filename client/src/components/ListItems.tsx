import styled from "@emotion/styled"
import React from "react"

const ListS = styled.ul`
  margin: 0;
  margin-left: ${props => props.marginLeft};
`

interface ListItemsProps {
  value: string
  forceList?: boolean
  compact?: boolean
}

const ListItems = ({ value, forceList, compact }: ListItemsProps) => {
  const items = value.split(/[\r\n\v\f\u2028\u2029]+/)
  if (items.length > 1 || forceList) {
    return (
      <ListS marginLeft={compact || "-18px"}>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ListS>
    )
  }
  return <>{value}</>
}

export default ListItems
