package mil.dds.anet.resources;

import com.codahale.metrics.MetricRegistry;
import com.codahale.metrics.annotation.Timed;
import com.github.underscore.lodash.$;
import com.google.common.base.Joiner;
import graphql.ExceptionWhileDataFetching;
import graphql.ExecutionInput;
import graphql.ExecutionResult;
import graphql.GraphQL;
import graphql.GraphQLError;
import graphql.schema.GraphQLSchema;
import io.dropwizard.auth.Auth;
import io.leangen.graphql.GraphQLSchemaGenerator;
import io.leangen.graphql.generator.mapping.common.ScalarMapper;
import java.io.IOException;
import java.io.OutputStream;
import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import javax.annotation.security.PermitAll;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.core.StreamingOutput;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.graphql.DateTimeMapper;
import mil.dds.anet.utils.BatchingUtils;
import mil.dds.anet.utils.ResponseUtils;
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
import org.dataloader.DataLoaderRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Path("/graphql")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class GraphQLResource {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  private static final String OUTPUT_JSON = "json";
  private static final String OUTPUT_XML = "xml";
  private static final String OUTPUT_XLSX = "xlsx";
  private static final String MEDIATYPE_XLSX =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  private static final String RESULT_KEY_DATA = "data";

  private final AnetObjectEngine engine;
  private final AnetConfiguration config;
  private final List<Object> resources;
  private final boolean developmentMode;
  private final MetricRegistry metricRegistry;

  private GraphQLSchema graphqlSchema;

  public GraphQLResource(AnetObjectEngine engine, AnetConfiguration config, List<Object> resources,
      MetricRegistry metricRegistry, boolean developmentMode) {
    this.engine = engine;
    this.config = config;
    this.resources = resources;
    this.metricRegistry = metricRegistry;
    this.developmentMode = developmentMode;

    buildGraph();
  }

  /**
   * Constructs the GraphQL "Graph" of ANET. 1) Scans all Resources to find methods it can use as
   * graph entry points. These should all be annotated with @GraphQLFetcher 2) For each of the types
   * that the Resource can return, scans those to find methods annotated with GraphQLFetcher
   */
  private void buildGraph() {
    final GraphQLSchemaGenerator schemaBuilder =
        new GraphQLSchemaGenerator().withBasePackages("mil.dds.anet").withTypeMappers(
            (config, defaults) -> defaults.insertBefore(ScalarMapper.class, new DateTimeMapper()));
    for (final Object resource : resources) {
      schemaBuilder.withOperationsFromSingleton(resource);
    }

    graphqlSchema = schemaBuilder.generate();
  }

  @POST
  @Timed
  @Produces({MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML, MEDIATYPE_XLSX})
  public Response graphqlPost(@Auth Person user, Map<String, Object> body) {
    String query = (String) body.get("query");
    String output = (String) body.get("output");

    if (output == null) {
      output = OUTPUT_JSON;
    }

    @SuppressWarnings("unchecked")
    Map<String, Object> variables = (Map<String, Object>) body.get("variables");
    if (variables == null) {
      variables = new HashMap<String, Object>();
    }

    return graphql(user, query, output, variables);
  }

  @GET
  @Timed
  @Produces({MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML, MEDIATYPE_XLSX})
  public Response graphqlGet(@Auth Person user, @QueryParam("query") String query,
      @DefaultValue(OUTPUT_JSON) @QueryParam("output") String output) {
    return graphql(user, query, output, new HashMap<String, Object>());
  }

  protected Response graphql(@Auth Person user, String query, String output,
      Map<String, Object> variables) {
    if (developmentMode) {
      buildGraph();
    }

    final ExecutionResult executionResult = dispatchRequest(user, query, variables);
    final Map<String, Object> result = executionResult.toSpecification();
    if (executionResult.getErrors().size() > 0) {
      WebApplicationException actual = null;
      for (GraphQLError error : executionResult.getErrors()) {
        if (error instanceof ExceptionWhileDataFetching) {
          ExceptionWhileDataFetching exception = (ExceptionWhileDataFetching) error;
          if (exception.getException() instanceof WebApplicationException) {
            actual = (WebApplicationException) exception.getException();
            break;
          }
        }
      }

      Status status = (actual != null) ? Status.fromStatusCode(actual.getResponse().getStatus())
          : Status.INTERNAL_SERVER_ERROR;
      logger.warn("Errors: {}", executionResult.getErrors());
      return Response.status(status).entity(result).build();
    }
    if (OUTPUT_XML.equals(output)) {
      // TODO: Decide if we indeed want pretty-printed XML:
      final String xml = ResponseUtils.toPrettyString($.toXml(result), 2);
      return Response.ok(xml, MediaType.APPLICATION_XML).build();
    } else if (OUTPUT_XLSX.equals(output)) {
      return Response.ok(new XSSFWorkbookStreamingOutput(createWorkbook(result)), MEDIATYPE_XLSX)
          .header("Content-Disposition", "attachment; filename=" + "anet_export.xslx").build();
    } else {
      return Response.ok(result, MediaType.APPLICATION_JSON).build();
    }
  }

  private ExecutionResult dispatchRequest(Person user, String query,
      Map<String, Object> variables) {
    final DataLoaderRegistry dataLoaderRegistry =
        BatchingUtils.registerDataLoaders(engine, true, true);
    final Map<String, Object> context = new HashMap<>();
    context.put("user", user);
    context.put("dataLoaderRegistry", dataLoaderRegistry);
    final ExecutionInput executionInput = ExecutionInput.newExecutionInput().query(query)
        .dataLoaderRegistry(dataLoaderRegistry).context(context).variables(variables).build();

    final GraphQL graphql = GraphQL.newGraphQL(graphqlSchema)
        // .instrumentation(new DataLoaderDispatcherInstrumentation()) — use our own dispatcher
        // instead
        .build();
    final CompletableFuture<ExecutionResult> request = graphql.executeAsync(executionInput);
    final Runnable dispatcher = () -> {
      while (!request.isDone()) {
        // Wait a while, giving other threads the chance to do some work
        try {
          Thread.yield();
          Thread.sleep(25);
        } catch (InterruptedException ignored) {
        }

        // Dispatch all our data loaders until the request is done;
        // we have data loaders at various depths (one dependent on another),
        // e.g. in {@link Report#loadWorkflow}
        final CompletableFuture<?>[] dispatchersWithWork = dataLoaderRegistry.getDataLoaders()
            .stream().filter(dl -> dl.dispatchDepth() > 0)
            .map(dl -> (CompletableFuture<?>) dl.dispatch()).toArray(CompletableFuture<?>[]::new);
        if (dispatchersWithWork.length > 0) {
          CompletableFuture.allOf(dispatchersWithWork).join();
        }
      }
    };
    dispatcher.run();
    try {
      return request.get();
    } catch (InterruptedException | ExecutionException e) {
      throw new WebApplicationException("failed to complete graphql request", e);
    } finally {
      BatchingUtils.updateStats(metricRegistry, dataLoaderRegistry);
    }
  }

  /**
   * Converts the supplied result object to a {@link XSSFWorkbook}.
   * 
   * @param result the result
   * @return the workbook
   */
  private XSSFWorkbook createWorkbook(final Map<String, Object> resultMap) {

    XSSFWorkbook workbook = new XSSFWorkbook();

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
   * Create the sheet with the supplied name in the supplied workbook using the supplied data. TODO:
   * This should end up in a converter type class, perhaps lookup by annotations.
   *
   * @param workbook the workbook
   * @param name the name for the sheet
   * @param data the data used to populate the sheet
   */
  private void createSheet(final XSSFWorkbook workbook, final String name, final Map<?, ?> data) {

    XSSFSheet sheet = workbook.createSheet(name);

    sheet.setDefaultColumnWidth(30);

    XSSFFont headerFont = workbook.createFont();
    headerFont.setFontHeightInPoints((short) 10);
    headerFont.setFontName("Arial");
    headerFont.setColor(IndexedColors.WHITE.getIndex());
    headerFont.setBold(true);
    headerFont.setItalic(false);

    CellStyle headerStyle = workbook.createCellStyle();
    headerStyle.setFillBackgroundColor(IndexedColors.BLACK.getIndex());
    headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
    headerStyle.setAlignment(HorizontalAlignment.CENTER);
    headerStyle.setFont(headerFont);

    final CellStyle dateStyle = workbook.createCellStyle();
    final CreationHelper createHelper = workbook.getCreationHelper();
    final short dateFormat = createHelper.createDataFormat()
        .getFormat((String) config.getDictionaryEntry("dateFormats.excel"));
    dateStyle.setDataFormat(dateFormat);

    XSSFRow header = sheet.createRow(0);
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
  private void createRow(final XSSFSheet sheet, final XSSFRow header, final CellStyle dateStyle,
      final List<?> data) {

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
  private void createColumns(final XSSFRow header, final XSSFRow row, final CellStyle dateStyle,
      final Map<?, ?> data) {

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

  private Object getValueRepr(Object value) {
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
      return Instant.ofEpochMilli((Long) value);
    } else if (value instanceof Number) {
      return (Number) value;
    } else {
      return String.valueOf(value);
    }
  }

  private Object getListValueAsString(List<?> value) {
    final List<String> entriesAsString = new ArrayList<>();
    for (final Object entry : value) {
      final Object repr = getValueRepr(entry);
      entriesAsString.add(repr == null ? null : String.valueOf(repr));
    }
    final String result = Joiner.on("; ").skipNulls().join(entriesAsString);
    return Utils.isEmptyOrNull(result) ? "" : "[" + result + "]";
  }

  private String getMapValueAsString(Map<?, ?> value) {
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
  public static class XSSFWorkbookStreamingOutput implements StreamingOutput {

    private final XSSFWorkbook workbook;

    /**
     * Creates an instance of this class using the supplied workbook.
     * 
     * @param workbook the workbook
     */
    public XSSFWorkbookStreamingOutput(final XSSFWorkbook workbook) {
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
