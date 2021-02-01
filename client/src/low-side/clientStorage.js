// Implement client side storage for drafted reports
// Should be available for maximum 2 hours

import Report from "low-side/models/Report"
import { reportTimedOut } from "low-side/utils"

export function deleteTimedOutReports() {
  const deletedUuids = []
  // loop through [uuid, reportData]
  getAllReportEntries().forEach(([uuid, reportData]) => {
    if (reportTimedOut(reportData)) {
      deleteReportData(uuid)
      console.info("Automatically deleted report, uuid: ", uuid)
      deletedUuids.push(uuid)
    }
  })
  // return deleted uuids if any for reducer
  return deletedUuids.length > 0 ? deletedUuids : null
}

export function addNewReportData(reportData) {
  let success = false
  if (localStorage.getItem(reportData.uuid)) {
    console.warn(
      "Trying to add duplicate item in localStorage uuid: ",
      reportData.uuid
    )
  } else {
    _setReport(reportData)
    success = true
  }
  return success
}

export function updateReport(reportData) {
  let success = false
  if (!localStorage.getItem(reportData.uuid)) {
    console.warn(
      "Trying to update non-existent item from localStorage uuid: ",
      reportData.uuid
    )
  } else {
    _setReport(reportData)
    success = true
  }

  return success
}

export function deleteReportData(uuid) {
  let success = false
  if (!localStorage.getItem(uuid)) {
    console.warn(
      "Trying to delete non-existent item from localStorage uuid: ",
      uuid
    )
  } else {
    console.info("Deleting uuid: ", uuid)
    localStorage.removeItem(uuid)
    success = true
  }
  return success
}

export function getSavedReports() {
  return getAllReportEntries().map(([key, val]) => val)
}

export function getReportByUuid(uuid) {
  const report = _getReport(uuid)
  if (!report) {
    console.warn(
      "Trying to access non-existent item from localStorage uuid: ",
      uuid
    )
  }
  return report
}

export function deleteAllReports() {
  getValidReportKeys().forEach(key => {
    localStorage.removeItem(key)
  })
}

function getAllReportEntries() {
  return getValidReportKeys().map(key => [key, _getReport(key)])
}

function getValidReportKeys() {
  // only the keys with 36 length uuid strings
  return Object.keys(localStorage).filter(key => key.length === 36)
}

function _setReport(reportData) {
  localStorage.setItem(reportData.uuid, JSON.stringify(reportData))
}

function _getReport(uuid) {
  const reportData = localStorage.getItem(uuid)
  return reportData ? new Report(JSON.parse(reportData)) : null
}
