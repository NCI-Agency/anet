package mil.dds.anet.beans;

import java.util.Objects;
import java.util.Optional;
import mil.dds.anet.views.AbstractAnetBean;

public class ForeignObjectHolder<T extends AbstractAnetBean> {
  private String foreignUuid;
  private Optional<T> foreignObject;

  public ForeignObjectHolder() {
    super();
  }

  public ForeignObjectHolder(String foreignUuid) {
    this();
    this.foreignUuid = foreignUuid;
  }

  public ForeignObjectHolder(T foreignObject) {
    this(foreignObject == null ? null : foreignObject.getUuid());
    setForeignObject(foreignObject);
  }

  public String getForeignUuid() {
    return foreignUuid;
  }

  public boolean hasForeignObject() {
    return foreignObject != null;
  }

  public T getForeignObject() {
    return hasForeignObject() ? foreignObject.orElse(null) : null;
  }

  public void setForeignObject(T foreignObject) {
    this.foreignObject = Optional.ofNullable(foreignObject);
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof ForeignObjectHolder<?>)) {
      return false;
    }
    @SuppressWarnings("unchecked")
    final ForeignObjectHolder<T> f = (ForeignObjectHolder<T>) o;
    return Objects.equals(f.hasForeignObject(), hasForeignObject())
        && Objects.equals(f.getForeignUuid(), getForeignUuid())
        && Objects.equals(f.getForeignObject(), getForeignObject());
  }

  @Override
  public int hashCode() {
    return Objects.hash(foreignUuid, foreignObject);
  }
}
