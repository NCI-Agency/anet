package mil.dds.anet.test.resources.utils;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;

public final class PositionHistoryDao {
  public List<PersonPositionHistory> getAllPositionHistoryByPerson(Person person) {
    final Map<String, Object> context = AnetObjectEngine.getInstance().getContext();
    return new ForeignKeyFetcher<PersonPositionHistory>()
        .load(context, FkDataLoaderKey.PERSON_PERSON_POSITION_HISTORY, person.getUuid())
        .thenApply(PositionHistoryDao::getHistory).join();
  }

  public List<PersonPositionHistory> getAllPositionHistoryByPosition(Position position) {
    final Map<String, Object> context = AnetObjectEngine.getInstance().getContext();
    return new ForeignKeyFetcher<PersonPositionHistory>()
        .load(context, FkDataLoaderKey.POSITION_PERSON_POSITION_HISTORY, position.getUuid())
        .thenApply(PositionHistoryDao::getHistory).join();
  }

  private static List<PersonPositionHistory> getHistory(List<PersonPositionHistory> history) {
    return history.stream().filter(Objects::nonNull).collect(Collectors.toList());
  }
}
