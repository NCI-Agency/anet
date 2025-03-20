package mil.dds.anet.threads.mart.services;

import microsoft.exchange.webservices.data.property.complex.FileAttachment;

public interface IMartTransmissionLogImporterService {
  void processTransmissionLog(FileAttachment attachment);
}
