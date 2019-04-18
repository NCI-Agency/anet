package mil.dds.anet.test.resources.utils;

public class GraphQlResponse<T> {
  private GraphQlData<T> data;

  public GraphQlData<T> getData() {
    return data;
  }

  public void setData(GraphQlData<T> data) {
    this.data = data;
  }
}
