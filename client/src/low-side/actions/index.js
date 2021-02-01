import {
  addNewReportData,
  deleteAllReports,
  deleteReportData,
  deleteTimedOutReports,
  updateReport
} from "low-side/clientStorage"

export const ACTION_TYPES = {
  ADD_NEW_REPORT: 0,
  UPDATE_REPORT: 1,
  DELETE_REPORT: 2,
  DELETE_TIMED_OUT_REPORTS: 3,
  DELETE_ALL_REPORTS: 4,
  noop: 99
}

export function addNewReportAction(payload) {
  if (addNewReportData(payload)) {
    return {
      type: ACTION_TYPES.ADD_NEW_REPORT,
      payload
    }
  }
  return {
    type: ACTION_TYPES.noop
  }
}

export function updateReportAction(payload) {
  if (updateReport(payload)) {
    return {
      type: ACTION_TYPES.UPDATE_REPORT,
      payload
    }
  }
  return {
    type: ACTION_TYPES.noop
  }
}

export function deleteReportAction(uuid) {
  if (deleteReportData(uuid)) {
    console.log("Deleted reducer")

    return {
      type: ACTION_TYPES.DELETE_REPORT,
      payload: uuid
    }
  }
  return {
    type: ACTION_TYPES.noop
  }
}

export function deleteTimedOutReportsAction() {
  const deletedUuids = deleteTimedOutReports()
  if (deletedUuids) {
    return {
      type: ACTION_TYPES.DELETE_TIMED_OUT_REPORTS,
      payload: deletedUuids
    }
  }
  return {
    type: ACTION_TYPES.noop
  }
}

export function deleteAllReportsAction() {
  deleteAllReports()
  return {
    type: ACTION_TYPES.DELETE_ALL_REPORTS
  }
}
