import Model, {
  createCustomFieldsSchema,
  GRAPHQL_ENTITY_AVATAR_FIELDS,
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

  static LOCATION_TYPES = {
    PHYSICAL_LOCATION: "PHYSICAL_LOCATION",
    GEOGRAPHICAL_AREA: "GEOGRAPHICAL_AREA",
    COUNTRY: "COUNTRY",
    POINT_LOCATION: "POINT_LOCATION",
    VIRTUAL_LOCATION: "VIRTUAL_LOCATION"
  }

  static yupSchema = yup
    .object()
    .shape({
      name: yup.string().required().default(""),
      digram: yup
        .string()
        .nullable()
        .optional()
        .length(2)
        .transform(value => value || null)
        .default(null),
      trigram: yup
        .string()
        .nullable()
        .optional()
        .length(3)
        .transform(value => value || null)
        .default(null),
      description: yup.string().nullable().default(""),
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
          if (utils.isNumeric(lng)) {
            return utils.isNumeric(lat)
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
          if (utils.isNumeric(lat)) {
            return utils.isNumeric(lng)
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
      parentLocations: yup.array().nullable().default([]),
      childrenLocations: yup.array().nullable().default([]),
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

  static autocompleteQuery = "uuid name type digram trigram"

  static autocompleteQueryWithNotes = `${this.autocompleteQuery} ${GRAPHQL_NOTES_FIELDS}`

  static allFieldsQuery = `
    uuid
    name
    digram
    trigram
    description
    type
    lat
    lng
    status
    isSubscribed
    updatedAt
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
          avatarUuid
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
          avatarUuid
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
    }
    parentLocations {
      uuid
      name
      type
    }
    childrenLocations {
      uuid
      name
      type
    }
    customFields
    ${GRAPHQL_NOTES_FIELDS}
  `

  static hasCoordinates(location) {
    return (
      location && utils.isNumeric(location.lat) && utils.isNumeric(location.lng)
    )
  }

  static isActive(loc) {
    return loc.status === Location.STATUS.ACTIVE
  }

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  static humanNameOfType(type) {
    return utils.sentenceCase(type)
  }

  static getLocationFilters(filterDefs) {
    return filterDefs?.reduce((accumulator, filter) => {
      accumulator[filter] = {
        label: Location.humanNameOfType(filter),
        queryVars: { type: filter }
      }
      return accumulator
    }, {})
  }

  static getOrganizationLocationFilters() {
    return Location.getLocationFilters(
      Settings?.fields?.organization?.location?.filter
    )
  }

  static getPositionLocationFilters() {
    return Location.getLocationFilters(
      Settings?.fields?.position?.location?.filter
    )
  }

  static getReportLocationFilters() {
    return Location.getLocationFilters(
      Settings?.fields?.report?.location?.filter
    )
  }

  constructor(props) {
    super(Model.fillObject(props, Location.yupSchema))
  }

  iconUrl() {
    return LOCATIONS_ICON
  }

  toString() {
    if (utils.isNumeric(this.lat) && utils.isNumeric(this.lng)) {
      const coordinate =
        Settings?.fields?.location?.format === "MGRS"
          ? convertLatLngToMGRS(this.lat, this.lng)
          : `${this.lat},${this.lng}`
      return `${this.name} ${coordinate}`
    }
    return this.name
  }

  static FILTERED_CLIENT_SIDE_FIELDS = [
    "childrenLocations",
    "displayedCoordinate"
  ]

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

  fixupFields() {
    super.fixupFields()
    this.displayedCoordinate = convertLatLngToMGRS(this.lat, this.lng)
  }
}
