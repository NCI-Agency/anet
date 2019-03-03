package mil.dds.anet.views;

import java.util.Map;

import mil.dds.anet.beans.Person;

public class IndexView extends SimpleView {
	private Person currentUser;
	private String securityBannerText;
	private String securityBannerColor;
	private String dictionary;

	public IndexView(String path) {
		super(path);
	}

	public Person getCurrentUser() {
		return currentUser;
	}

	public void setCurrentUser(Person currentUser) {
		this.currentUser = currentUser;
	}

	public String getSecurityBannerText() {
		return securityBannerText;
	}

	public void setSecurityBannerText(String securityBannerText) {
		this.securityBannerText = securityBannerText;
	}

	public String getSecurityBannerColor() {
		return securityBannerColor;
	}

	public void setSecurityBannerColor(String securityBannerColor) {
		this.securityBannerColor = securityBannerColor;
	}

	public String getDictionary() {
		return dictionary;
	}

	public void setDictionary(String dictionary) {
		this.dictionary = dictionary;
	}

}
