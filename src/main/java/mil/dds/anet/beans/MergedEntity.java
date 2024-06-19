package mil.dds.anet.beans;

import java.time.Instant;

public record MergedEntity(String oldUuid, String newUuid, Instant mergeDate) {}
