<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>

    <xsl:template match="/">
        <nvg xmlns="http://tide.act.nato.int/schemas/2008/10/nvg" version="1.4.0" classification="NOT CLASSIFIED">
            <xsl:apply-templates select="data/reportList/list/element[number(location/lat)=location/lat]"/>
            <xsl:apply-templates select="data/REPORTS/list/element[number(location/lat)=location/lat]"/>
        </nvg>
    </xsl:template>

    <xsl:template match="element">
        <point>
            <xsl:attribute name="label">
                <xsl:value-of select="primaryAdvisor/name" />@<xsl:value-of select="primaryPrincipal/position/organization/longName" />
            </xsl:attribute>
            <xsl:attribute name="x">
                <xsl:value-of select="location/lng" />
            </xsl:attribute>
            <xsl:attribute name="y">
                <xsl:value-of select="location/lat" />
            </xsl:attribute>
        </point>
    </xsl:template>
</xsl:stylesheet>
