<#macro formatDate dateFormatter timestamp="">
<#compress>
  <#if !timestamp?has_content>
    unknown date/time
  <#else>
    ${dateFormatter.format(timestamp)}
  </#if>
</#compress>
</#macro>
