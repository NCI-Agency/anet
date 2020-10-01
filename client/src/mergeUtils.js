import { Button, Tooltip } from "@blueprintjs/core"
import Leaflet from "components/Leaflet"
import { MODEL_TO_OBJECT_TYPE } from "components/Model"
import * as L from "leaflet"
import _escape from "lodash/escape"
import { Location } from "models"
import React, { useState } from "react"
import { toast } from "react-toastify"

const useMergeValidation = (
  initMergeable1 = null,
  initMergeable2 = null,
  initMergedState = null,
  mergeableType
) => {
  const [mergeable1, setMergeable1] = useState(initMergeable1)
  const [mergeable2, setMergeable2] = useState(initMergeable2)
  const [merged, setMerged] = useState(initMergedState)

  const validForThatType = OBJECT_TYPE_TO_VALIDATOR[mergeableType]
  if (!validForThatType) {
    throw new Error("Pass a valid object type")
  }

  function createStateSetter(mergeableNumber) {
    let other
    let setMergeable

    if (mergeableNumber === 1) {
      other = mergeable2
      setMergeable = setMergeable1
    } else if (mergeableNumber === 2) {
      other = mergeable1
      setMergeable = setMergeable2
    } else {
      throw new Error("Pass a valid mergeable number")
    }

    return function setValidState(newMergeable) {
      // One of them being nullish means first time selecting or removing of a selection (which should always happen)
      // Only validate if both set
      if (other && newMergeable) {
        if (
          !validForGeneral(other, newMergeable, mergeableType) ||
          !validForThatType(other, newMergeable)
        ) {
          return
        }
      }
      setMergeable(newMergeable)
      setMerged(initMergedState) // merged state should reset when a mergeable changes
    }
  }

  return [
    [mergeable1, mergeable2, merged],
    [createStateSetter(1), createStateSetter(2), setMerged]
  ]
}

const OBJECT_TYPE_TO_VALIDATOR = {
  [MODEL_TO_OBJECT_TYPE.AuthorizationGroup]: null,
  [MODEL_TO_OBJECT_TYPE.Location]: null,
  [MODEL_TO_OBJECT_TYPE.Organization]: null,
  [MODEL_TO_OBJECT_TYPE.Person]: null,
  [MODEL_TO_OBJECT_TYPE.Position]: validPositions,
  [MODEL_TO_OBJECT_TYPE.Report]: null,
  [MODEL_TO_OBJECT_TYPE.Task]: validTasks
}
// validations for every type of objects
function validForGeneral(otherMergeable, newMergeable, mergeableType) {
  if (sameMergeable(otherMergeable, newMergeable)) {
    toast(`Please select different ${mergeableType}`)
    return false
  }
}

function validTasks() {}

function validPositions(otherPos, newPos) {
  if (!sameOrganization(otherPos, newPos)) {
    toast("Please select two positions with the same organization")
    return false
  }
  if (bothPosOccupied(otherPos, newPos)) {
    toast("Please select at least one unoccupied position")
    return false
  }
  return true
}

function sameMergeable(otherMergeable, newMergeable) {
  return otherMergeable.uuid === newMergeable.uuid
}

function sameOrganization(otherMergeable, newMergeable) {
  return otherMergeable.organization.uuid === newMergeable.organization.uuid
}

function bothPosOccupied(otherPos, newPos) {
  return otherPos.person.uuid && newPos.person.uuid
}

export function areAllSet(...args) {
  return args.every(item => item)
}

export function getInfoButton(infoText) {
  return (
    <Tooltip content={infoText} intent="primary">
      <Button minimal icon="info-sign" intent="primary" />
    </Tooltip>
  )
}

export function getClearButton(onClear) {
  return (
    <Tooltip content="Clear field value" intent="danger">
      <Button icon="delete" outlined intent="danger" onClick={onClear} />
    </Tooltip>
  )
}

export function getActivationButton(
  isActive,
  onClickAction,
  mergeableType = "value"
) {
  return (
    <Tooltip
      content={
        isActive ? `Deactivate ${mergeableType}` : `Activate ${mergeableType}`
      }
      intent={isActive ? "danger" : "success"}
    >
      <Button
        icon={isActive ? "stop" : "play"}
        outlined
        intent={isActive ? "danger" : "success"}
        onClick={onClickAction}
      />
    </Tooltip>
  )
}

export function getActionButton(
  onClickAction,
  align,
  disabled = false,
  text = "Use value"
) {
  const icon = align === "right" ? "double-chevron-left" : ""
  const rightIcon = align === "right" ? "" : "double-chevron-right"
  return (
    <small>
      <Button
        icon={icon}
        rightIcon={rightIcon}
        intent="primary"
        text={text}
        onClick={onClickAction}
        disabled={disabled}
        style={{ textAlign: "center" }}
      />
    </small>
  )
}
// A workaround for "Map container is already initialized" error
// Don't wait leaflet to set its id to null, do it here
// FIXME: is there a better way?
export function removePrevMapEarly(mapId) {
  mapId = "map-" + mapId // to get map's real id, extra "map-" is added in the Leaflet
  const map = L.DomUtil.get(mapId)
  if (map) {
    map._leaflet_id = null
  }
}

export function getLeafletMap(mapId, location) {
  removePrevMapEarly(mapId)
  return (
    <Leaflet
      mapId={mapId}
      markers={[
        {
          id: "marker-" + mapId,
          name: _escape(location.name) || "", // escape HTML in location name!
          lat: Location.hasCoordinates(location) ? location.lat : null,
          lng: Location.hasCoordinates(location) ? location.lng : null
        }
      ]}
    />
  )
}

export default useMergeValidation
