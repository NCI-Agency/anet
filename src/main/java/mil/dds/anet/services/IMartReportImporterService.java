package mil.dds.anet.services;

import java.util.List;
import microsoft.exchange.webservices.data.property.complex.FileAttachment;

public interface IMartReportImporterService {
  void processMartReport(String tenantName, List<FileAttachment> attachments);
}
