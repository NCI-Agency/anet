import Model, {
  createCustomFieldsSchema,
  GRAPHQL_NOTES_FIELDS
} from "components/Model"
import { convertLatLngToMGRS, convertMGRSToLatLng } from "geoUtils"
import _isEmpty from "lodash/isEmpty"
import LOCATIONS_ICON from "resources/locations.png"
import Settings from "settings"
import utils from "utils"
import * as yup from "yup"

export default class Location extends Model {
  static resourceName = "Location"
  static listName = "locationList"
  static getInstanceName = "location"
  static relatedObjectType = "locations"

  static APPROVAL_STEP_TYPE = {
    PLANNING_APPROVAL: "PLANNING_APPROVAL",
    REPORT_APPROVAL: "REPORT_APPROVAL"
  }

  // create yup schema for the customFields, based on the customFields config
  static customFieldsSchema = createCustomFieldsSchema(
    Settings.fields.location.customFields
  )

  static LOCATION_FORMATS = {
    LAT_LON: "LAT_LON",
    MGRS: "MGRS"
  }

  static LOCATION_FORMAT_LABELS = {
    [Location.LOCATION_FORMATS.LAT_LON]: "Latitude, Longitude",
    [Location.LOCATION_FORMATS.MGRS]: "Military Grid Reference System (MGRS)"
  }

  static locationFormat =
    Settings.fields.location.format || Location.LOCATION_FORMATS.LAT_LON

  static LOCATION_TYPE_ABBREVIATION = {
    PHYSICAL: "P",
    GEOGRAPHICAL: "PA",
    PINPOINT: "PP",
    ADVISOR: "PPA",
    PRINCIPAL: "PPP",
    VIRTUAL: "V"
  }

  static LOCATION_TYPE = {
    PHYSICAL: "Physical Location",
    GEOGRAPHICAL: "Geographical Area",
    PINPOINT: "Pinpoint Location",
    ADVISOR: "Advisor Location",
    PRINCIPAL: "Principal Location",
    VIRTUAL: "Virtual Location"
  }

  /**
   * Takes the location type displayed in the UI and converts it to an
   * abbreviation to be stored in the database.
   * @param   {String} locationTypeLabel Location type displayed in the UI, e.g., Advisor Location, ...etc.
   * @returns {String} The return result could be one of the following P, PA, PP, PPA, PPP & V.
   */
  static locationTypeMapper(locationTypeLabel) {
    switch (locationTypeLabel) {
      case this.LOCATION_TYPE.PHYSICAL:
        return this.LOCATION_TYPE_ABBREVIATION.PHYSICAL
      case this.LOCATION_TYPE.GEOGRAPHICAL:
        return this.LOCATION_TYPE_ABBREVIATION.GEOGRAPHICAL
      case this.LOCATION_TYPE.PINPOINT:
        return this.LOCATION_TYPE_ABBREVIATION.PINPOINT
      case this.LOCATION_TYPE.ADVISOR:
        return this.LOCATION_TYPE_ABBREVIATION.ADVISOR
      case this.LOCATION_TYPE.PRINCIPAL:
        return this.LOCATION_TYPE_ABBREVIATION.PRINCIPAL
      case this.LOCATION_TYPE.VIRTUAL:
        return this.LOCATION_TYPE_ABBREVIATION.VIRTUAL
      default:
        return ""
    }
  }

  /**
   * Takes the location type abbreviation returned from the server and converts it to a string
   * to be used in the UI.
   * @param {String} locationTypeAbbreviation Could be one of the following P, PA, PP, PPA, PPP & V.
   * @returns {String} Location type string to be displayed in the UI.
   */
  static locationTypeToString(locationTypeAbbreviation) {
    switch (locationTypeAbbreviation) {
      case this.LOCATION_TYPE_ABBREVIATION.PHYSICAL:
        return Location.LOCATION_TYPE.PHYSICAL
      case this.LOCATION_TYPE_ABBREVIATION.GEOGRAPHICAL:
        return Location.LOCATION_TYPE.GEOGRAPHICAL
      case this.LOCATION_TYPE_ABBREVIATION.PINPOINT:
        return Location.LOCATION_TYPE.PINPOINT
      case this.LOCATION_TYPE_ABBREVIATION.ADVISOR:
        return Location.LOCATION_TYPE.ADVISOR
      case this.LOCATION_TYPE_ABBREVIATION.PRINCIPAL:
        return Location.LOCATION_TYPE.PRINCIPAL
      case this.LOCATION_TYPE_ABBREVIATION.VIRTUAL:
        return Location.LOCATION_TYPE.VIRTUAL
      default:
        return ""
    }
  }

