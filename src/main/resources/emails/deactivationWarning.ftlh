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

<#assign rank = person.getRank()>
<#assign name = person.getName()>
${rank} ${name},

<#assign endDate = person.getEndOfTourDate()>
Your ANET end of tour date is ${(dateFormatter.format(endDate))!}. On this date, your ANET profile will be inactivated and you will no longer be able to use ANET.

If your end of tour is correct, no action is required.

If your end of tour is not correct, please update your end of tour date.

Instructions for updating your end of tour date:
<ol>
	<#assign uuid = person.getUuid()>
	<li>Go to <a href="${serverUrl}/people/${uuid}">your ANET profile page</a> </li>
	<li>Select the blue "Edit" button in the top-right corner of the page</li>
	<li>Change your end of our date in the "End of tour" data field</li>
	<li>Select the blue "Save person" button in the top-right corner of the page</li>
</ol>

${nextEmailRemainder}
ANET Support Team
<#if SUPPORT_EMAIL_ADDR??>
  <br><a href="mailto:${SUPPORT_EMAIL_ADDR}">${SUPPORT_EMAIL_ADDR}</a>
</#if>

</body>
</html>
