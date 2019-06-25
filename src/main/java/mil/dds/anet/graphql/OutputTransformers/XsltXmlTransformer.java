package mil.dds.anet.graphql.OutputTransformers;

import java.io.InputStream;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.function.Function;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

public class XsltXmlTransformer implements Function<String, String> {

  static DocumentBuilderFactory documentFactory = DocumentBuilderFactory.newInstance();
  static TransformerFactory transformerFactory = TransformerFactory.newInstance();

  private Transformer transformer;

  public XsltXmlTransformer(InputStream stylesheetInputStream) {

    try {
      transformer = transformerFactory.newTransformer(new StreamSource(stylesheetInputStream));
    } catch (TransformerConfigurationException e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    }
  }

  @Override
  public String apply(String xml) {

    StreamSource inputXmlSource = new StreamSource(new StringReader(xml));


    StringWriter writer = new StringWriter();
    try {
      transformer.transform(inputXmlSource, new StreamResult(writer));
    } catch (TransformerException exception) {
      System.out.println(exception);
    }

    return writer.toString();
  }
}
