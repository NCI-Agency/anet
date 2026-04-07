<#macro listItems value="">
<#compress>
  <#assign items = value?split(r"\R+", "r")>
  <#if (items?size > 1)>
    <ul style="padding-left: 2rem; margin: 0 0 0 -18px;">
      <#list items as item>
        <li>${item}</li>
      </#list>
    </ul>
  <#else>
    ${value}
  </#if>
</#compress>
</#macro>
