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
<p style="font-size:12px; font-weight: bold;"><i>Classification: ${SECURITY_BANNER_CLASSIFICATION}</i></p>

<p>Hi
<#assign reportAuthors = (report.loadAuthors(context).get())!>
<#list reportAuthors as reportAuthor>
  ${reportAuthor.name},
</#list></p><br><br>

<#assign commentAuthor = (comment.loadAuthor(context).get())!>
<p>The following comment was added to your report, <a href="${serverUrl}/reports/${report.uuid}"><em><strong>"${reportIntent}"</strong></em></a>, by ${commentAuthor.rank!} ${commentAuthor.name}:</p>

<p><i>"${comment.text}"</i></p>

<p>You can <a href="${serverUrl}/reports/${report.uuid}">view or reply to this comment by using this link</a>.</p>

<p>ANET Support Team
<#if SUPPORT_EMAIL_ADDR??>
  <br><a href="mailto:${SUPPORT_EMAIL_ADDR}">${SUPPORT_EMAIL_ADDR}</a>
</#if></p>

<p>The email is automatically sent by ANET. If you no longer wish to receive these emails you can adjust your <a href="${serverUrl}/preferences"><em><strong>notification preferences</strong></em></a></p>

</body>
</html>
