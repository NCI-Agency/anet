<#macro formatDate dateFormatter timestamp="">
  <#if !timestamp?has_content>
    unknown date/time
  <#else>
    ${dateFormatter.format(timestamp)}
  </#if>
</#macro>
