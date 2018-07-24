package mil.dds.anet.resources;

import java.io.IOException;
import java.io.OutputStream;
import java.lang.invoke.MethodHandles;
import java.lang.reflect.Method;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.stream.Collectors;

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
import org.joda.time.DateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.codahale.metrics.MetricRegistry;
import com.codahale.metrics.annotation.Timed;
import com.github.underscore.lodash.$;
import com.google.common.base.Joiner;

import graphql.ExceptionWhileDataFetching;
import graphql.ExecutionResult;
import graphql.GraphQL;
import graphql.GraphQLError;
import graphql.schema.GraphQLFieldDefinition;
import graphql.schema.GraphQLList;
import graphql.schema.GraphQLObjectType;
import graphql.schema.GraphQLOutputType;
import graphql.schema.GraphQLSchema;
import io.dropwizard.auth.Auth;
import mil.dds.anet.beans.ApprovalAction;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.beans.lists.AbstractAnetBeanList;
import mil.dds.anet.graphql.AnetResourceDataFetcher;
import mil.dds.anet.graphql.GraphQLFetcher;
import mil.dds.anet.graphql.GraphQLIgnore;
import mil.dds.anet.graphql.IGraphQLBean;
import mil.dds.anet.graphql.IGraphQLResource;
import mil.dds.anet.utils.GraphQLUtils;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.Utils;

