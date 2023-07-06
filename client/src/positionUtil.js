import LinkTo from "components/LinkTo"
import _isEmpty from "lodash/isEmpty"
import React from "react"
import { ListGroup, ListGroupItem } from "react-bootstrap"

export function getPositionsForRole(positions, role) {
  const positionList = positions
    ?.filter(pos => pos.role === role)
    .map(pos => (
      <ListGroupItem key={pos.uuid}>
        <LinkTo modelType="Position" model={pos} />
      </ListGroupItem>
    ))
  if (!_isEmpty(positionList)) {
    return <ListGroup>{positionList}</ListGroup>
  }
}
