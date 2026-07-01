package mil.dds.anet.services;

import java.time.Instant;
import microsoft.exchange.webservices.data.property.complex.FileAttachment;

public interface IMartTransmissionLogImporterService {
  void processTransmissionLog(FileAttachment attachment, Instant emailReceivedDate);
}
