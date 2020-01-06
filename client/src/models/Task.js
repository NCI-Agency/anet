import { Settings } from "api"
import Model, { createYupObjectShape, yupDate } from "components/Model"
import React from "react"
import TASKS_ICON from "resources/tasks.png"
import utils from "utils"
import * as yup from "yup"

export const {
  shortLabel,
  longLabel,
  customFieldRef1,
  customField,
  customFieldEnum1,
  customFieldEnum2,
  plannedCompletion,
  projectedCompletion
} = Settings.fields.task

export default class Task extends Model {
  static resourceName = "Task"
  static listName = "taskList"
  static getInstanceName = "task"
  static getModelNameLinkTo = "task"

  static displayName() {
    return shortLabel
  }

  static STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE"
  }

  // create yup schema for the customFields, based on the customFields config
  static customFieldsSchema = createYupObjectShape(
    Settings.fields.person.customFields
  )

  static yupSchema = yup
    .object()
    .shape({
      shortName: yup
        .string()
        .required()
        .default("")
        .label(Settings.fields.task.shortName.label),
      longName: yup
        .string()
        .required()
        .default("")
        .label(Settings.fields.task.longName.label),
      category: yup
        .string()
        .nullable()
        .default(""),
      responsibleOrg: yup
        .object()
        .nullable()
        .default({})
        .label(Settings.fields.task.responsibleOrg),
      customFieldRef1: yup
        .object()
        .nullable()
        .default({})
        .label(customFieldRef1 && customFieldRef1.label),
      customFieldEnum1: yup
        .string()
        .nullable()
        .default("")
        .label(customFieldEnum1 && customFieldEnum1.label),
      customFieldEnum2: yup
        .string()
        .nullable()
        .default("")
        .label(customFieldEnum2 && customFieldEnum2.label),
      customField: yup
        .string()
        .nullable()
        .default("")
        .label(customField.label),
      projectedCompletion: yupDate
        .nullable()
        .default(null)
        .label(projectedCompletion && projectedCompletion.label),
      plannedCompletion: yupDate
        .nullable()
        .default(null)
        .label(plannedCompletion && plannedCompletion.label),
      status: yup
        .string()
        .required()
        .default(() => Task.STATUS.ACTIVE),
      responsiblePositions: yup
        .array()
        .nullable()
        .default([])
        .label(Settings.fields.task.responsiblePositions.label),
      // not actually in the database, the database contains the JSON customFields
      formCustomFields: yup
        .object()
        .shape(Task.customFieldsSchema)
        .nullable()
    })
    .concat(Model.yupSchema)

  static autocompleteQuery =
    "uuid, shortName, longName, responsibleOrg { uuid, shortName }"

  static autocompleteTemplate(task) {
    return <span>{[task.shortName, task.longName].join(" - ")}</span>
  }

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  constructor(props) {
    super(Model.fillObject(props, Task.yupSchema))
  }

  iconUrl() {
    return TASKS_ICON
  }

  toString() {
    return `${this.shortName} ${this.longName.substr(0, 80)}${
      this.longName.length > 80 ? "..." : ""
    }`
  }
}
