package mil.dds.anet.database.mappers;

public class ForeignKeyTuple<T> {
  private final String foreignKey;
  private final T object;

  public ForeignKeyTuple(String foreignKey, T object) {
    this.foreignKey = foreignKey;
    this.object = object;
  }

  public String getForeignKey() {
    return foreignKey;
  }

  public T getObject() {
    return object;
  }
}
