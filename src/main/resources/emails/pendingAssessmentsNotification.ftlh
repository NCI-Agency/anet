<html lang="en">
<head>
  <style>
    <#include "common/emailStyle.css" parse="false">
  </style>
</head>
<body>
<#include "common/securityBanner.ftlh">

<p>Dear ${advisor.name},</p>

<#if tasks?has_content>
  <div>
    <p>The following ${fields.task.longLabel} for which you are responsible, have their periodic assessment due:</p>
    <ul>
      <#list tasks as task>
        <li>
          <a href="${serverUrl}/tasks/${task.uuid}">
            ${(task.longName)!}
          </a>
        </li>
      </#list>
    </ul>
  </div>
</#if>

<#if positions?has_content>
  <div>
    <p>Your counterparts have their periodic assessment due:</p>
    <ul>
      <#list positions as position>
        <li>
          <a href="${serverUrl}/people/${position.person.uuid}">
            ${(position.person.rank)!} ${(position.person.name)!}, ${(position.name)!}
            <#if position.loadOrganization(context).get()??>
              <#assign organization = position.getOrganization()>
              @ ${(organization.shortName)!}
            </#if>
          </a>
        </li>
      </#list>
    </ul>
  </div>
</#if>

<p>Please create your periodic assessment(s).</p>

<#include "common/notificationFooter.ftlh">
</body>
</html>
