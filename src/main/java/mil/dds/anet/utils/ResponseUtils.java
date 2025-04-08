package mil.dds.anet.utils;

import com.google.common.net.HttpHeaders;
import jakarta.servlet.http.HttpServletRequest;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.lang.invoke.MethodHandles;
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

public class ResponseUtils {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String HTTP_SCHEME = "http";
  private static final int HTTP_DEFAULT_PORT = 80;
  private static final String HTTPS_SCHEME = "https";
  private static final int HTTPS_DEFAULT_PORT = 443;

  public static String getBaseUrl(String url) {
    if (url == null) {
      return "";
    }
    final UriComponents uriComponents = UriComponentsBuilder.fromUriString(url).build();
    final String scheme = uriComponents.getScheme();
    final int port = uriComponents.getPort();
    final String host = uriComponents.getHost();
    if (scheme == null || host == null) {
      return "";
    }
    return (port == -1 // no port in the request URL
        // or using the default port of the scheme
        || HTTP_SCHEME.equals(scheme) && HTTP_DEFAULT_PORT == port
        || HTTPS_SCHEME.equals(scheme) && HTTPS_DEFAULT_PORT == port)
            ? String.format("%s://%s", scheme, host)
            : String.format("%s://%s:%s", scheme, host, port);
  }

  /**
   * Source:
   * https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html#transformerfactory
   *
   * @return a TransformerFactory that is safe from XXE attacks
   */
  public static final TransformerFactory getTransformerFactory() {
    String feature = null;
    try {
      final TransformerFactory transformerFactory = TransformerFactory.newInstance();
      feature = XMLConstants.FEATURE_SECURE_PROCESSING;
      transformerFactory.setFeature(feature, true);
      transformerFactory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
      transformerFactory.setAttribute(XMLConstants.ACCESS_EXTERNAL_STYLESHEET, "");
      return transformerFactory;
    } catch (TransformerConfigurationException e) {
      // This should catch a failed setFeature feature
      logger.warn("TransformerConfigurationException was thrown."
          + " The feature '{}' is probably not supported by your XML processor.", feature);
    }
    return null;
  }

  /**
   * Create a DocumentBuilderFactory that is safe from XXE attacks, and return the parsed input.
   * Source:
   * https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html#jaxp-documentbuilderfactory-saxparserfactory-and-dom4j
   *
   * @param input the input to parse
   *
   * @return the parsed input
   */
  public static final Document parseDocument(InputSource input) {
    String feature = null;
    try {
      final DocumentBuilderFactory documentBuilderFactory = DocumentBuilderFactory.newInstance();

      // Some additional ones to the list from OWASP:
      feature = XMLConstants.FEATURE_SECURE_PROCESSING;
      documentBuilderFactory.setFeature(feature, true);
      documentBuilderFactory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
      documentBuilderFactory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");

      // This is the PRIMARY defense. If DTDs (doctypes) are disallowed, almost all
      // XML entity attacks are prevented
      // Xerces 2 only - http://xerces.apache.org/xerces2-j/features.html#disallow-doctype-decl
      feature = "http://apache.org/xml/features/disallow-doctype-decl";
      documentBuilderFactory.setFeature(feature, true);

      // If you can't completely disable DTDs, then at least do the following:
      // Xerces 1 - http://xerces.apache.org/xerces-j/features.html#external-general-entities
      // Xerces 2 - http://xerces.apache.org/xerces2-j/features.html#external-general-entities
      // JDK7+ - http://xml.org/sax/features/external-general-entities
      feature = "http://xml.org/sax/features/external-general-entities";
      documentBuilderFactory.setFeature(feature, false);

      // Xerces 1 - http://xerces.apache.org/xerces-j/features.html#external-parameter-entities
      // Xerces 2 - http://xerces.apache.org/xerces2-j/features.html#external-parameter-entities
      // JDK7+ - http://xml.org/sax/features/external-parameter-entities
      feature = "http://xml.org/sax/features/external-parameter-entities";
      documentBuilderFactory.setFeature(feature, false);

      // Disable external DTDs as well
      feature = "http://apache.org/xml/features/nonvalidating/load-external-dtd";
      documentBuilderFactory.setFeature(feature, false);

      // and these as well, per Timothy Morgan's 2014 paper: "XML Schema, DTD, and Entity Attacks"
      documentBuilderFactory.setXIncludeAware(false);
      documentBuilderFactory.setExpandEntityReferences(false);

      // And, per Timothy Morgan: "If for some reason support for inline DOCTYPEs are a requirement,
      // then ensure the entity settings are disabled (as shown above) and beware that SSRF attacks
      // (http://cwe.mitre.org/data/definitions/918.html) and denial of service attacks (such as
      // billion laughs or decompression bombs via "jar:") are a risk."

      final DocumentBuilder documentBuilder = documentBuilderFactory.newDocumentBuilder();
      return documentBuilder.parse(input);
    } catch (ParserConfigurationException e) {
      // This should catch a failed setFeature feature
      logger.warn("ParserConfigurationException was thrown."
          + " The feature '{}' is probably not supported by your XML processor.", feature);
    } catch (SAXException e) {
      // On Apache, this should be thrown when disallowing DOCTYPE
      logger.warn("A DOCTYPE was passed into the XML document");
    } catch (IOException e) {
      // XXE that points to a file that doesn't exist
      logger.error("IOException occurred, XXE may still possible", e);
    }
    return null;
  }

