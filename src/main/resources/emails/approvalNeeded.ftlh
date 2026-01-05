<html lang="en">
<head>
  <style>
    <#include "common/emailStyle.css" parse="false">
  </style>
</head>
<body>
<#include "common/securityBanner.ftlh">

<p>Dear ${approvalStepName},</p>

<div>
  This report, <a href="${serverUrl}/reports/${report.uuid}" class="report-intent">${reportIntent}</a>,
  authored by
  <#assign reportAuthors = (report.loadAuthors(context).get())!>
  <#list reportAuthors as reportAuthor>
    ${reportAuthor.name},
  </#list>
  is ready for your review.<br>
  Using <a href="${serverUrl}/reports/${report.uuid}" />this link</a>,
  you can either <em>Approve</em>, <em>Request changes to</em> or <em>Edit</em> the report.
</div>
<br>
<#if report.cancelledReason??>
  <p className="report-cancelled" style="border-left:16px solid #DA9795;padding-left:10px;">
    <strong>Cancelled:</strong>
    ${(report.cancelledReason)!}
  </p>
</#if>

<div>
  <strong>Report number:</strong> #${(report.uuid)}
</div>

<#assign attendees = (report.loadAttendees(context).get())!>
<div>
  <strong>Advisor organization:</strong> ${(report.loadAdvisorOrg(context).get().shortName)!}
</div>

<div>
  <strong>Advisor attendees:</strong>
  <ul>
    <#list attendees as attendee>
      <#if !attendee.interlocutor>
        <li>
          ${(attendee.name)!}
          <#if attendee.loadPosition()??>
            <#assign position = attendee.loadPosition()>
            <#if position.loadOrganization(context).get()??>
              <#assign organization = position.getOrganization()>
              <em>from</em> ${(organization.shortName)!}
            </#if>
          </#if>
          <#if attendee.primary>
            <em>(primary)</em>
          </#if>
        </li>
      </#if>
    </#list>
  </ul>
</div>

<div>
  <strong>Interlocutor organization:</strong> ${(report.loadInterlocutorOrg(context).get().shortName)!}
</div>

<div>
  <strong>Interlocutor attendees:</strong>
  <ul>
    <#list attendees as attendee>
      <#if attendee.interlocutor>
        <li>
          ${(attendee.name)!}
          <#if attendee.loadPosition()??>
            <#assign position = attendee.loadPosition()>
            <#if position.loadOrganization(context).get()??>
              <#assign organization = position.getOrganization()>
              <em>from</em> ${(organization.shortName)!}
            </#if>
          </#if>
          <#if attendee.primary>
            <em>(primary)</em>
          </#if>
        </li>
      </#if>
    </#list>
  </ul>
</div>

<div>
  <strong>${fields.report.atmosphere.label!}:</strong> ${(report.atmosphere)!}
  <#if report.atmosphereDetails??>
	  - ${(report.atmosphereDetails)!}
  </#if>
</div>

<div>
  <strong>Engagement date and location:</strong> ${(engagementDateFormatter.format(report.engagementDate))!} @ ${(report.loadLocation(context).get().name)!}
</div>

<#if engagementsIncludeTimeAndDuration>
  <div>
    <strong>Duration (minutes):</strong> ${(report.duration)!}
  </div>
</#if>

<#assign tasks = (report.loadTasks(context).get())!>
<#list tasks as task>
<div>
  <div>
    <#-- <a href="${serverUrl}/tasks/${task.uuid}"> -->
    <strong>${fields.task.shortLabel}:</strong> ${(task.longName)!}
    <#-- </a> -->
  </div>
</div>
</#list>

<div>
  <div>
    <p><strong>${fields.report.intent.label!}:</strong> ${report.intent}</p>
    <#if report.keyOutcomes??>
      <#if fields.report.keyOutcomes??>
        <p><strong>${fields.report.keyOutcomes.label!}:</strong> ${(report.keyOutcomes)!}</p>
      </#if>
    </#if>
    <#if report.nextSteps??>
      <p><strong>${fields.report.nextSteps.label!}:</strong> ${(report.nextSteps)!}</p>
    </#if>
  </div>
</div>

<#include "common/notificationFooter.ftlh">
</body>
</html>
