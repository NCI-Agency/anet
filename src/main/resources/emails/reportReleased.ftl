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

Hi ${report.author.name},

<p>Your report, <a href="${serverUrl}/reports/${report.uuid}"><em><strong>"${reportIntent}"</strong></em></a>, has been approved and added to the daily rollup. </p>

<p>You can view the daily rollup by <a href="${serverUrl}/rollup">clicking here</a>.</p>

<p>You can view your report by <a href="${serverUrl}/reports/${report.uuid}">clicking here</a>.</p>

ANET Support Team
<#if SUPPORT_EMAIL_ADDR??>
  <br><a href="mailto:${SUPPORT_EMAIL_ADDR}">${SUPPORT_EMAIL_ADDR}</a>
</#if>

</body>
</html>
