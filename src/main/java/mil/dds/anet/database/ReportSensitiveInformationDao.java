package mil.dds.anet.database;

import java.util.List;
import java.util.Map;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.sqlobject.customizers.RegisterMapper;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.beans.lists.AbstractAnetBeanList;
import mil.dds.anet.database.mappers.ReportSensitiveInformationMapper;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;

@RegisterMapper(ReportSensitiveInformationMapper.class)
public class ReportSensitiveInformationDao implements IAnetDao<ReportSensitiveInformation> {

	private static final String[] fields = { "uuid", "text", "reportUuid", "createdAt", "updatedAt" };
	private static final String tableName = "reportsSensitiveInformation";
	public static final String REPORTS_SENSITIVE_INFORMATION_FIELDS = DaoUtils.buildFieldAliases(tableName, fields, true);

	private Handle dbHandle;

	public ReportSensitiveInformationDao(Handle h) {
		this.dbHandle = h;
	}

	public AbstractAnetBeanList<?> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}

	public ReportSensitiveInformation getByUuid(String uuid) {
		throw new UnsupportedOperationException();
	}

	public ReportSensitiveInformation insert(ReportSensitiveInformation rsi) {
		throw new UnsupportedOperationException();
	}

	public ReportSensitiveInformation insert(ReportSensitiveInformation rsi, Person user, Report report) {
		if (rsi == null || !isAuthorized(user, report)) {
			return null;
		}
		rsi.setReportUuid(report.getUuid());
		DaoUtils.setInsertFields(rsi);
		dbHandle.createStatement(
				"/* insertReportsSensitiveInformation */ INSERT INTO \"" + tableName + "\" "
					+ " (uuid, text, \"reportUuid\", \"createdAt\", \"updatedAt\") "
					+ "VALUES (:uuid, :text, :reportUuid, :createdAt, :updatedAt)")
				.bindFromProperties(rsi)
				.execute();
		AnetAuditLogger.log("ReportSensitiveInformation {} created by {} ", rsi, user);
		return rsi;
	}

	public int update(ReportSensitiveInformation rsi) {
		throw new UnsupportedOperationException();
	}

	public int update(ReportSensitiveInformation rsi, Person user, Report report) {
		if (rsi == null || !isAuthorized(user, report)) {
			return 0;
		}
		// Update relevant fields, but do not allow the reportUuid to be updated by the query!
		rsi.setReportUuid(report.getUuid());
		DaoUtils.setUpdateFields(rsi);
		final int numRows = dbHandle.createStatement(
				"/* updateReportsSensitiveInformation */ UPDATE \"" + tableName + "\""
					+ " SET text = :text, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
				.bindFromProperties(rsi)
				.execute();
		AnetAuditLogger.log("ReportSensitiveInformation {} updated by {} ", rsi, user);
		return numRows;
	}

	public Object insertOrUpdate(ReportSensitiveInformation rsi, Person user, Report report) {
		return (DaoUtils.getUuid(rsi) == null)
				? insert(rsi, user, report)
				: update(rsi, user, report);
	}

	public ReportSensitiveInformation getForReport(Report report, Person user) {
		if (!isAuthorized(user, report)) {
			return null;
		}
		final Query<ReportSensitiveInformation> query = dbHandle.createQuery(
				"/* getReportSensitiveInformationByReportUuid */ SELECT " + REPORTS_SENSITIVE_INFORMATION_FIELDS
					+ " FROM \"" + tableName + "\""
					+ " WHERE \"reportUuid\" = :reportUuid")
			.bind("reportUuid", report.getUuid())
			.map(new ReportSensitiveInformationMapper());
		final List<ReportSensitiveInformation> results = query.list();
		ReportSensitiveInformation rsi = (results.size() == 0) ? null : results.get(0);
		if (rsi != null) {
			AnetAuditLogger.log("ReportSensitiveInformation {} retrieved by {} ", rsi, user);
		} else {
			rsi = new ReportSensitiveInformation();
			rsi.setReportUuid(report.getUuid());
		}
		return rsi;
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
		final String userUuid = DaoUtils.getUuid(user);
		final String reportUuid = DaoUtils.getUuid(report);
		if (userUuid == null || reportUuid == null) {
			// No user or no report
			return false;
		}

		// Check authorization in a single query
		final Query<Map<String, Object>> query = dbHandle.createQuery(
				"/* checkReportAuthorization */ SELECT r.uuid"
					+ " FROM reports r"
					+ " LEFT JOIN \"reportAuthorizationGroups\" rag ON rag.\"reportUuid\" = r.uuid"
					+ " LEFT JOIN \"authorizationGroupPositions\" agp ON agp.\"authorizationGroupUuid\" = rag.\"authorizationGroupUuid\" "
					+ " LEFT JOIN positions p ON p.uuid = agp.\"positionUuid\" "
					+ " WHERE r.uuid = :reportUuid"
					+ " AND ("
					+ "   (r.\"authorUuid\" = :userUuid)"
					+ "   OR"
					+ "   (p.\"currentPersonUuid\" = :userUuid)"
					+ " )")
			.bind("reportUuid", reportUuid)
			.bind("userUuid", userUuid);
		return (query.list().size() > 0);
	}

}
