import Model from "components/Model"
import Settings from "settings"
import utils from "utils"
import * as yup from "yup"

export default class Attachment extends Model {
  static resourceName = "Attachment"
  static listName = "attachmentList"
  static getInstanceName = "attachment"
  static relatedObjectType = "attachments"

  static displayName() {
    return Settings.fields.attachment.shortLabel
  }

  static schema = {}

  static yupSchema = yup.object().shape({
    uuid: yup.string().nullable().default(null),
    fileName: yup.string().required().default(""),
    description: yup.string().default(""),
    mimeType: yup.string().default(""),
    content: yup.string().url().default(""),
    attachmentRelatedObjects: yup
      .array()
      .nullable()
      .default([
        {
          relatedObjectType: yup.string().default(null),
          relatedObjectUuid: yup.string().default(null)
        }
      ]),
    classification: yup.string().default("")
  })

  static autocompleteQuery = "uuid fileName description classification mimeType"

  static _resourceOverride = ["attachments"].join("/")

  static pathFor(instance, query) {
    return Model.pathFor(instance, query, this._resourceOverride)
  }

  static pathForNew(query) {
    return Model.pathForNew(query, this._resourceOverride)
  }

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  constructor(props) {
    super(Model.fillObject(props, Attachment.yupSchema))
  }

  humanNameOfStatus() {
    return Attachment.humanNameOfStatus(this.status)
  }

  toString() {
    return this.fileName || this.description
  }
}
