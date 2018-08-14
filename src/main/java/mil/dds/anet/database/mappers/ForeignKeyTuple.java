package mil.dds.anet.database.mappers;

public class ForeignKeyTuple<T> {
	private final int foreignKey;
	private final T object;

	public ForeignKeyTuple(int foreignKey, T object) {
		this.foreignKey = foreignKey;
		this.object = object;
	}

	public int getForeignKey() {
		return foreignKey;
	}

	public T getObject() {
		return object;
	}
}