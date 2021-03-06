import { Button } from "@blueprintjs/core"
import { Tooltip2 } from "@blueprintjs/popover2"
import Leaflet from "components/Leaflet"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  MODEL_TO_OBJECT_TYPE
} from "components/Model"
import _cloneDeep from "lodash/cloneDeep"
import _escape from "lodash/escape"
import _isEmpty from "lodash/isEmpty"
import _set from "lodash/set"
import { Location } from "models"
import React, { useCallback, useReducer } from "react"
import { toast } from "react-toastify"

const MERGE_SIDES = ["left", "right"]

export const getOtherSide = side =>
  side === MERGE_SIDES[0] ? MERGE_SIDES[1] : MERGE_SIDES[0]

const ACTIONS = {
  SET_MERGEABLE: 1,
  SELECT_ALL_FIELDS: 2,
  SET_A_MERGED_FIELD: 3,
  SET_HEIGHT_OF_A_FIELD: 4
}

export function setMergeable(data, side) {
  return {
    type: ACTIONS.SET_MERGEABLE,
    payload: {
      data,
      side
    }
  }
}

export function selectAllFields(data, side) {
  return {
    type: ACTIONS.SELECT_ALL_FIELDS,
    payload: {
      data,
      side
    }
  }
}

export function setAMergedField(fieldName, data, side) {
  return {
    type: ACTIONS.SET_A_MERGED_FIELD,
    payload: {
      fieldName,
      data,
      side
    }
  }
}

export function setHeightOfAField(fieldName, data) {
  return {
    type: ACTIONS.SET_HEIGHT_OF_A_FIELD,
    payload: {
      fieldName,
      data
    }
  }
}

const INITIAL_STATE = {
  [MERGE_SIDES[0]]: null, // initial value of left mergeable
  [MERGE_SIDES[1]]: null,
  merged: null,
  heightMap: null, // keep track of fields height, maximum heighted field of 2 columns wins
  selectedMap: null // keep track of which col field selected, [fieldName]: "left", "right" or none can be selected
}

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_MERGEABLE: {
      // Which side it is coming from, set that
      const newState = { ...state, [action.payload.side]: action.payload.data }
      // lets fill the selectedMap with field names when an object gets picked
      // Each field name + each custom field name gets a key
      if (!state.selectedMap) {
        newState.selectedMap = getInitialMapOfFieldNames(action.payload.data)
      }
      // Also, if a mergeable is cleared, we should set to initial state
      if (!action.payload.data) {
        newState.selectedMap = getClearedMapOfFieldNames(newState.selectedMap)
      }
      // if a mergeable changes, we want to clear the merged as well
      newState.merged = null
      return newState
    }
    case ACTIONS.SELECT_ALL_FIELDS: {
      const newState = { ...state, merged: action.payload.data }
      if (state.selectedMap) {
        // Since we selected everything from one side, selectedMap should point to that side
        Object.keys(state.selectedMap).forEach(fieldName => {
          newState.selectedMap[fieldName] = action.payload.side
        })
      } else {
        throw new Error("Selected map should've been initialized")
      }

      return newState
    }
    case ACTIONS.SET_A_MERGED_FIELD: {
      const newState = { ...state }
      newState.merged = { ..._cloneDeep(state.merged) }
      _set(newState.merged, action.payload.fieldName, action.payload.data)
      newState.selectedMap = {
        ...state.selectedMap,
        [action.payload.fieldName]: action.payload.side
      }
      return newState
    }
    case ACTIONS.SET_HEIGHT_OF_A_FIELD: {
      const newState = {
        ...state,
        heightMap: {
          ...state.heightMap,
          [action.payload.fieldName]: action.payload.data
        }
      }

      return newState
    }
    default:
      return state
  }
}

