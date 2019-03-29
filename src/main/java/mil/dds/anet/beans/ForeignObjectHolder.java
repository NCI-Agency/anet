package mil.dds.anet.beans;

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
}
