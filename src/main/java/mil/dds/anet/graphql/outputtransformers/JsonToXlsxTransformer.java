package mil.dds.anet.graphql.outputtransformers;

import com.google.common.base.Joiner;
import java.io.IOException;
import java.io.OutputStream;
import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.function.Function;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.StreamingOutput;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.utils.Utils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.xssf.usermodel.XSSFCell;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class JsonToXlsxTransformer implements Function<Map<String, Object>, StreamingOutput> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  private static final String RESULT_KEY_DATA = "data";

  private final AnetConfiguration config;

  public JsonToXlsxTransformer(final AnetConfiguration config) {
    this.config = config;
  }

  @Override
  public StreamingOutput apply(final Map<String, Object> json) {
    return new XssfWorkbookStreamingOutput(createWorkbook(json));
  }

  /**
   * Converts the supplied result object to a {@link XSSFWorkbook}.
   * 
   * @param result the result
   * @return the workbook
   */
  private XSSFWorkbook createWorkbook(final Map<String, Object> resultMap) {

    final XSSFWorkbook workbook = new XSSFWorkbook();

    for (Entry<String, Object> entry : resultMap.entrySet()) {
      if (entry.getValue() instanceof Map<?, ?>) {
        locateData(workbook, entry.getKey(), (Map<?, ?>) entry.getValue());
      }
    }

    return workbook;
  }

  /**
   * Locate the data in the map and create sheets in the workbook.
   * 
   * @param workbook the workbook
   * @param name the name of the collection
   * @param data the map to obtain the data from to populate the workbook
   */
  private void locateData(final XSSFWorkbook workbook, final String name, final Map<?, ?> data) {

    if (RESULT_KEY_DATA.equals(name)) {
      // Go through all data collections
      for (Entry<?, ?> entry : data.entrySet()) {
        if (entry.getValue() instanceof Map<?, ?>) {
          createSheet(workbook, String.valueOf(entry.getKey()), (Map<?, ?>) entry.getValue());
        }
      }
    } else {
      // Errors
      createSheet(workbook, name, data);
    }
  }

  /**
   * Create the sheet with the supplied name in the supplied workbook using the supplied data.
   *
   * TODO: This should end up in a converter type class, perhaps lookup by annotations.
   *
   * @param workbook the workbook
   * @param name the name for the sheet
   * @param data the data used to populate the sheet
   */
  private void createSheet(final XSSFWorkbook workbook, final String name, final Map<?, ?> data) {

    final XSSFSheet sheet = workbook.createSheet(name);

    sheet.setDefaultColumnWidth(30);

    final XSSFFont headerFont = workbook.createFont();
    headerFont.setFontHeightInPoints((short) 10);
    headerFont.setFontName("Arial");
    headerFont.setColor(IndexedColors.WHITE.getIndex());
    headerFont.setBold(true);
    headerFont.setItalic(false);

    final CellStyle headerStyle = workbook.createCellStyle();
    headerStyle.setFillBackgroundColor(IndexedColors.BLACK.getIndex());
    headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
    headerStyle.setAlignment(HorizontalAlignment.CENTER);
    headerStyle.setFont(headerFont);

    final CellStyle dateStyle = workbook.createCellStyle();
    final CreationHelper createHelper = workbook.getCreationHelper();
    final short dateFormat = createHelper.createDataFormat()
        .getFormat((String) config.getDictionaryEntry("dateFormats.excel"));
    dateStyle.setDataFormat(dateFormat);

    final XSSFRow header = sheet.createRow(0);
    header.setRowStyle(headerStyle);

    for (Entry<?, ?> entry : data.entrySet()) {
      if (entry.getValue() instanceof List<?>) {
        createRow(sheet, header, dateStyle, (List<?>) entry.getValue());
      }
    }
  }

  /**
   * Create a row in the supplied sheet using the supplied data.
   * 
   * @param sheet the sheet
   * @param header the header row
   * @param dateStyle the style for date cells
   * @param data the data
   */
  private static void createRow(final XSSFSheet sheet, final XSSFRow header,
      final CellStyle dateStyle, final List<?> data) {

    int rowCount = 1;

    for (Object value : data) {
      if (value instanceof Map<?, ?>) {
        createColumns(header, sheet.createRow(rowCount++), dateStyle, (Map<?, ?>) value);
      }
    }
  }

  /**
   * Create a column in a row of data.
   * 
   * @param header the header row
   * @param row the row of data
   * @param dateStyle the style for date cells
   * @param data the data
   */
  private static void createColumns(final XSSFRow header, final XSSFRow row,
      final CellStyle dateStyle, final Map<?, ?> data) {

    int column = 0;

    for (Entry<?, ?> entry : data.entrySet()) {
      if (header.getCell(column) == null) {
        final XSSFCell headerCell = header.createCell(column);
        headerCell.setCellValue(String.valueOf(entry.getKey()).toUpperCase());
        headerCell.setCellStyle(header.getRowStyle());
      }

      final XSSFCell cell = row.createCell(column);
      cell.setCellStyle(row.getRowStyle());

      final Object repr = getValueRepr(entry.getValue());
      if (repr != null) {
        if (repr instanceof Integer) {
          cell.setCellValue((Integer) repr);
        } else if (repr instanceof Date) {
          cell.setCellValue((Date) repr);
          cell.setCellStyle(dateStyle);
        } else if (repr instanceof Number) {
          cell.setCellValue(((Number) repr).doubleValue());
        } else {
          cell.setCellValue(String.valueOf(repr));
        }
      }

      column++;
    }
  }

  private static Object getValueRepr(final Object value) {
    if (value == null) {
      return null;
    } else if (value instanceof List) {
      return getListValueAsString((List<?>) value);
    } else if (value instanceof Map) {
      return getMapValueAsString((Map<?, ?>) value);
    } else if (value instanceof Integer) {
      return (Integer) value;
    } else if (value instanceof Long) {
      // FIXME: For now, assume that this is really an Instant in disguise!
      return Date.from(Instant.ofEpochMilli((Long) value));
    } else if (value instanceof Number) {
      return (Number) value;
    } else {
      return String.valueOf(value);
    }
  }

  private static Object getListValueAsString(final List<?> value) {
    final List<String> entriesAsString = new ArrayList<>();
    for (final Object entry : value) {
      final Object repr = getValueRepr(entry);
      entriesAsString.add(repr == null ? null : String.valueOf(repr));
    }
    final String result = Joiner.on("; ").skipNulls().join(entriesAsString);
    return Utils.isEmptyOrNull(result) ? "" : "[" + result + "]";
  }

  private static String getMapValueAsString(Map<?, ?> value) {
    final List<String> entriesAsString = new ArrayList<>();
    for (final Map.Entry<?, ?> entry : value.entrySet()) {
      // TODO: solve this in a more robust way
      if (!"uuid".equals(entry.getKey())) {
        final Object repr = getValueRepr(entry.getValue());
        entriesAsString.add(repr == null ? "" : String.valueOf(repr));
      }
    }
    return Joiner.on(", ").useForNull("").join(entriesAsString);
  }

  /**
   * {@link StreamingOutput} implementation that uses a {@link XSSFWorkbook} as the source of the
   * stream to be written.
   */
  public static class XssfWorkbookStreamingOutput implements StreamingOutput {

    private final XSSFWorkbook workbook;

    /**
     * Creates an instance of this class using the supplied workbook.
     * 
     * @param workbook the workbook
     */
    public XssfWorkbookStreamingOutput(final XSSFWorkbook workbook) {
      this.workbook = workbook;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void write(final OutputStream output) throws IOException, WebApplicationException {
      try {
        // TODO: The performance of this operation, specifically with large files, should be tested.
        workbook.write(output);
      } catch (Exception e) {
        final Throwable rootCause = ExceptionUtils.getRootCause(e);
        logger.error("Error writing XSSFWorkbook",
            rootCause == null ? e.getMessage() : rootCause.getMessage());
      }
    }
  }

}