const useMergeObjects = mergeableType => {
  const validForThatType = OBJECT_TYPE_TO_VALIDATOR[mergeableType]
  if (!validForThatType) {
    throw new Error("Pass a valid object type")
  }

  const [mergeState, dispatch] = useReducer(reducer, INITIAL_STATE)

  const dispatchWrapper = useCallback(
    action => {
      if (action.type === ACTIONS.SET_MERGEABLE) {
        const otherSide =
          action.payload.side === MERGE_SIDES[0]
            ? MERGE_SIDES[1]
            : MERGE_SIDES[0]
        const incMergeable = action.payload.data
        const otherMergeable = mergeState[otherSide]

        // One of them being empty means first time selecting or removing of a selection (cases which should always happen)
        // Only validate if other and incoming selections are set
        if (areAllSet(incMergeable, otherMergeable)) {
          if (
            !validForGeneral(incMergeable, otherMergeable, mergeableType) ||
            !validForThatType(incMergeable, otherMergeable)
          ) {
            return
          }
        }
      }
      dispatch(action)
    },
    [mergeState, mergeableType, validForThatType]
  )

  return [mergeState, dispatchWrapper, MERGE_SIDES]
}
// FIXME: Fill when ready
const OBJECT_TYPE_TO_VALIDATOR = {
  [MODEL_TO_OBJECT_TYPE.AuthorizationGroup]: null,
  [MODEL_TO_OBJECT_TYPE.Location]: validForGeneral,
  [MODEL_TO_OBJECT_TYPE.Organization]: null,
  [MODEL_TO_OBJECT_TYPE.Person]: null,
  [MODEL_TO_OBJECT_TYPE.Position]: validPositions,
  [MODEL_TO_OBJECT_TYPE.Report]: null,
  [MODEL_TO_OBJECT_TYPE.Task]: null
}
// validations for every type of objects
function validForGeneral(otherMergeable, newMergeable, mergeableType) {
  if (sameMergeable(otherMergeable, newMergeable)) {
    toast(`Please select different ${mergeableType}`)
    return false
  }
  return true
}

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

export function unassignedPerson(position1, position2, mergedPosition) {
  const msg = "You can't merge if a person is left unassigned"
  // both positions having a person is validated in useMergeObjects, can't happen
  // warn when one of them has it and merged doesn't
  if (
    // only position1 has it
    !mergedPosition?.person?.uuid &&
    position1?.person?.uuid &&
    !position2?.person?.uuid
  ) {
    toast(msg)
    return true
  } else if (
    // only position2 has it
    !mergedPosition?.person?.uuid &&
    !position1?.person?.uuid &&
    position2?.person?.uuid
  ) {
    toast(msg)
    return true
  } else {
    return false
  }
}

export function areAllSet(...args) {
  return args.every(item => {
    if (typeof item !== "object") {
      return item
    }
    return !_isEmpty(item)
  })
}

export function getInfoButton(infoText) {
  return (
    <Tooltip2 content={infoText} intent="primary">
      <Button minimal icon="info-sign" intent="primary" />
    </Tooltip2>
  )
}

export function getClearButton(onClear) {
  return (
    <Tooltip2 content="Clear field value" intent="danger">
      <Button icon="delete" outlined intent="danger" onClick={onClear} />
    </Tooltip2>
  )
}

export function getActivationButton(isActive, onClickAction, instanceName) {
  return (
    <Tooltip2
      content={
        isActive ? `Deactivate ${instanceName}` : `Activate ${instanceName}`
      }
      intent={isActive ? "danger" : "success"}
    >
      <Button
        icon={isActive ? "stop" : "play"}
        outlined
        intent={isActive ? "danger" : "success"}
        onClick={onClickAction}
      />
    </Tooltip2>
  )
}

export function getActionButton(
  onClickAction,
  align,
  mergeState,
  fieldName,
  disabled = false,
  text = ""
) {
  const intent =
    mergeState?.selectedMap?.[fieldName] === align ? "success" : "primary"
  const icon = align === "right" ? "double-chevron-left" : ""
  const rightIcon = align === "right" ? "" : "double-chevron-right"
  return (
    <small>
      <Button
        icon={icon}
        rightIcon={rightIcon}
        intent={intent}
        text={text}
        onClick={onClickAction}
        disabled={disabled}
        style={{ textAlign: "center" }}
      />
    </small>
  )
}

export function getLeafletMap(mapId, location) {
  return (
    <Leaflet
      mapId={mapId}
      markers={[
        {
          id: "marker-" + mapId,
          name: _escape(location?.name) || "", // escape HTML in location name!
          lat: Location.hasCoordinates(location) ? location.lat : null,
          lng: Location.hasCoordinates(location) ? location.lng : null
        }
      ]}
    />
  )
}

// Maps normal and custom field names to null for initialization
function getInitialMapOfFieldNames(obj) {
  // lets first map non-custom fields
  const map = Object.keys(obj).reduce((accum, fieldName) => {
    if (fieldName === DEFAULT_CUSTOM_FIELDS_PARENT) {
      return accum
    } else {
      accum[fieldName] = null
      return accum
    }
  }, {})

  // if it has custom fields, we should initialize those as well
  if (obj[DEFAULT_CUSTOM_FIELDS_PARENT]) {
    Object.keys(obj[DEFAULT_CUSTOM_FIELDS_PARENT]).reduce(
      (accum, fieldName) => {
        const combinedFieldName = `${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`
        accum[combinedFieldName] = null
        return accum
      },
      map
    )
  }
  return map
}

function getClearedMapOfFieldNames(map) {
  return Object.keys(map).reduce((accum, fieldName) => {
    accum[fieldName] = null
    return accum
  }, {})
}

export default useMergeObjects
