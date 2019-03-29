package mil.dds.anet.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayInputStream;
import java.io.StringWriter;
import java.lang.invoke.MethodHandles;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

public class ResponseUtils {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static ObjectMapper mapper = new ObjectMapper();

  public static Response withMsg(String msg, Status status) {
    Map<String, Object> entity = new HashMap<String, Object>();
    entity.put("msg", msg);
    entity.put("status", status.getStatusCode());
    return Response.status(status).entity(entity).build();
  }

  /*
   * Tries to convert the parameters in an httpRequest into bean.
   * 
   * @throws IllegalArgumentException if conversion fails. see {ObjectMapper.convertValue}
   */
  public static <T> T convertParamsToBean(HttpServletRequest request, Class<T> beanClazz)
      throws IllegalArgumentException {
    Map<String, String[]> paramsRaw = request.getParameterMap();
    Map<String, String> params = new HashMap<String, String>();
    for (Map.Entry<String, String[]> entry : paramsRaw.entrySet()) {
      params.put(entry.getKey(), entry.getValue()[0]);
    }
    return mapper.convertValue(params, beanClazz);
  }

  public static String toPrettyString(String xml, int indent) {
    try {
      // Turn XML string into a document
      Document document = DocumentBuilderFactory.newInstance().newDocumentBuilder()
          .parse(new InputSource(new ByteArrayInputStream(xml.getBytes("utf-8"))));

      // Remove whitespace outside tags
      document.normalize();
      XPath xPath = XPathFactory.newInstance().newXPath();
      NodeList nodeList = (NodeList) xPath.evaluate("//text()[normalize-space()='']", document,
          XPathConstants.NODESET);

      for (int i = 0; i < nodeList.getLength(); ++i) {
        Node node = nodeList.item(i);
        node.getParentNode().removeChild(node);
      }

      // Setup pretty print options
      TransformerFactory transformerFactory = TransformerFactory.newInstance();
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

  public static WebApplicationException handleSqlException(UnableToExecuteStatementException e,
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
        return new WebApplicationException(userMessage, Status.CONFLICT);
      }
    }
    logger.error("Unexpected SQL exception raised", e);
    return new WebApplicationException(Status.INTERNAL_SERVER_ERROR);
  }
}
