<html>
<style type="text/css">
  body {
    font-family: Arial, Helvetica, SourceSansPro-Regular;
    color: #000000;
    font-size: 11px
  }
  h1 {
    font-size: 20px
  }
  h2 {
    font-size: 16px;
  }
  a {
    color:#0072BD;
  }
</style>

<body>

<p style="color:red; font-size:12px; font-weight: bold;" align="center"><i>Classification: ${SECURITY_BANNER_TEXT}</i></p>
Dear ${approvalStepName},
<br><br>
<div>
  <#assign reportAuthor = report.loadAuthor(context).get()>
  ${reportAuthor.name}'s report, <a href="${serverUrl}/reports/${report.uuid}"><em><strong>"${reportIntent}"</strong></em></a>, is ready for your review.<br>
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

<#assign attendees = report.loadAttendees(context).get()>
<div>
  <strong>Advisor organization:</strong> ${(report.loadAdvisorOrg(context).get().shortName)!}
</div>

<div>
  <strong>Advisor attendees:</strong>
  <ul>
    <#list attendees as attendee>
      <#if attendee.role == "ADVISOR">
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
  <strong>Principal organization:</strong> ${(report.loadPrincipalOrg(context).get().shortName)!}
</div>

<div>
  <strong>Principal attendees:</strong>
  <ul>
    <#list attendees as attendee>
      <#if attendee.role == "PRINCIPAL">
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
  <strong>Atmospherics:</strong> ${(report.atmosphere)!}
  <#if report.atmosphereDetails??>
	  - ${(report.atmosphereDetails)!}
  </#if>
</div>

<#if report.loadTags(context).get()??>
  <#assign tags = report.getTags()>
  <div>
    <strong>Tags:</strong>
    <ul>
      <#list tags as tag>
        <li>
          ${(tag.name)!} <em>(${(tag.description)!})</em>
        </li>
      </#list>
    </ul>
  </div>
</#if>

<div>
  <strong>Engagement date and location:</strong> ${(dateFormatter.format(report.engagementDate))!} @ ${(report.loadLocation(context).get().name)!}
</div>

<#assign tasks = report.loadTasks(context).get()>
<#list tasks as task>
<div class="row">
  <div class="col-xs-12">
    <#-- <a href="${serverUrl}/tasks/${task.uuid}"> -->
    <strong>Task:</strong> ${(task.longName)!}
    <#-- </a> -->
  </div>
</div>
</#list>

<div class="row">
  <div class="col-md-8">
    <p><strong>Meeting goal:</strong> ${report.intent}</p>
    <#if report.keyOutcomes??>
      <p><strong>Key outcomes:</strong> ${(report.keyOutcomes)!}</p>
    </#if>
    <#if report.nextSteps??>
      <p><strong>Next steps:</strong> ${(report.nextSteps)!}</p>
    </#if>
  </div>
</div>

ANET Support Team
<#if SUPPORT_EMAIL_ADDR??>
  <br><a href="mailto:${SUPPORT_EMAIL_ADDR}">${SUPPORT_EMAIL_ADDR}</a>
</#if>

</body>
</html>
