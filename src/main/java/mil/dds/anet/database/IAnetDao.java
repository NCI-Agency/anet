package mil.dds.anet.database;

import java.util.List;
import mil.dds.anet.beans.lists.AnetBeanList;

public interface IAnetDao<T> {

  public AnetBeanList<?> getAll(int pageNum, int pageSize);

  public T getByUuid(String uuid);

  public List<T> getByIds(List<String> uuids);

  public T insert(T obj);

  public T insertInternal(T obj);

  public int update(T obj);

  public int updateInternal(T obj);

  public int delete(String uuid);

  public int deleteInternal(String uuid);
}
