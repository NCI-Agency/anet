<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>

    <xsl:template match="/">
        <kml xmlns="http://www.opengis.net/kml/2.2">
            <Folder>
            <name>ANET</name>
            <Style id="icon">
                <IconStyle>
                    <Icon>
                        <href>/assets/img/anet-circle.png</href>
                    </Icon>
                </IconStyle>
            </Style>
                <xsl:apply-templates select="data/reportList/list/element[number(location/lat)=location/lat]"/>
            </Folder>
        </kml>
    </xsl:template>

    <xsl:template match="element">
        <Placemark>
            <name>
                <xsl:value-of select="primaryAdvisor/name" />@<xsl:value-of select="primaryPrincipal/position/organization/longName"/>
            </name>
            <description>
                <a> 
                    <xsl:attribute name="href">/reports/<xsl:value-of select="uuid" /></xsl:attribute>
                    Engagement 
                    <xsl:value-of select="uuid"/> 
                </a>
                <br/>
                <xsl:value-of select="intent"/>
            </description>
            <styleUrl>#icon</styleUrl> 
            <Point>
                <coordinates><xsl:value-of select="location/lng"/>,<xsl:value-of select="location/lat"/></coordinates>
            </Point>
        </Placemark>
    </xsl:template>

</xsl:stylesheet>
