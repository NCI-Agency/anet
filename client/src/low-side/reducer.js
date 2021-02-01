import { ACTION_TYPES } from "low-side/actions"
import { getSavedReports } from "low-side/clientStorage"

export const INITIAL_REPORTS = getSavedReports()

export const reducer = (state = INITIAL_REPORTS, action) => {
  switch (action.type) {
    case ACTION_TYPES.ADD_NEW_REPORT:
      return [...state, action.payload]

    case ACTION_TYPES.UPDATE_REPORT: {
      const newState = [...state]
      const indexOfUpdatedReport = newState.findIndex(
        r => r.uuid === action.payload.uuid
      )
      newState[indexOfUpdatedReport] = action.payload
      return newState
    }
    case ACTION_TYPES.DELETE_REPORT: {
      const newState = [...state]
      const indexOfDeletedReport = newState.findIndex(
        r => r.uuid === action.payload
      )
      newState.splice(indexOfDeletedReport, 1)
      return newState
    }
    case ACTION_TYPES.DELETE_TIMED_OUT_REPORTS: {
      // filter the deleted reports by checking deletedUuids array
      const newState = state.filter(r =>
        action.payload.find(uuid => uuid === r.uuid)
      )
      return newState
    }

    case ACTION_TYPES.DELETE_ALL_REPORTS:
      return []

    default:
      return state
  }
}
