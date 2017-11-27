package mil.dds.anet.beans;

import java.util.Objects;

import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;

public class Location extends AbstractAnetBean {

	private String name;
	private Double lat;
	private Double lng;
	
	public String getName() {
		return name;
	}
	
	public void setName(String name) {
		this.name = Utils.trimStringReturnNull(name);
	}
	
	public Double getLat() {
		return lat;
	}
	
	public void setLat(Double lat) {
		this.lat = lat;
	}
	
	public Double getLng() {
		return lng;
	}
	
	public void setLng(Double lng) {
		this.lng = lng;
	}

	@Override
	public boolean equals(Object o) { 
		if (o == null || o.getClass() != this.getClass()) {
			return false;
		}
		Location l = (Location) o;
		return Objects.equals(l.getId(), id)
				&& Objects.equals(l.getName(), name)
				&& Objects.equals(l.getLat(), lat)
				&& Objects.equals(l.getLng(), lng)
				&& Objects.equals(l.getCreatedAt(), createdAt);
	}
	
	@Override
	public int hashCode() { 
		return Objects.hash(id, name, lat, lng, createdAt);
	}
	
	@Override
	public String toString() { 
		return String.format("(%d) - %s [%f, %f]", id, name, lat, lng); 
	}
	
	public static Location create(String name, Double lat, Double lng) {
		Location l = new Location();
		l.setName(name);
		l.setLat(lat);
		l.setLng(lng);
		return l;
	}
	
	public static Location createWithId(Integer id) {
		Location l = new Location();
		l.setId(id);
		l.setLoadLevel(LoadLevel.ID_ONLY);
		return l;
	}
	
	
}