@Path("/graphql")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class GraphQLResource {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
	private static final String OUTPUT_JSON = "json";
	private static final String OUTPUT_XML = "xml";
	private static final String OUTPUT_XLSX = "xlsx";
	private static final String MEDIATYPE_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
	private static final String RESULT_KEY_DATA = "data";
	private static final String RESULT_KEY_ERRORS = "errors";

	private GraphQL graphql;
	private List<IGraphQLResource> resources;
	private boolean developmentMode;
	private final MetricRegistry metricRegistry;

	public GraphQLResource(List<IGraphQLResource> resources, MetricRegistry metricRegistry, boolean developmentMode) {
		this.resources = resources;
		this.metricRegistry = metricRegistry;
		this.developmentMode = developmentMode;

		buildGraph();
	}

	/**
	 * Constructs the GraphQL "Graph" of ANET.
	 * 1) Scans all Resources to find methods it can use as graph entry points.
	 *     These should all be annotated with @GraphQLFetcher
	 * 2) For each of the types that the Resource can return, scans those to find methods annotated with
	 *     GraphQLFetcher
	 */
	private void buildGraph() {
		GraphQLObjectType.Builder queryTypeBuilder = GraphQLObjectType.newObject()
			.name("query")
			.description("The root level query type for ANET");

		//Go through all of the resources to build object types for each.
		for (IGraphQLResource resource : resources) {
			Class<? extends IGraphQLBean> beanClazz = resource.getBeanClass();
			String name = GraphQLUtils.lowerCaseFirstLetter(beanClazz.getSimpleName());
			GraphQLObjectType objectType = buildTypeFromBean(name, beanClazz);

			//Build a Fetcher that uses this resource to 'find' objects of this type.
			AnetResourceDataFetcher fetcher = new AnetResourceDataFetcher(resource, metricRegistry);

			GraphQLFieldDefinition.Builder fieldBuilder = GraphQLFieldDefinition.newFieldDefinition()
				.type(objectType)
				.name(name)
				.description(resource.getDescription())
				.argument(fetcher.validArguments())
				.dataFetcher(fetcher);
			queryTypeBuilder.field(fieldBuilder.build());

			//Build a field for returning lists from this resource.
			AnetResourceDataFetcher listFetcher = new AnetResourceDataFetcher(resource, metricRegistry, true);
			if (listFetcher.validArguments().size() > 0) {
				Class<?> listClass = resource.getBeanListClass();
				GraphQLOutputType listType;
				String listName;
				if (List.class.isAssignableFrom(listClass)) {
					listName = name + "s";
					listType = new GraphQLList(objectType);
				} else if (AbstractAnetBeanList.class.isAssignableFrom(listClass)) {
					listName = GraphQLUtils.lowerCaseFirstLetter(listClass.getSimpleName());
					listType = buildTypeFromBean(listName, (Class<AbstractAnetBeanList>) listClass);
				} else {
					throw new IllegalArgumentException("List Class from resource " + name + " is not a List or AbstractAnetBeanList");
				}
				GraphQLFieldDefinition listField = GraphQLFieldDefinition.newFieldDefinition()
					.type(listType)
					.name(listName)
					.argument(listFetcher.validArguments())
					.dataFetcher(listFetcher)
					.build();
				queryTypeBuilder.field(listField);
			}
		}

		//TODO: find a way to not have to do this.
		queryTypeBuilder.field(GraphQLFieldDefinition.newFieldDefinition()
				.type(buildTypeFromBean("reportPerson", ReportPerson.class))
				.name("reportPerson")
				.build());
		queryTypeBuilder.field(GraphQLFieldDefinition.newFieldDefinition()
				.type(buildTypeFromBean("comment", Comment.class))
				.name("comment")
				.build());
		queryTypeBuilder.field(GraphQLFieldDefinition.newFieldDefinition()
				.type(buildTypeFromBean("approvalAction", ApprovalAction.class))
				.name("approvalAction")
				.build());
		queryTypeBuilder.field(GraphQLFieldDefinition.newFieldDefinition()
				.type(buildTypeFromBean("personPositionHistory", PersonPositionHistory.class))
				.name("personPositionHistory")
				.build());
		queryTypeBuilder.field(GraphQLFieldDefinition.newFieldDefinition()
				.type(buildTypeFromBean("reportSensitiveInformation", ReportSensitiveInformation.class))
				.name("reportSensitiveInformation")
				.build());

		GraphQLObjectType queryType = queryTypeBuilder.build();
		GraphQLSchema schmea = GraphQLSchema.newSchema()
			.query(queryType)
			.build();
		graphql = new GraphQL(schmea);
	}

	/**
	 * Constructs the GraphQL Type from a bean (ie Report, Person, Position...)
	 * Scans all 'getter' methods, and those annotated with @GraphQLFetcher
	 */
	private GraphQLObjectType buildTypeFromBean(String name, Class<? extends IGraphQLBean> beanClazz) {
		GraphQLObjectType.Builder builder = GraphQLObjectType.newObject()
			.name(name);

		//Find all of the methods to use as Fields. Either getters, or @GraphQLFetcher annotated
		//Get a set of all unique names.
		Map<String,Type> methodReturnTypes = new HashMap<String,Type>();
		for (Method m : beanClazz.getMethods()) {
			String methodName = null;
			if (m.isAnnotationPresent(GraphQLIgnore.class)) { continue; }
			if (m.getName().startsWith("get")) {
				if (m.getName().equalsIgnoreCase("getClass")) { continue; }
				methodName = GraphQLUtils.lowerCaseFirstLetter(m.getName().substring(3));
			} else if (m.getName().startsWith("is")) {
				methodName = GraphQLUtils.lowerCaseFirstLetter(m.getName().substring(2));
			} else if (m.isAnnotationPresent(GraphQLFetcher.class)) {
				methodName = m.getAnnotation(GraphQLFetcher.class).value();
			}

			if (methodName != null) {
				methodReturnTypes.put(methodName, m.getGenericReturnType());
			}
		}

		for (Map.Entry<String, Type> entry : methodReturnTypes.entrySet()) {
			String fieldName = entry.getKey();
			Type retType = entry.getValue();
			try {
				builder.field(GraphQLUtils.buildFieldWithArgs(fieldName, retType, beanClazz));
			} catch (Exception e) {
				throw new RuntimeException(String.format("Unable to build GraphQL field %s on bean %s, error was %s",
						fieldName, beanClazz.getName(), e.getMessage()), e);
			}
		}

		return builder.build();
	}

	@POST
	@Timed
	@Produces({MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML, MEDIATYPE_XLSX})
	public Response graphqlPost(@Auth Person user, Map<String,Object> body) {
		String query = (String) body.get("query");
		String output = (String) body.get("output");
		
		if (output == null) {
			output = OUTPUT_JSON;
		}

		@SuppressWarnings("unchecked")
		Map<String, Object> variables = (Map<String, Object>) body.get("variables");
		if (variables == null) { variables = new HashMap<String,Object>(); }

		return graphql(user, query, output, variables);
	}

	@GET
	@Timed
	@Produces({MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML, MEDIATYPE_XLSX})
	public Response graphqlGet(@Auth Person user,
			@QueryParam("query") String query,
			@DefaultValue(OUTPUT_JSON) @QueryParam("output") String output) {
		return graphql(user, query, output, new HashMap<String,Object>());
	}

	protected Response graphql(@Auth Person user, String query, String output, Map<String, Object> variables) {
		if (developmentMode) {
			buildGraph();
		}

		Map<String, Object> context = new HashMap<String,Object>();
		context.put("auth", user);

		ExecutionResult executionResult = graphql.execute(query, context, variables);
		Map<String, Object> result = new LinkedHashMap<>();
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

			result.put(RESULT_KEY_ERRORS, executionResult.getErrors().stream()
					.map(e -> e.getMessage())
					.collect(Collectors.toList()));
			Status status = (actual != null)
				?
				Status.fromStatusCode(actual.getResponse().getStatus())
				:
				Status.INTERNAL_SERVER_ERROR;
			logger.warn("Errors: {}", executionResult.getErrors());
			return Response.status(status).entity(result).build();
		}
		result.put(RESULT_KEY_DATA, executionResult.getData());
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
	
	/**
	 * Converts the supplied result object to a {@link XSSFWorkbook}.
	 * 
	 * @param result
	 *            the result
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
	 * @param workbook
	 *            the workbook
	 * @param name
	 *            the name of the collection
	 * @param data
	 *            the map to obtain the data from to populate the workbook
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
	 * Create the sheet with the supplied name in the supplied workbook using the
	 * supplied data.
	 * TODO: This should end up in a converter type class, perhaps lookup by annotations.
	 *
	 * @param workbook
	 *            the workbook
	 * @param name
	 *            the name for the sheet
	 * @param data
	 *            the data used to populate the sheet
	 */
	private void createSheet(final XSSFWorkbook workbook, final String name, final Map<?, ?> data) {

		XSSFSheet sheet = workbook.createSheet(name);
		
		sheet.setDefaultColumnWidth(30);
		
		XSSFFont headerFont = workbook.createFont();
		headerFont.setFontHeightInPoints((short)10);
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
		// TODO: Get the date format from the dictionary
		final short dateFormat = createHelper.createDataFormat().getFormat("dd MMM yyyy");
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
	 * @param sheet
	 *            the sheet
	 * @param header
	 *            the header row
	 * @param dateStyle
	 *            the style for date cells
	 * @param data
	 *            the data
	 */
	private void createRow(final XSSFSheet sheet, final XSSFRow header, final CellStyle dateStyle, final List<?> data) {
	
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
	 * @param header
	 *            the header row
	 * @param row
	 *            the row of data
	 * @param dateStyle
	 *            the style for date cells
	 * @param data
	 *            the data
	 */
	private void createColumns(final XSSFRow header, final XSSFRow row, final CellStyle dateStyle, final Map<?, ?> data) {

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
			// FIXME: For now, assume that this is really a DateTime in disguise!
			return new DateTime((Long) value).toDate();
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
			final Object repr = getValueRepr(entry.getValue());
			entriesAsString.add(repr == null ? "" : String.valueOf(repr));
		}
		return Joiner.on(", ").useForNull("").join(entriesAsString);
	}

	/**
	 * {@link StreamingOutput} implementation that uses a {@link XSSFWorkbook} as
	 * the source of the stream to be written.
	 */
	public static class XSSFWorkbookStreamingOutput implements StreamingOutput {

		private final XSSFWorkbook workbook;

		/**
		 * Creates an instance of this class using the supplied workbook.
		 * 
		 * @param workbook
		 *            the workbook
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
				logger.error("Error writing XSSFWorkbook", rootCause == null ? e.getMessage() : rootCause.getMessage());
			}
		}
	}
}
