package mil.dds.anet.database;

import java.util.List;

import mil.dds.anet.beans.lists.AnetBeanList;

public interface IAnetDao<T> {

	public AnetBeanList<?> getAll(int pageNum, int pageSize);
	
	public T getById(int id);

	public List<T> getByIds(List<Integer> ids);
	
	public T insert(T obj);
	
	public int update(T obj);
}
