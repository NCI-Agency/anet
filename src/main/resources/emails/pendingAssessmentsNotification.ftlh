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

<p>Dear ${advisor.name},</p>

<#if tasks?has_content>
  <div>
    <p>The following ${fields.task.longLabel} for which you are responsible, have their periodic assessment due:</p>
    <#list tasks as task>
      <ul>
        <li>
          <a href="${serverUrl}/tasks/${task.uuid}">
            ${(task.longName)!}
          </a>
        </li>
      </ul>
    </#list>
  </div>
</#if>

<#if positions?has_content>
  <div>
    <p>Your counterparts have their periodic assessment due:</p>
    <#list positions as position>
      <ul>
        <li>
          <a href="${serverUrl}/people/${position.person.uuid}">
            ${(position.person.rank)!} ${(position.person.name)!}, ${(position.name)!}
            <#if position.loadOrganization(context).get()??>
              <#assign organization = position.getOrganization()>
              @ ${(organization.shortName)!}
            </#if>
          </a>
        </li>
      </ul>
    </#list>
  </div>
</#if>

<p>Please create your periodic assessment(s).</p>

<p>ANET Support Team
<#if SUPPORT_EMAIL_ADDR??>
  <br><a href="mailto:${SUPPORT_EMAIL_ADDR}">${SUPPORT_EMAIL_ADDR}</a>
</#if></p>

</body>
</html>
