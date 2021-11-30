import LinkTo from "components/LinkTo"
import { Location } from "models"
import moment from "moment"
import React from "react"
import { Badge } from "react-bootstrap"
import Settings from "settings"

export const AuthorizationGroupOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkTo modelType="AuthorizationGroup" model={item} isLink={false} />
    </td>
    <td>
      {item.description}
    </td>
  </React.Fragment>
)

export const LocationOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <span style={{ display: "inline-block" }}>
        <LinkTo modelType="Location" model={item} isLink={false} />
      </span>
      <span style={{ paddingLeft: "1rem" }}>
        <Badge bg="secondary">{Location.humanNameOfType(item.type)}</Badge>
      </span>
    </td>
  </React.Fragment>
)

export const OrganizationOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td className="orgShortName">
      <span>
        <LinkTo modelType="Organization" model={item} isLink={false}>
          {` - ${item.longName} ${item.identificationCode}`}
        </LinkTo>
      </span>
    </td>
  </React.Fragment>
)

export const TaskSimpleOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td className="taskName">
      <span>
        <LinkTo modelType="Task" model={item} isLink={false}>
          {` - ${item.longName}`}
        </LinkTo>
      </span>
    </td>
  </React.Fragment>
)

export const TaskDetailedOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td className="taskName">
      <LinkTo modelType="Task" model={item} isLink={false} />
    </td>
    <td className="parentTaskName">
      {item.customFieldRef1 && (
        <LinkTo modelType="Task" model={item.customFieldRef1} isLink={false} />
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
      <span>
        {item.authors
          ? item.authors.map(a => (
            <div key={a.uuid} style={{ whiteSpace: "nowrap" }}>
              {a.name}
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
