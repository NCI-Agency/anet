import { Icon, Intent, Tooltip } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import Leaflet, { DEFAULT_MAP_STYLE } from "components/Leaflet"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  MODEL_TO_OBJECT_TYPE
} from "components/Model"
import RemoveButton from "components/RemoveButton"
import _cloneDeep from "lodash/cloneDeep"
import _escape from "lodash/escape"
import _isEmpty from "lodash/isEmpty"
import _set from "lodash/set"
import { Location } from "models"
import React, { useCallback, useReducer } from "react"
import { Button } from "react-bootstrap"
import { toast } from "react-toastify"
import Settings from "settings"

export const MERGE_SIDES = {
  LEFT: "left",
  RIGHT: "right"
}

export const ALIGN_OPTIONS = {
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right"
}

export const getOtherSide = side =>
  side === MERGE_SIDES.LEFT ? MERGE_SIDES.RIGHT : MERGE_SIDES.LEFT

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
  [MERGE_SIDES.LEFT]: null, // initial value of left mergeable
  [MERGE_SIDES.RIGHT]: null,
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
        const otherSide = getOtherSide(action.payload.side)
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

  return [mergeState, dispatchWrapper]
}
// FIXME: Fill when ready
const OBJECT_TYPE_TO_VALIDATOR = {
  [MODEL_TO_OBJECT_TYPE.AuthorizationGroup]: null,
  [MODEL_TO_OBJECT_TYPE.Location]: validForGeneral,
  [MODEL_TO_OBJECT_TYPE.Organization]: validForGeneral,
  [MODEL_TO_OBJECT_TYPE.Person]: validForGeneral,
  [MODEL_TO_OBJECT_TYPE.Position]: validPositions,
  [MODEL_TO_OBJECT_TYPE.Report]: null,
  [MODEL_TO_OBJECT_TYPE.Task]: null
}
// validations for every type of objects
function validForGeneral(otherMergeable, newMergeable, mergeableType) {
  if (sameMergeable(otherMergeable, newMergeable)) {
    toast.warning(`Please select different ${mergeableType}`)
    return false
  }
  return true
}

function validPositions(otherPos, newPos) {
  if (!sameOrganization(otherPos, newPos)) {
    toast.warning("Please select two positions with the same organization")
    return false
  }
  if (bothPosOccupied(otherPos, newPos)) {
    toast.warning("Please select at least one unoccupied position")
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
    toast.warning(msg)
    return true
  } else if (
    // only position2 has it
    !mergedPosition?.person?.uuid &&
    !position1?.person?.uuid &&
    position2?.person?.uuid
  ) {
    toast.warning(msg)
    return true
  } else {
    return false
  }
}

export function mergedPersonIsValid(mergedPerson) {
  const msg = []
  if (!mergedPerson.status) {
    msg.push(Settings.fields.person.status?.label)
  }
  if (!mergedPerson.rank) {
    msg.push(Settings.fields.person.rank?.label)
  }
  if (!Settings.fields.person.gender?.optional && !mergedPerson.gender) {
    msg.push(Settings.fields.person.gender?.label)
  }
  if (!Settings.fields.person.country?.optional && !mergedPerson.country) {
    msg.push(Settings.fields.person.country?.label)
  }
  // FIXME: Optional/required emailAddresses?
  if (
    !Settings.fields.person.endOfTourDate?.optional &&
    mergedPerson.user &&
    !mergedPerson.endOfTourDate
  ) {
    msg.push(Settings.fields.person.endOfTourDate?.label)
  }
  if (_isEmpty(msg)) {
    return true
  } else {
    const msgContainer = (
      <div>
        <div>It is required to fill the following fields:</div>
        <ul>
          {msg.map((m, index) => (
            <li key={index}>{m}</li>
          ))}
        </ul>
      </div>
    )
    toast.warning(msgContainer)
    return false
  }
}

export function mergedOrganizationIsValid(mergedOrganization) {
  const msg = []
  if (!mergedOrganization.status) {
    msg.push(Settings.fields.organization.status?.label)
  }
  if (!mergedOrganization.shortName) {
    msg.push(Settings.fields.organization.shortName?.label)
  }

  if (_isEmpty(msg)) {
    return true
  } else {
    const msgContainer = (
      <div>
        <div>It is required to fill the following fields:</div>
        <ul>
          {msg.map((m, index) => (
            <li key={index}>{m}</li>
          ))}
        </ul>
      </div>
    )
    toast.warning(msgContainer)
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
    <Tooltip content={infoText} intent={Intent.PRIMARY}>
      <Button variant="default">
        <Icon icon={IconNames.INFO_SIGN} intent={Intent.PRIMARY} />
      </Button>
    </Tooltip>
  )
}

export function getClearButton(onClear) {
  return (
    <Tooltip content="Clear field value" intent={Intent.DANGER}>
      <RemoveButton onClick={onClear} />
    </Tooltip>
  )
}

export function getActivationButton(isActive, onClickAction, instanceName) {
  return (
    <Tooltip
      content={
        isActive ? `Deactivate ${instanceName}` : `Activate ${instanceName}`
      }
      intent={isActive ? Intent.DANGER : Intent.SUCCESS}
    >
      <Button
        variant={isActive ? "outline-danger" : "outline-success"}
        onClick={onClickAction}
        className="activate-field-button"
      >
        <Icon icon={isActive ? IconNames.STOP : IconNames.PLAY} />
      </Button>
    </Tooltip>
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
  return (
    <small>
      <Button
        variant={
          mergeState?.selectedMap?.[fieldName] === align ? "success" : "primary"
        }
        onClick={onClickAction}
        disabled={disabled}
        style={{ textAlign: "center" }}
      >
        {align === "right" && <Icon icon={IconNames.DOUBLE_CHEVRON_LEFT} />}
        {text}
        {align !== "right" && <Icon icon={IconNames.DOUBLE_CHEVRON_RIGHT} />}
      </Button>
    </small>
  )
}

const HIDDEN_STYLE = { visibility: "hidden" }

export function getLeafletMap(mapId, location, hideWhenEmpty) {
  return Location.hasCoordinates(location) ? (
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
  ) : (
    <div style={hideWhenEmpty ? HIDDEN_STYLE : DEFAULT_MAP_STYLE} />
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
