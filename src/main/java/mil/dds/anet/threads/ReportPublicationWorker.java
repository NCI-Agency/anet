package mil.dds.anet.threads;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalAction;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;

public class ReportPublicationWorker implements Runnable {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	private final ReportDao dao;
	private final Integer nbOfHoursQuarantineApproved;
	private final Map<String, Object> context;

	public ReportPublicationWorker(ReportDao dao, AnetConfiguration config) {
		this.dao = dao;
		this.nbOfHoursQuarantineApproved = (Integer) config.getDictionaryEntry("reportWorkflow.nbOfHoursQuarantineApproved");
		this.context = AnetObjectEngine.getInstance().getContext();
	}

	@Override
	public void run() {
		logger.debug("Report Publication Worker waking up to check for reports to be published");
		try {
			runInternal();
		} catch (Throwable e) { 
			//Cannot let this thread die. Otherwise ANET will stop checking for reports which are to be published. 
			logger.error("Exception in run()", e);
		}
	}

	private void runInternal() {
		//Get a list of all APPROVED reports
		final ReportSearchQuery query = new ReportSearchQuery();
		query.setPageSize(Integer.MAX_VALUE);
		query.setState(Collections.singletonList(ReportState.APPROVED));
		final List<Report> reports = dao.search(query, null, true).getList();
		for (final Report r : reports) {
			final List<ApprovalAction> approvalStatus = r.loadApprovalStatus(context).join();
			if (approvalStatus.get(approvalStatus.size()-1).getCreatedAt().isBefore(Instant.now().atZone(DaoUtils.getDefaultZoneId()).minusHours(this.nbOfHoursQuarantineApproved).toInstant())) {
				//Publish the report
				try { 
					final int numRows = dao.publish(r, null);
					if (numRows == 0) {
						throw new WebApplicationException("Couldn't process report publication", Status.NOT_FOUND);
					}

					AnetAuditLogger.log("report {} automatically published by the ReportPublicationWorker", r.getUuid());

				} catch (Exception e) { 
					logger.error("Exception when publishing report", e);
				}
			}
		}
	}

}
