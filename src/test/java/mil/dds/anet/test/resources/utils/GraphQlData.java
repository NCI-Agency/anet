package mil.dds.anet.test.resources.utils;

public class GraphQlData<T> {
  private T payload;

  public T getPayload() {
    return payload;
  }

  public void setPayload(T payload) {
    this.payload = payload;
  }
}
