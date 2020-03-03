import { Settings } from "api"
import LinkTo from "components/LinkTo"
import moment from "moment"
import React from "react"

export const AuthorizationGroupOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>{item.name}</td>
    <td>{item.description}</td>
  </React.Fragment>
)

export const LocationOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkTo modelType="Location" model={item} isLink={false} />
    </td>
  </React.Fragment>
)

export const OrganizationOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td className="orgShortName">
      <span>
        {item.shortName} - {item.longName} {item.identificationCode}
      </span>
    </td>
  </React.Fragment>
)

export const TaskSimpleOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td className="taskName">
      <span>
        {item.shortName} - {item.longName}
      </span>
    </td>
  </React.Fragment>
)

export const TaskDetailedOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td className="taskName">
      <LinkTo modelType="Task" model={item} isLink={false}>
        {item.shortName}
      </LinkTo>
    </td>
    <td className="parentTaskName">
      {item.customFieldRef1 && (
        <LinkTo modelType="Task" model={item.customFieldRef1} isLink={false}>
          {item.customFieldRef1.shortName}
        </LinkTo>
      )}
    </td>
  </React.Fragment>
)

export const PositionOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkTo modelType="Position" model={item} isLink={false} />
      {item.code ? `, ${item.code}` : ""}
    </td>
    <td>
      <LinkTo
        modelType="Organization"
        model={item.organization}
        isLink={false}
      />
    </td>
    <td>
      <LinkTo modelType="Person" model={item.person} isLink={false} />
    </td>
  </React.Fragment>
)

export const PersonSimpleOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkTo modelType="Person" model={item} isLink={false} />
    </td>
  </React.Fragment>
)

export const PersonDetailedOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkTo modelType="Person" model={item} isLink={false} />
    </td>
    <td>
      <LinkTo modelType="Position" model={item.position} isLink={false} />
      {item.position && item.position.code ? `, ${item.position.code}` : ""}
    </td>
    <td>
      <LinkTo
        modelType="Location"
        model={item.position && item.position.location}
        whenUnspecified=""
        isLink={false}
      />
    </td>
    <td>
      {item.position && item.position.organization && (
        <LinkTo
          modelType="Organization"
          model={item.position.organization}
          isLink={false}
        />
      )}
    </td>
  </React.Fragment>
)

export const TagOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkTo modelType="Tag" model={item} isLink={false} />
    </td>
  </React.Fragment>
)

export const ApproverOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkTo modelType="Person" model={item.person} isLink={false} />
    </td>
    <td>
      <LinkTo modelType="Position" model={item} isLink={false} />
    </td>
  </React.Fragment>
)

export const ReportDetailedOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkTo modelType="Report" model={item} isLink={false} />
    </td>
    <td>
      <span>{item.author ? item.author.name : "Unknown"}</span>
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
