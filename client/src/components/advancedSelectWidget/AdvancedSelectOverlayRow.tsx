import AttachmentImage from "components/Attachment/AttachmentImage"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import LinkTo from "components/LinkTo"
import { Location, Task } from "models"
import moment from "moment"
import React from "react"
import { Badge } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

const cursorStyle = {
  cursor: "pointer"
}

interface AsLinkProps {
  modelType: string
  model?: any
  whenUnspecified?: string
  children?: React.ReactNode
}

const AsLink = ({
  modelType,
  model,
  whenUnspecified,
  children
}: AsLinkProps) =>
  modelType === Task.resourceName ? (
    <BreadcrumbTrail
      modelType={modelType}
      leaf={model}
      ascendantObjects={model.ascendantTasks}
      parentField="parentTask"
      isLink={false}
      style={cursorStyle}
    />
  ) : (
    <LinkTo
      modelType={modelType}
      model={model}
      whenUnspecified={whenUnspecified}
      isLink={false}
      style={cursorStyle}
    >
      {children}
    </LinkTo>
  )

export const AttachmentOverlayRow = (item: any) => {
  const { iconSize, iconImage, contentMissing } =
    utils.getAttachmentIconDetails(item, true)
  return (
    <React.Fragment key={item.uuid}>
      <td>
        <div style={{ width: "50px", height: "50px" }}>
          <AttachmentImage
            uuid={item.uuid}
            caption={item.caption}
            contentMissing={contentMissing}
            iconSize={iconSize}
            iconImage={iconImage}
          />
        </div>
      </td>
      <td>
        <AsLink modelType="Attachment" model={item} />
      </td>
      <td>
        <span>
          {moment(item.createdAt).format(
            Settings.dateFormats.forms.displayShort.withTime
          )}
        </span>
      </td>
    </React.Fragment>
  )
}

export const AuthorizationGroupOverlayRow = (item: any) => (
  <React.Fragment key={item.uuid}>
    <td>
      <AsLink modelType="AuthorizationGroup" model={item} />
    </td>
    <td>{item.description}</td>
  </React.Fragment>
)

export const CountryOverlayRow = (item: any) => (
  <React.Fragment key={item.uuid}>
    <td>{item.name}</td>
    <td>{item.digram}</td>
    <td>{item.trigram}</td>
  </React.Fragment>
)

export const EventSeriesOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <span style={{ display: "inline-block" }}>
        <AsLink modelType="EventSeries" model={item} />
      </span>
    </td>
  </React.Fragment>
)

export const EventOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <span style={{ display: "inline-block" }}>
        <AsLink modelType="Event" model={item} />
      </span>
    </td>
  </React.Fragment>
)

export const LocationOverlayRow = (item: any) => (
  <React.Fragment key={item.uuid}>
    <td>
      <span style={{ display: "inline-block" }}>
        <AsLink modelType="Location" model={item} />
      </span>
      <span style={{ paddingLeft: "1rem" }}>
        <Badge bg="secondary">{Location.humanNameOfType(item.type)}</Badge>
      </span>
    </td>
  </React.Fragment>
)

export const OrganizationOverlayRow = (item: any) => (
  <React.Fragment key={item.uuid}>
    <td className="orgShortName">
      <span>
        <AsLink modelType="Organization" model={item} />
      </span>
    </td>
  </React.Fragment>
)

export const TaskOverlayRow = (item: any) => (
  <React.Fragment key={item.uuid}>
    <td className="taskName">
      <span>
        <AsLink modelType="Task" model={item} />
      </span>
    </td>
  </React.Fragment>
)

export const PositionOverlayRow = (item: any) => (
  <React.Fragment key={item.uuid}>
    <td>
      <AsLink modelType="Position" model={item} />
      {item.code ? `, ${item.code}` : ""}
    </td>
    <td>
      <AsLink modelType="Organization" model={item.organization} />
    </td>
    <td>
      <AsLink modelType="Person" model={item.person} />
    </td>
  </React.Fragment>
)

export const OrganizationSimpleOverlayRow = (item: any) => (
  <React.Fragment key={item.uuid}>
    <td>
      <AsLink modelType="Organization" model={item} />
    </td>
  </React.Fragment>
)

export const PersonSimpleOverlayRow = (item: any) => (
  <React.Fragment key={item.uuid}>
    <td>
      <AsLink modelType="Person" model={item} />
    </td>
  </React.Fragment>
)

export const PersonDetailedOverlayRow = (item: any, date) => {
  const position = utils.findPositionAtDate(item, date)
  return (
    <React.Fragment key={item.uuid}>
      <td>
        <AsLink modelType="Person" model={item} />
      </td>
      <td>
        <AsLink modelType="Position" model={position} />
        {position?.code ? `, ${position.code}` : ""}
      </td>
      <td>
        <AsLink
          modelType="Location"
          model={position?.location}
          whenUnspecified=""
        />
      </td>
      <td>
        {position?.organization && (
          <AsLink modelType="Organization" model={position?.organization} />
        )}
      </td>
    </React.Fragment>
  )
}

export const ApproverOverlayRow = (item: any) => (
  <React.Fragment key={item.uuid}>
    <td>
      <AsLink modelType="Person" model={item.person} />
    </td>
    <td>
      <AsLink modelType="Position" model={item} />
    </td>
  </React.Fragment>
)

export const ReportDetailedOverlayRow = (item: any) => (
  <React.Fragment key={item.uuid}>
    <td>
      <AsLink modelType="Report" model={item} />
    </td>
    <td>
      <span>
        {item.authors
          ? item.authors.map(a => (
              <div key={a.uuid} style={{ whiteSpace: "nowrap" }}>
                <AsLink modelType="Person" model={a} />
              </div>
            ))
          : "Unknown"}
      </span>
    </td>
    <td>
      <span>
        {moment(item.updatedAt).format(
          Settings.dateFormats.forms.displayShort.withTime
        )}
      </span>
    </td>
  </React.Fragment>
)
