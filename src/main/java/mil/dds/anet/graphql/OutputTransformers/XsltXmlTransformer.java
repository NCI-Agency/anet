package mil.dds.anet.graphql.OutputTransformers;

import java.io.InputStream;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.function.Function;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

public class XsltXmlTransformer implements Function<String, String> {

  private static final TransformerFactory transformerFactory = TransformerFactory.newInstance();

  private Transformer transformer;

  public XsltXmlTransformer(final InputStream stylesheetInputStream) {

    try {
      transformer = transformerFactory.newTransformer(new StreamSource(stylesheetInputStream));
    } catch (TransformerConfigurationException exception) {
      exception.printStackTrace();
    }
  }

  @Override
  public String apply(final String xml) {

    final StreamSource inputXmlSource = new StreamSource(new StringReader(xml));

    final StringWriter writer = new StringWriter();
    try {
      transformer.transform(inputXmlSource, new StreamResult(writer));
    } catch (TransformerException exception) {
      exception.printStackTrace();
    }

    return writer.toString();
  }
}
