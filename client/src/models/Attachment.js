import Model from "components/Model"
import * as yup from "yup"

export default class Attachment extends Model {
  static resourceName = "Attachment"
  static listName = "attachmentList"
  static getInstanceName = "attachment"
  static relatedObjectType = "attachments"

  static schema = {}

  static yupSchema = yup.object().shape({
    uuid: yup.string().nullable().default(null),
    fileName: yup.string().required().default(""),
    caption: yup.string().required().default(""),
    description: yup.string().default(""),
    mimeType: yup.string().default(""),
    contentLength: yup.number().nullable().default(null),
    attachmentRelatedObjects: yup
      .array()
      .nullable()
      .default([
        {
          relatedObjectType: yup.string().nullable().default(null),
          relatedObjectUuid: yup.string().nullable().default(null)
        }
      ]),
    classification: yup.string().nullable().default(null)
  })

  static basicFieldsQuery =
    "uuid fileName caption description classification mimeType contentLength"

  static autocompleteQuery = Attachment.basicFieldsQuery

  constructor(props) {
    super(Model.fillObject(props, Attachment.yupSchema))
  }

  static FILTERED_CLIENT_SIDE_FIELDS = []

  static filterClientSideFields(obj, ...additionalFields) {
    return Model.filterClientSideFields(
      obj,
      ...Attachment.FILTERED_CLIENT_SIDE_FIELDS,
      ...additionalFields
    )
  }

  filterClientSideFields(...additionalFields) {
    return Attachment.filterClientSideFields(this, ...additionalFields)
  }

  toString() {
    return this.caption || this.fileName || this.description
  }
}
