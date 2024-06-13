import Model from "components/Model"
import * as yup from "yup"

export default class EntityAvatar extends Model {
  static resourceName = "EntityAvatar"
  static getInstanceName = "entityAvatar"
  static relatedObjectType = "entityAvatars"

  static schema = {}

  static yupSchema = yup.object().shape({
    entityUuid: yup.string().nullable().default(""),
    attachmentUuid: yup.string().default(""),
    cropLeft: yup.number().default(0),
    cropTop: yup.number().default(0),
    cropWidth: yup.number().default(0),
    cropHeight: yup.number().default(0)
  })

  static basicFieldsQuery =
    "entityUuid attachmentUuid cropLeft cropTop cropWidth cropHeight"

  constructor(props) {
    super(Model.fillObject(props, EntityAvatar.yupSchema))
  }
}
