import React from "react"
import LinkTo from "components/LinkTo"

export const AuthorizationGroupOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>{item.name}</td>
    <td>{item.description}</td>
  </React.Fragment>
)

export const LocationOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkTo anetLocation={item} isLink={false} />
    </td>
  </React.Fragment>
)

export const OrganizationOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td className="orgShortName">
      <LinkTo organization={item} isLink={false} />
    </td>
  </React.Fragment>
)

export const TaskSimpleOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td className="taskName">
      <LinkTo task={item} isLink={false}>
        {item.shortName} - {item.longName}
      </LinkTo>
    </td>
  </React.Fragment>
)

export const TaskDetailedOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td className="taskName">
      <LinkTo task={item} isLink={false}>
        {item.shortName} - {item.longName}
      </LinkTo>
    </td>
    <td className="taskOrg">
      <LinkTo organization={item.responsibleOrg} isLink={false} />
    </td>
  </React.Fragment>
)

export const PositionOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkTo person={item.person} isLink={false} />
    </td>
    <td>
      <LinkTo position={item} isLink={false} />
    </td>
  </React.Fragment>
)

export const PersonOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkTo person={item} isLink={false} />
    </td>
    <td>
      <LinkTo position={item.position} isLink={false} />
      {item.position && item.position.code ? `, ${item.position.code}` : ""}
    </td>
    <td>
      <LinkTo
        whenUnspecified=""
        anetLocation={item.position && item.position.location}
        isLink={false}
      />
    </td>
    <td>
      {item.position && item.position.organization && (
        <LinkTo organization={item.position.organization} isLink={false} />
      )}
    </td>
  </React.Fragment>
)

export const TagOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkTo tag={item} isLink={false} />
    </td>
  </React.Fragment>
)

export const ApproverOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkTo person={item.person} isLink={false} />
    </td>
    <td>
      <LinkTo position={item} isLink={false} />
    </td>
  </React.Fragment>
)
