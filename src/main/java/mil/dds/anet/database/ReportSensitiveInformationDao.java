package mil.dds.anet.database;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.sqlobject.Bind;
import org.skife.jdbi.v2.sqlobject.customizers.RegisterMapper;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.ReportSensitiveInformationMapper;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;

@RegisterMapper(ReportSensitiveInformationMapper.class)
public class ReportSensitiveInformationDao implements IAnetDao<ReportSensitiveInformation> {

	private static final String[] fields = { "id", "text", "reportId", "createdAt", "updatedAt" };
	private static final String tableName = "reportsSensitiveInformation";
	public static final String REPORTS_SENSITIVE_INFORMATION_FIELDS = DaoUtils.buildFieldAliases(tableName, fields);

	private Handle dbHandle;
	private final ForeignKeyBatcher<ReportSensitiveInformation> reportIdBatcher;

	public ReportSensitiveInformationDao(Handle h) {
		this.dbHandle = h;
		final String reportIdBatcherSql = "/* batch.getReportSensitiveInformationsByReportIds */ SELECT " + REPORTS_SENSITIVE_INFORMATION_FIELDS
				+ " FROM \"" + tableName + "\""
				+ " WHERE \"reportId\" IN ( %1$s )";
		this.reportIdBatcher = new ForeignKeyBatcher<ReportSensitiveInformation>(h, reportIdBatcherSql, new ReportSensitiveInformationMapper(), "reportsSensitiveInformation_reportId");
	}

	@Override
	public AnetBeanList<?> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}

	@Override
	public ReportSensitiveInformation getById(@Bind("id") int id) {
		throw new UnsupportedOperationException();
	}

	@Override
	public List<ReportSensitiveInformation> getByIds(List<Integer> reportIds) {
		throw new UnsupportedOperationException();
	}

	public List<List<ReportSensitiveInformation>> getReportSensitiveInformation(List<Integer> foreignKeys) {
		return reportIdBatcher.getByForeignKeys(foreignKeys);
	}

	@Override
	public ReportSensitiveInformation insert(ReportSensitiveInformation rsi) {
		throw new UnsupportedOperationException();
	}

	public ReportSensitiveInformation insert(ReportSensitiveInformation rsi, Person user, Report report) {
		if (rsi == null || !isAuthorized(user, report)) {
			return null;
		}
		rsi.setCreatedAt(DateTime.now());
		rsi.setUpdatedAt(DateTime.now());
		final GeneratedKeys<Map<String,Object>> keys = dbHandle.createStatement(
				"/* insertReportsSensitiveInformation */ INSERT INTO \"" + tableName + "\" "
					+ " (text, \"reportId\", \"createdAt\", \"updatedAt\") "
					+ "VALUES (:text, :reportId, :createdAt, :updatedAt)")
				.bind("text", rsi.getText())
				.bind("reportId", report.getId())
				.bind("createdAt", rsi.getCreatedAt())
				.bind("updatedAt", rsi.getUpdatedAt())
				.executeAndReturnGeneratedKeys();
		rsi.setId(DaoUtils.getGeneratedId(keys));
		AnetAuditLogger.log("ReportSensitiveInformation {} created by {} ", rsi, user);
		return rsi;
	}

	@Override
	public int update(ReportSensitiveInformation rsi) {
		throw new UnsupportedOperationException();
	}

	public int update(ReportSensitiveInformation rsi, Person user, Report report) {
		if (rsi == null || !isAuthorized(user, report)) {
			return 0;
		}
		// Update relevant fields, but do not allow the reportId to be updated by the query!
		rsi.setUpdatedAt(DateTime.now());
		final int numRows = dbHandle.createStatement(
				"/* updateReportsSensitiveInformation */ UPDATE \"" + tableName + "\""
					+ " SET text = :text, \"updatedAt\" = :updatedAt WHERE id = :id")
				.bind("id", rsi.getId())
				.bind("text", rsi.getText())
				.bind("updatedAt", rsi.getUpdatedAt())
				.execute();
		AnetAuditLogger.log("ReportSensitiveInformation {} updated by {} ", rsi, user);
		return numRows;
	}

	public Object insertOrUpdate(ReportSensitiveInformation rsi, Person user, Report report) {
		return (DaoUtils.getId(rsi) == null)
				? insert(rsi, user, report)
				: update(rsi, user, report);
	}

	public CompletableFuture<ReportSensitiveInformation> getForReport(Map<String, Object> context, Report report, Person user) {
		if (!isAuthorized(user, report)) {
			return CompletableFuture.supplyAsync(() -> null);
		}
		return new ForeignKeyFetcher<ReportSensitiveInformation>()
				.load(context, "report.reportSensitiveInformation", report.getId())
				.thenApply(l ->
		{
			ReportSensitiveInformation rsi = Utils.isEmptyOrNull(l) ? null : l.get(0);
			if (rsi != null) {
				AnetAuditLogger.log("ReportSensitiveInformation {} retrieved by {} ", rsi, user);
			} else {
				rsi = new ReportSensitiveInformation();
			}
			return rsi;
		});
	}

	/**
	 * A user is allowed to access a report's sensitive information if either of the following holds true:
	 * • the user is the author of the report;
	 * • the user is in an authorization group for the report.
	 *
	 * @param user the user executing the request
	 * @param report the report
	 * @return true if the user is allowed to access the report's sensitive information
	 */
	private boolean isAuthorized(Person user, Report report) {
		final Integer userId = DaoUtils.getId(user);
		final Integer reportId = DaoUtils.getId(report);
		if (userId == null || reportId == null) {
			// No user or no report
			return false;
		}

		// Check authorization in a single query
		final Query<Map<String, Object>> query = dbHandle.createQuery(
				"/* checkReportAuthorization */ SELECT r.id"
					+ " FROM reports r"
					+ " LEFT JOIN \"reportAuthorizationGroups\" rag ON rag.\"reportId\" = r.id"
					+ " LEFT JOIN \"authorizationGroupPositions\" agp ON agp.\"authorizationGroupId\" = rag.\"authorizationGroupId\" "
					+ " LEFT JOIN positions p ON p.id = agp.\"positionId\" "
					+ " WHERE r.id = :reportId"
					+ " AND ("
					+ "   (r.\"authorId\" = :userId)"
					+ "   OR"
					+ "   (p.\"currentPersonId\" = :userId)"
					+ " )")
			.bind("reportId", reportId)
			.bind("userId", userId);
		return (query.list().size() > 0);
	}

}
