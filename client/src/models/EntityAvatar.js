import Model from "components/Model"
import * as yup from "yup"

export default class EntityAvatar extends Model {
  static resourceName = "EntityAvatar"
  static getInstanceName = "entityAvatar"
  static relatedObjectType = "entityAvatars"

  static schema = {}

  static yupSchema = yup.object().shape({
    relatedObjectType: yup.string().default(""),
    relatedObjectUuid: yup.string().default(""),
    attachmentUuid: yup.string().default(""),
    applyCrop: yup.boolean().default(false),
    cropLeft: yup.number().nullable().default(0),
    cropTop: yup.number().nullable().default(0),
    cropWidth: yup.number().nullable().default(0),
    cropHeight: yup.number().nullable().default(0)
  })

  static basicFieldsQuery =
    "relatedObjectType relatedObjectUuid attachmentUuid cropLeft cropTop cropWidth cropHeight"

  constructor(props) {
    super(Model.fillObject(props, EntityAvatar.yupSchema))
  }
}