  static yupSchema = yup
    .object()
    .shape({
      name: yup.string().required().default(""),
      status: yup
        .string()
        .required()
        .default(() => Model.STATUS.ACTIVE),
      type: yup.string().required().default(""),
      lat: yup
        .number()
        .nullable()
        .min(-90, "Latitude must be a number between -90 and +90")
        .max(90, "Latitude must be a number between -90 and +90")
        .test("lat", "Please enter latitude", function(lat) {
          const { lng } = this.parent
          if (lng || lng === 0) {
            return !!lat || lat === 0
          }
          return true
        })
        .default(null),
      lng: yup
        .number()
        .nullable()
        .min(-180, "Longitude must be a number between -180 and +180")
        .max(180, "Longitude must be a number between -180 and +180")
        .test("lng", "Please enter longitude", function(lng) {
          const { lat } = this.parent
          if (lat || lat === 0) {
            return !!lng || lng === 0
          }
          return true
        })
        .default(null),
      // not actually in the database, but used for validation
      displayedCoordinate: yup
        .string()
        .nullable()
        .test({
          name: "displayedCoordinate",
          test: function(displayedCoordinate) {
            if (_isEmpty(displayedCoordinate)) {
              return true
            }
            if (Location.locationFormat === Location.LOCATION_FORMATS.MGRS) {
              const latLngValue = convertMGRSToLatLng(displayedCoordinate)
              return !latLngValue[0] || !latLngValue[1]
                ? this.createError({
                  message: "Please enter a valid MGRS coordinate",
                  path: "displayedCoordinate"
                })
                : true
            }
            return true
          }
        })
        .default(null),
      // FIXME: resolve code duplication in yup schema for approval steps
      planningApprovalSteps: yup
        .array()
        .of(
          yup.object().shape({
            name: yup
              .string()
              .required("You must provide the step name")
              .default(""),
            type: yup
              .string()
              .required()
              .default(() => Location.APPROVAL_STEP_TYPE.PLANNING_APPROVAL),
            approvers: yup
              .array()
              .required()
              .min(1, "You must select at least one approver")
              .default([])
          })
        )
        .nullable()
        .default([]),
      approvalSteps: yup
        .array()
        .of(
          yup.object().shape({
            name: yup
              .string()
              .required("You must provide the step name")
              .default(""),
            type: yup
              .string()
              .required()
              .default(() => Location.APPROVAL_STEP_TYPE.REPORT_APPROVAL),
            approvers: yup
              .array()
              .required()
              .min(1, "You must select at least one approver")
              .default([])
          })
        )
        .nullable()
        .default([])
    })
    // not actually in the database, the database contains the JSON customFields
    .concat(Location.customFieldsSchema)
    .concat(Model.yupSchema)

  static autocompleteQuery = "uuid, name, type"

  static autocompleteQueryWithNotes = `${this.autocompleteQuery} ${GRAPHQL_NOTES_FIELDS}`

  static allFieldsQuery = `
    uuid
    name
    type
    lat
    lng
    status
    planningApprovalSteps {
      uuid
      name
      approvers {
        uuid
        name
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
    }
    approvalSteps {
      uuid
      name
      approvers {
        uuid
        name
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
    }
    customFields
    ${GRAPHQL_NOTES_FIELDS}
  `

  static hasCoordinates(location) {
    return (
      location &&
      typeof location.lat === "number" &&
      typeof location.lng === "number"
    )
  }

  static isActive(loc) {
    return loc.status === Location.STATUS.ACTIVE
  }

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  constructor(props) {
    super(Model.fillObject(props, Location.yupSchema))
  }

  iconUrl() {
    return LOCATIONS_ICON
  }

  toString() {
    if (this.lat && this.lng) {
      const coordinate =
        Settings?.fields?.location?.format === "MGRS"
          ? convertLatLngToMGRS(this.lat, this.lng)
          : `${this.lat},${this.lng}`
      return `${this.name} ${coordinate}`
    }
    return this.name
  }

  static FILTERED_CLIENT_SIDE_FIELDS = ["displayedCoordinate"]

  static filterClientSideFields(obj, ...additionalFields) {
    return Model.filterClientSideFields(
      obj,
      ...Location.FILTERED_CLIENT_SIDE_FIELDS,
      ...additionalFields
    )
  }

  filterClientSideFields(...additionalFields) {
    return Location.filterClientSideFields(this, ...additionalFields)
  }
}
