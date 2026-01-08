<html lang="en">
<head>
  <style>
    <#include "common/emailStyle.css" parse="false">
  </style>
</head>
<body>
<#include "common/securityBanner.ftlh">

<#assign rank = person.getRank()>
<#assign name = person.getName()>
<p>${rank} ${name},</p>

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

<#include "common/supportFooter.ftlh">
</body>
</html>
