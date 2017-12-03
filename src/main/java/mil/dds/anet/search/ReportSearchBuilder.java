package mil.dds.anet.search;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormatter;

import mil.dds.anet.utils.Utils;

public class ReportSearchBuilder {

	private static final String DEFAULT_WHERE_FORMAT = "reports.\"%s\" %s :%s";

	private String whereClauseFormat;
	private DateTimeFormatter dateFormatter;
	private Map<String, Object> args = new HashMap<>();
	private List<String> whereClauses = new ArrayList<>();

	public enum Comparison {
		AFTER(">="), BEFORE("<=");
		private String op;
		private Comparison(String op) {
			this.op = op;
		}

		public String getOperator() {
			return op;
		}
	}

	public ReportSearchBuilder(Map<String, Object> args, List<String> whereClauses, String whereClauseFormat,
			DateTimeFormatter dateFormatter) {
		this.args = args;
		this.whereClauses = whereClauses;
		if (null != whereClauseFormat) {
			this.whereClauseFormat = DEFAULT_WHERE_FORMAT;
		}
		this.dateFormatter = dateFormatter;
	}

	public ReportSearchBuilder(Map<String, Object> args, List<String> whereClauses) {
		this(args, whereClauses, null, null);
	}

	public void addDateClause(DateTime queryDate, Comparison comp, String fieldName, String parameterName) {
		if (queryDate != null) {
			DateTime realQueryDate = Utils.handleRelativeDate(queryDate);
			String whereClause = String.format(whereClauseFormat, fieldName, comp.getOperator(), parameterName);
			whereClauses.add(whereClause);
			args.put(parameterName, dateFormatter == null ? realQueryDate : dateFormatter.print(queryDate));
		}
	}
}
