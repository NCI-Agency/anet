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

<#assign reportAuthor = report.loadAuthor(context).get()>
Hi ${reportAuthor.name},

<p>Your report, <a href="${serverUrl}/reports/${report.uuid}"><em><strong>"${reportIntent}"</strong></em></a>, changes have been requested by ${rejector.name} &lt;${rejector.emailAddress}&gt;. The following comment was provided:</p>
<p>"${comment.text}"</p>

<p><strong>Engagement date and location:</strong> ${(engagementDateFormatter.format(report.engagementDate))!} @ ${(report.loadLocation(context).get().name)!}</p>

<p>You can edit and re-submit your report by <a href="${serverUrl}/reports/${report.uuid}">clicking here</a>.</p>

ANET Support Team
<#if SUPPORT_EMAIL_ADDR??>
  <br><a href="mailto:${SUPPORT_EMAIL_ADDR}">${SUPPORT_EMAIL_ADDR}</a>
</#if>

</body>
</html>
