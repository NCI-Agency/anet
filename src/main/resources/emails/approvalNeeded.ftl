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
<div>${report.author.name}'s report, <i>${report.intent}</i>, is ready for your review. You can <a href="${serverUrl}/reports/${report.id?c}" />review the report using this link</a>.</div>
<br>
<#if report.cancelledReason??>
  <p className="report-cancelled" style="border-left:16px solid #DA9795;padding-left:10px;">
    <strong>Cancelled:</strong>
    ${(report.cancelledReason)!}
  </p>
</#if>

<div>
  ${(report.primaryAdvisor.rank)!} -->
  <strong>Advisor:</strong> ${(report.primaryAdvisor.name)!} -
  ${(report.loadAdvisorOrg().shortName)!}
</div>

<div>
  <strong>Principal:</strong> ${(report.primaryPrincipal.name)!} <!-- ${(report.primaryPrincipal.rank)!} --> -
  ${(report.loadPrincipalOrg().shortName)!}
</div>

<div>
  <strong>Atmospherics:</strong> ${(report.atmosphere)!}
  <#if report.atmosphereDetails??>
	  - ${(report.atmosphereDetails)!}
  </#if>
</div>

<#assign tags = report.loadTags()>
<#list tags as tag>
<div class="row">
  <div class="col-xs-12">
    <strong>Tag:</strong> ${(tag.name)!} ${(tag.description)!}
  </div>
</div>
</#list>

<div>
	<strong>Time and Place:</strong> ${(report.engagementDate.toString('dd MMM yyyy'))!} @ ${(report.loadLocation().name)!}
</div>

<#assign poams = report.loadPoams()>
<#list poams as poam>
<div class="row">
  <div class="col-xs-12">
    <#-- <a href="${serverUrl}/poams/${poam.id}"> -->
    <strong>PoAM:</strong> ${(poam.longName)!}
    <#-- </a> -->
  </div>
</div>
</#list>

<div class="row">
  <div class="col-md-8">
    <p><strong>Meeting Goal:</strong> ${(report.intent)!}</p>
    <#if report.keyOutcomes??>
      <p><strong>Key outcomes:</strong> ${(report.keyOutcomes)!}</p>
    </#if>
    <#if report.nextSteps??>
      <p><strong>Next steps:</strong> ${(report.nextSteps)!}</p>
    </#if>
  </div>
</div>

<a href="${serverUrl}/reports/${report.id?c}/min">
  Read full report
</a>
<br><br>
<a href="${serverUrl}/reports/${report.id?c}?autoApprove=true">
  Click Here to Approve this Report
</a>
<br><br>
Merci!<br>
The ANET Team

</body>
</html>
