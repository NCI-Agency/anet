package mil.dds.anet.graphql.outputtransformers;

import com.itextpdf.io.font.FontConstants;
import com.itextpdf.kernel.color.Color;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.AreaBreak;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Text;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.lang.invoke.MethodHandles;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.function.Function;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.StreamingOutput;
import liquibase.repackaged.org.apache.commons.lang3.exception.ExceptionUtils;
import mil.dds.anet.AnetObjectEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
// import mil.dds.anet.config.AnetConfiguration;

public class JsonToPdfTransformer implements Function<Map<String, Object>, StreamingOutput> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  // private static final String RESULT_KEY_DATA = "data";

  // private final AnetConfiguration config;

  // public JsonToPdfTransformer(final AnetConfiguration config) {
  // this.config = config;
  // }

  public JsonToPdfTransformer() {}

  @Override
  public StreamingOutput apply(final Map<String, Object> json) {
    return new PDFStreamingOutput(createPdf(json));
  }

  public static byte[] createPdf(Map<String, Object> resultMap) {

    ByteArrayOutputStream baos = new ByteArrayOutputStream();

    for (Entry<String, Object> entry : resultMap.entrySet()) {
      if (entry.getValue() instanceof Map<?, ?>) {
        prepareData(baos, (Map<?, ?>) entry.getValue());
      }
    }

    return baos.toByteArray();
  }

  public static void prepareData(final ByteArrayOutputStream baos, final Map<?, ?> data) {

    PdfDocument pdfDoc = new PdfDocument(new PdfWriter(baos));
    Document doc = new Document(pdfDoc);
    doc.setFontColor(Color.BLACK);
    try {
      doc.setFont(PdfFontFactory.createFont(FontConstants.HELVETICA));
    } catch (IOException e) {
      e.printStackTrace();
    }
    doc.setFontSize(10);

    Map<?, ?> reports = (Map<?, ?>) data.get("reports");
    List<?> list = (List<?>) reports.get("list");

    for (int i = 0; i < list.size(); i++) {
      writePdfDocument(doc, (Map<?, ?>) list.get(i));
    }
    doc.close();
  }

  public static void writePdfDocument(final Document doc, Map<?, ?> report) {
    for (Entry<?, ?> entry : report.entrySet()) {
      /**
       * TODO: It makes unnecessary if checks for title. Put 'uuid' inside title and don't check it
       * in every single for iteration.
       */
      if (entry.getKey().toString().equals("uuid")) {
        Text title = new Text("REPORT " + entry.getValue().toString());
        title.setBold();
        Paragraph titlePrg = new Paragraph(title);
        doc.add(titlePrg);
      } else {
        String labelToShow = mapDictionaryLabels(entry.getKey().toString());
        Text label = new Text(labelToShow);
        label.setBold();
        Paragraph labelPrg = new Paragraph(label);
        doc.add(labelPrg);

        Text value;
        if (entry.getValue() != null) {
          value = new Text(entry.getValue().toString());
        } else {
          value = new Text("N/A");
        }
        Paragraph valuePrg = new Paragraph(value);
        doc.add(valuePrg);
      }
    }

    AreaBreak pageBreak = new AreaBreak();
    doc.add(pageBreak);
  }

  public static String mapDictionaryLabels(final String initialLabel) {

    final Map<?, ?> dictionary = AnetObjectEngine.getConfiguration().getDictionary();

    Map<?, ?> reportDictionary = (Map<?, ?>) ((Map<?, ?>) dictionary.get("fields")).get("report");

    if (initialLabel.equals("intent")) {
      return reportDictionary.get("intent").toString();
    }

    /** TODO: Logic structure can be improved. */
    /**
     * TODO: Labels in camel case format should be separated by white space. Use REGEX.
     */
    if (reportDictionary.get(initialLabel) == null) {
      String firstLetter = initialLabel.substring(0, 1);
      String remainingLetters = initialLabel.substring(1);
      firstLetter = firstLetter.toUpperCase();
      String firstLetterCapitalized = firstLetter + remainingLetters;
      return firstLetterCapitalized;
    } else if (reportDictionary.get(initialLabel) instanceof Map<?, ?>) {
      if (((Map<?, ?>) reportDictionary.get(initialLabel)).containsKey("label")) {
        return ((Map<?, ?>) reportDictionary.get(initialLabel)).get("label").toString();
      } else {
        String firstLetter = initialLabel.substring(0, 1);
        String remainingLetters = initialLabel.substring(1);
        firstLetter = firstLetter.toUpperCase();
        String firstLetterCapitalized = firstLetter + remainingLetters;
        return firstLetterCapitalized;
      }
    } else {
      return reportDictionary.get(initialLabel).toString();
    }
  }

  public static class PDFStreamingOutput implements StreamingOutput {

    private final byte[] pdfDocument;

    public PDFStreamingOutput(final byte[] pdfDocument) {
      this.pdfDocument = pdfDocument;
    }

    @Override
    public void write(final OutputStream output) throws IOException, WebApplicationException {
      try {
        output.write(pdfDocument);
      } catch (Exception e) {
        final Throwable rootCause = ExceptionUtils.getRootCause(e);
        logger.error("Error writing PDF", rootCause == null ? e : rootCause);
      }
    }
  }

}
