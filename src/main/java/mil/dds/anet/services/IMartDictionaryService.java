package mil.dds.anet.services;

import java.util.Map;

public interface IMartDictionaryService {
  /**
   * Exports certain data from ANET into a dictionary to be used by MART
   *
   * @return the dictionary for MART
   */
  Map<String, Object> createDictionaryForMart();
}
