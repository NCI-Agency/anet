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

<p>Hi, you have a subscription update!</p>
<p>ANET Support Team
  <#if SUPPORT_EMAIL_ADDR??>
    <br><a href="mailto:${SUPPORT_EMAIL_ADDR}">${SUPPORT_EMAIL_ADDR}</a>
  </#if></p>

</body>
</html>