  public static String toPrettyString(String xml, int indent) {
    try {
      // Turn XML string into a document
      final Document document =
          parseDocument(new InputSource(new ByteArrayInputStream(xml.getBytes("utf-8"))));
      if (document == null) {
        return null;
      }

      // Remove whitespace outside tags
      document.normalize();
      XPath xpath = XPathFactory.newInstance().newXPath();
      NodeList nodeList = (NodeList) xpath.evaluate("//text()[normalize-space()='']", document,
          XPathConstants.NODESET);

      for (int i = 0; i < nodeList.getLength(); ++i) {
        Node node = nodeList.item(i);
        node.getParentNode().removeChild(node);
      }

      // Setup pretty print options
      final TransformerFactory transformerFactory = getTransformerFactory();
      if (transformerFactory == null) {
        return null;
      }
      transformerFactory.setAttribute("indent-number", indent);
      Transformer transformer = transformerFactory.newTransformer();
      transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
      // TODO: decide if we want this:
      // transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
      transformer.setOutputProperty(OutputKeys.INDENT, "yes");

      // Return pretty printed XML string
      StringWriter stringWriter = new StringWriter();
      transformer.transform(new DOMSource(document), new StreamResult(stringWriter));
      return stringWriter.toString();
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  public static ResponseStatusException handleSqlException(UnableToExecuteStatementException e,
      String userMessage) {
    // FIXME: Ugly way to handle unique index
    final Throwable cause = e.getCause();
    if (cause != null) {
      final String message = cause.getMessage();
      if (message != null
          && (message.contains(" duplicate ") || message.contains(" UNIQUE constraint "))) {
        logger.error("Duplicate found", e);
        logger.error("Caused by", cause);
        logger.error("With message: {}", message);
        return new ResponseStatusException(HttpStatus.CONFLICT, userMessage);
      }
    }
    logger.error("Unexpected SQL exception raised", e);
    return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
  }

  public static String getRemoteAddr(final HttpServletRequest request) {
    final String remoteAddr = request.getRemoteAddr();
    return remoteAddr == null ? "-" : remoteAddr;
  }

  public static boolean ignoreActivity(final HttpServletRequest request) {
    final String activityHeader = request.getHeader("x-activity");
    return "ignore".equals(activityHeader);
  }

  public static String getReferer(final HttpServletRequest request) {
    final String referer = request.getHeader(HttpHeaders.REFERER);
    return referer == null ? "-" : referer;
  }
}
