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

<p>Your ANET profile has been automatically inactivated by the system as your end of tour date has been reached. You will no longer be able to use ANET.</p>

<#include "common/supportFooter.ftlh">
</body>
</html>
