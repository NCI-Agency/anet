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

<p>Hi, you have a subscription update for <a href="${serverUrl}/${updatedObjectType}/${updatedObjectUuid}">this object</a><#if isNote>, because a note was added to it</#if>.</p>

<p>Go <a href="${serverUrl}/subscriptions/mine">here</a> to see all your updates and subscriptions.</p>

<p>ANET Support Team
  <#if SUPPORT_EMAIL_ADDR??>
    <br><a href="mailto:${SUPPORT_EMAIL_ADDR}">${SUPPORT_EMAIL_ADDR}</a>
  </#if></p>

</body>
</html>
