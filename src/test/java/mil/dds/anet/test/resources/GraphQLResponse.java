package mil.dds.anet.test.resources;

public class GraphQLResponse<T> {
	private GraphQLData<T> data;

	public GraphQLData<T> getData() {
		return data;
	}

	public void setData(GraphQLData<T> data) {
		this.data = data;
	}
}
