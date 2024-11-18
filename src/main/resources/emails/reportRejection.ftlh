<html>
<head>
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
</head>
<body>
<p style="color:red; font-size:12px; font-weight: bold;"><i>Classification: ${SECURITY_BANNER_CLASSIFICATION}</i></p>

<p>Hi
<#assign reportAuthors = (report.loadAuthors(context).get())!>
<#list reportAuthors as reportAuthor>
  ${reportAuthor.name},
</#list></p><br><br>

<p>Your report, <a href="${serverUrl}/reports/${report.uuid}"><em><strong>"${reportIntent}"</strong></em></a>, changes have been requested by ${rejector.name} &lt;${rejector.emailAddress}&gt;. The following comment was provided:</p>
<p>"${comment.text}"</p>

<p><strong>Engagement date and location:</strong> ${(engagementDateFormatter.format(report.engagementDate))!} @ ${(report.loadLocation(context).get().name)!}</p>

<p>You can edit and re-submit your report by <a href="${serverUrl}/reports/${report.uuid}">clicking here</a>.</p>

<p>ANET Support Team
<#if SUPPORT_EMAIL_ADDR??>
  <br><a href="mailto:${SUPPORT_EMAIL_ADDR}">${SUPPORT_EMAIL_ADDR}</a>
</#if></p>

</body>
</html>
