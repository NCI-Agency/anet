package mil.dds.anet.database;

import mil.dds.anet.beans.lists.AbstractAnetBeanList;

public interface IAnetDao<T> {

	public AbstractAnetBeanList<?> getAll(int pageNum, int pageSize);

	// TODO: At some point remove this method altogether
	@Deprecated
	public T getById(int id);

	public T getByUuid(String uuid);

	public T insert(T obj);
	
	public int update(T obj);
}
