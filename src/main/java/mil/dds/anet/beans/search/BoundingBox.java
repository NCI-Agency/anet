package mil.dds.anet.beans.search;

import java.util.Objects;

public class BoundingBox implements Cloneable {
  private double minLng;
  private double minLat;
  private double maxLng;
  private double maxLat;

  public double getMinLng() {
    return minLng;
  }

  public void setMinLng(double minLng) {
    this.minLng = minLng;
  }

  public double getMinLat() {
    return minLat;
  }

  public void setMinLat(double minLat) {
    this.minLat = minLat;
  }

  public double getMaxLng() {
    return maxLng;
  }

  public void setMaxLng(double maxLng) {
    this.maxLng = maxLng;
  }

  public double getMaxLat() {
    return maxLat;
  }

  public void setMaxLat(double maxLat) {
    this.maxLat = maxLat;
  }

  @Override
  public int hashCode() {
    return Objects.hash(minLng, minLat, maxLng, maxLat);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof BoundingBox)) {
      return false;
    }
    final BoundingBox other = (BoundingBox) obj;
    return Objects.equals(getMinLng(), other.getMinLng())
        && Objects.equals(getMinLat(), other.getMinLat())
        && Objects.equals(getMaxLng(), other.getMaxLng())
        && Objects.equals(getMaxLat(), other.getMaxLat());
  }

  @Override
  public Object clone() throws CloneNotSupportedException {
    final BoundingBox clone = (BoundingBox) super.clone();
    return clone;
  }
}
