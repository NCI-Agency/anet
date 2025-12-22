import { gqlAllAttachmentFields } from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import Approvals from "components/approvals/Approvals"
import AttachmentsDetailView from "components/Attachment/AttachmentsDetailView"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import { ReadonlyCustomFields } from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import EventCollection from "components/EventCollection"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import FindObjectsButton from "components/FindObjectsButton"
import GeoLocation, { GEO_LOCATION_DISPLAY_TYPE } from "components/GeoLocation"
import Leaflet from "components/Leaflet"
import LinkTo from "components/LinkTo"
import LocationTable from "components/LocationTable"
import Messages from "components/Messages"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import OrganizationTable from "components/OrganizationTable"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import PositionTable from "components/PositionTable"
import RelatedObjectNotes from "components/RelatedObjectNotes"
import ReportCollection from "components/ReportCollection"
import RichTextEditor from "components/RichTextEditor"
import { convertLatLngToMGRS } from "geoUtils"
import _escape from "lodash/escape"
import _isEmpty from "lodash/isEmpty"
import { Location } from "models"
import React, { useContext, useEffect, useMemo, useState } from "react"
import { Col, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { Link, useLocation, useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"

const GQL_GET_LOCATION = gql`
  query($uuid: String!) {
    location(uuid: $uuid) {
      ${Location.allFieldsQuery}
      attachments {
        ${gqlAllAttachmentFields}
      }
    }
  }
`

interface LocationShowProps {
  pageDispatchers?: PageDispatchersPropType
}

const LocationShow = ({ pageDispatchers }: LocationShowProps) => {
  const { currentUser } = useContext(AppContext)
  const { uuid } = useParams()
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state?.success
  const [stateError, setStateError] = useState(routerLocation.state?.error)
  const [attachments, setAttachments] = useState([])
  const { loading, error, data, refetch } = API.useApiQuery(GQL_GET_LOCATION, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Location",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  const location = useMemo(
    () => new Location(data?.location ?? {}),
    [data?.location]
  )

  const { shapes, markers } = useMemo(() => {
    const shapes = location?.geoJson
      ? [{ id: location.uuid || 0, geoJson: location.geoJson }]
      : []

    const markers = Location.hasCoordinates(location)
      ? [
          {
            id: location.uuid || 0,
            name: _escape(location.name) || "", // escape HTML in location name!
            lat: location.lat,
            lng: location.lng
          }
        ]
      : []

    return { shapes, markers }
  }, [location])
  usePageTitle(location?.name)
  useEffect(() => {
    setAttachments(location?.attachments || [])
  }, [location])
  if (done) {
    return result
  }
  if (data) {
    data.location[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.location.customFields
    )
  }
  const isAdmin = currentUser?.isAdmin()
  const canEdit = currentUser?.isSuperuser()
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled
  const avatar =
    attachments?.some(a => a.uuid === location?.entityAvatar?.attachmentUuid) &&
    location.entityAvatar

  const marker = {
    id: location.uuid || 0,
    name: _escape(location.name) || "" // escape HTML in location name!
  }
  if (Location.hasCoordinates(location)) {
    Object.assign(marker, {
      lat: location.lat,
      lng: location.lng
    })
  }
  const searchText = [location.name, location.digram, location.trigram].join(
    " "
  )
  const action = (
    <>
      {isAdmin && (
        <Link
          id="mergeWithOther"
          to="/admin/merge/locations"
          state={{ initialLeftUuid: location.uuid }}
          className="btn btn-outline-secondary"
        >
          Merge with other location
        </Link>
      )}
      {canEdit && (
        <LinkTo
          modelType="Location"
          model={location}
          edit
          button="primary"
          id="editButton"
        >
          Edit
        </LinkTo>
      )}
      <FindObjectsButton objectLabel="Location" searchText={searchText} />
      <RelatedObjectNotes
        notes={location.notes}
        relatedObject={
          location.uuid && {
            relatedObjectType: Location.relatedObjectType,
            relatedObjectUuid: location.uuid,
            relatedObject: location
          }
        }
      />
    </>
  )

  return (
    <div>
      <Messages success={stateSuccess} error={stateError} />
      <div className="form-horizontal">
        <Fieldset
          title={
            <>
              {
                <SubscriptionIcon
                  subscribedObjectType="locations"
                  subscribedObjectUuid={location.uuid}
                  isSubscribed={location.isSubscribed}
                  updatedAt={location.updatedAt}
                  refetch={refetch}
                  setError={error => {
                    setStateError(error)
                    jumpToTop()
                  }}
                  persistent
                />
              }{" "}
              Location {location.name}
            </>
          }
          action={action}
        />
        <Fieldset>
          <Row>
            <Col lg={4} xl={3} className="text-center">
              <EntityAvatarDisplay
                avatar={avatar}
                defaultAvatar={Location.relatedObjectType}
              />
            </Col>
            <Col
              lg={8}
              xl={9}
              className="d-flex flex-column justify-content-center"
            >
              <DictionaryField
                wrappedComponent={FieldHelper.ReadonlyField}
                dictProps={Settings.fields.location.name}
                field={{ name: "name", value: location.name }}
              />

              <DictionaryField
                wrappedComponent={FieldHelper.ReadonlyField}
                dictProps={Settings.fields.location.type}
                field={{ name: "type" }}
                humanValue={Location.humanNameOfType(location.type)}
              />

              {Location.hasCoordinates(location) && (
                <GeoLocation
                  coordinates={{
                    lat: location.lat,
                    lng: location.lng,
                    displayedCoordinate: convertLatLngToMGRS(
                      location.lat,
                      location.lng
                    )
                  }}
                  displayType={GEO_LOCATION_DISPLAY_TYPE.FORM_FIELD}
                />
              )}
              <DictionaryField
                wrappedComponent={FieldHelper.ReadonlyField}
                dictProps={Settings.fields.location.status}
                field={{ name: "status" }}
                humanValue={Location.humanNameOfStatus(location.status)}
              />
            </Col>
          </Row>
        </Fieldset>
        <Fieldset id="info" title="Additional Information">
          {location.type === Location.LOCATION_TYPES.COUNTRY && (
            <>
              <DictionaryField
                wrappedComponent={FieldHelper.ReadonlyField}
                dictProps={Settings.fields.location.digram}
                field={{ name: "digram", value: location.digram }}
              />

              <DictionaryField
                wrappedComponent={FieldHelper.ReadonlyField}
                dictProps={Settings.fields.location.trigram}
                field={{ name: "trigram", value: location.trigram }}
              />
            </>
          )}

          {!_isEmpty(location.parentLocations) && (
            <FieldHelper.ReadonlyField
              field={{ name: "parentLocations" }}
              label="Parent locations"
              humanValue={
                <LocationTable
                  id="location-parentLocations"
                  locations={location.parentLocations}
                />
              }
            />
          )}

          {!_isEmpty(location.childrenLocations) && (
            <FieldHelper.ReadonlyField
              field={{ name: "childrenLocations" }}
              label="Child locations"
              humanValue={
                <LocationTable
                  id="location-childrenLocations"
                  locations={location.childrenLocations}
                />
              }
            />
          )}

          {location.description && (
            <DictionaryField
              wrappedComponent={FieldHelper.ReadonlyField}
              dictProps={Settings.fields.location.description}
              field={{ name: "description" }}
              humanValue={
                <RichTextEditor readOnly value={location.description} />
              }
            />
          )}

          {attachmentsEnabled && (
            <FieldHelper.ReadonlyField
              field={{ name: "attachments" }}
              label="Attachments"
              humanValue={
                <AttachmentsDetailView
                  attachments={attachments}
                  updateAttachments={setAttachments}
                  relatedObjectType={Location.relatedObjectType}
                  relatedObjectUuid={location.uuid}
                  allowEdit={canEdit}
                />
              }
            />
          )}
        </Fieldset>

        {Settings.fields.location.customFields && (
          <Fieldset title="Location information" id="custom-fields">
            <ReadonlyCustomFields
              fieldsConfig={Settings.fields.location.customFields}
              values={location}
            />
          </Fieldset>
        )}

        {(!_isEmpty(markers) || !_isEmpty(shapes)) && (
          <Leaflet markers={markers} shapes={shapes} />
        )}
      </div>

      <Approvals
        relatedObject={location}
        objectType="Location"
        canEdit={canEdit}
        refetch={refetch}
      />

      <Fieldset title="Organizations at this Location">
        <OrganizationTable queryParams={{ locationUuid: uuid }} />
      </Fieldset>

      <Fieldset title="Positions at this Location">
        <PositionTable queryParams={{ locationUuid: uuid }} />
      </Fieldset>

      <Fieldset title="Reports at this Location">
        <ReportCollection
          paginationKey={`r_${uuid}`}
          queryParams={{ locationUuid: uuid }}
          mapId="reports"
        />
      </Fieldset>
      <Fieldset title="Events at this Location">
        <EventCollection
          paginationKey={`e_${uuid}`}
          queryParams={{ locationUuid: uuid }}
          mapId="events"
          showEventSeries
        />
      </Fieldset>
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(LocationShow)
