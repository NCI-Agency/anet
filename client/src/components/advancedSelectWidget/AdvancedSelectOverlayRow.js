import LinkToNotPreviewed from "components/LinkToNotPreviewed"
import moment from "moment"
import React from "react"
import Settings from "settings"

export const AuthorizationGroupOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>{item.name}</td>
    <td>{item.description}</td>
  </React.Fragment>
)

export const LocationOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkToNotPreviewed modelType="Location" model={item} isLink={false} />
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
      <LinkToNotPreviewed modelType="Task" model={item} isLink={false}>
        {item.shortName}
      </LinkToNotPreviewed>
    </td>
    <td className="parentTaskName">
      {item.customFieldRef1 && (
        <LinkToNotPreviewed
          modelType="Task"
          model={item.customFieldRef1}
          isLink={false}
        >
          {item.customFieldRef1.shortName}
        </LinkToNotPreviewed>
      )}
    </td>
  </React.Fragment>
)

export const PositionOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkToNotPreviewed modelType="Position" model={item} isLink={false} />
      {item.code ? `, ${item.code}` : ""}
    </td>
    <td>
      <LinkToNotPreviewed
        modelType="Organization"
        model={item.organization}
        isLink={false}
      />
    </td>
    <td>
      <LinkToNotPreviewed
        modelType="Person"
        model={item.person}
        isLink={false}
      />
    </td>
  </React.Fragment>
)

export const PersonSimpleOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkToNotPreviewed modelType="Person" model={item} isLink={false} />
    </td>
  </React.Fragment>
)

export const PersonDetailedOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkToNotPreviewed modelType="Person" model={item} isLink={false} />
    </td>
    <td>
      <LinkToNotPreviewed
        modelType="Position"
        model={item.position}
        isLink={false}
      />
      {item.position && item.position.code ? `, ${item.position.code}` : ""}
    </td>
    <td>
      <LinkToNotPreviewed
        modelType="Location"
        model={item.position && item.position.location}
        whenUnspecified=""
        isLink={false}
      />
    </td>
    <td>
      {item.position && item.position.organization && (
        <LinkToNotPreviewed
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
      <LinkToNotPreviewed modelType="Tag" model={item} isLink={false} />
    </td>
  </React.Fragment>
)

export const ApproverOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkToNotPreviewed
        modelType="Person"
        model={item.person}
        isLink={false}
      />
    </td>
    <td>
      <LinkToNotPreviewed modelType="Position" model={item} isLink={false} />
    </td>
  </React.Fragment>
)

export const ReportDetailedOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <LinkToNotPreviewed modelType="Report" model={item} isLink={false} />
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
