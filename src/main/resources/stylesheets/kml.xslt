<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>

    <xsl:template match="/">
        <kml xmlns="http://www.opengis.net/kml/2.2">
            <Folder>
                <name>ANET</name>
                <Style id="icon">
                    <IconStyle>
                        <Icon>
                            <href>assets/img/anet-circle.png</href>
                        </Icon>
                    </IconStyle>
                </Style>
                <xsl:apply-templates select="data/reportList/list/element[number(location/lat)=location/lat]"/>
                <ScreenOverlay>
                    <name>ANET Legend </name>
                    <Icon>
                        <href>assets/img/anet.png</href>
                    </Icon>
                    <overlayXY x="0" y="0" xunits="fraction" yunits="fraction"/>
                    <screenXY x="25" y="25" xunits="pixels" yunits="pixels"/>
                    <rotationXY x="0.5" y="0.5" xunits="fraction" yunits="fraction"/>
                    <size x="185" y="43" xunits="pixels" yunits="pixels"/>
                </ScreenOverlay>
            </Folder>
          </kml>
    </xsl:template>

    <xsl:template match="element">
        <Placemark>
            <name>
                <h1><xsl:value-of select="primaryAdvisor/name" />@<xsl:value-of select="primaryPrincipal/position/organization/longName"/></h1>
            </name>
            <description>
            <xsl:text disable-output-escaping="yes">&lt;![CDATA[</xsl:text>
                <a> 
                    <xsl:attribute name="href">/reports/<xsl:value-of select="uuid" /></xsl:attribute>
                    Read full engagement report in ANET
                </a>
                <br/>
                <h2>Engagement Intent</h2>
                <xsl:value-of select="intent"/>
            <xsl:text disable-output-escaping="yes">]]&gt;</xsl:text>
            </description>
            <styleUrl>#icon</styleUrl> 
            <Point>
                <coordinates><xsl:value-of select="location/lng"/>,<xsl:value-of select="location/lat"/></coordinates>
            </Point>
        </Placemark>
    </xsl:template>

</xsl:stylesheet>
