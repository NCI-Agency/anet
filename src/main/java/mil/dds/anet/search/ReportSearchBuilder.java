package mil.dds.anet.search;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import mil.dds.anet.utils.DaoUtils;

public class ReportSearchBuilder {

	private static final String DEFAULT_WHERE_FORMAT = "reports.\"%s\" %s :%s";

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

	public ReportSearchBuilder(Map<String, Object> args, List<String> whereClauses) {
		this.args = args;
		this.whereClauses = whereClauses;
	}

	public void addDateClause(Instant queryDate, Comparison comp, String fieldName, String parameterName) {
		if (queryDate != null) {
			whereClauses.add(String.format(DEFAULT_WHERE_FORMAT, fieldName, comp.getOperator(), parameterName));
			DaoUtils.addInstantAsLocalDateTime(args, parameterName, queryDate);
		}
	}
}
