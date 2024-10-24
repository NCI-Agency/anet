package mil.dds.anet.graphql.outputtransformers;

import java.io.InputStream;
import java.io.StringReader;
import java.io.StringWriter;
import java.lang.invoke.MethodHandles;
import java.util.function.UnaryOperator;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;
import mil.dds.anet.utils.ResponseUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class XsltXmlTransformer implements UnaryOperator<String> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private Transformer transformer;

  public XsltXmlTransformer(final InputStream stylesheetInputStream) {
    final TransformerFactory transformerFactory = ResponseUtils.getTransformerFactory();
    if (transformerFactory != null) {
      try {
        transformer = transformerFactory.newTransformer(new StreamSource(stylesheetInputStream));
      } catch (TransformerConfigurationException e) {
        logger.error("Error transforming stylesheet", e);
      }
    }
  }

  @Override
  public String apply(final String xml) {
    final StringWriter writer = new StringWriter();

    if (transformer != null) {
      try {
        final StreamSource inputXmlSource = new StreamSource(new StringReader(xml));
        transformer.transform(inputXmlSource, new StreamResult(writer));
      } catch (TransformerException e) {
        logger.error("Error transforming xml", e);
      }
    }

    return writer.toString();
  }
}
