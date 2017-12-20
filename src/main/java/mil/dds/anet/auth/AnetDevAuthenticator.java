package mil.dds.anet.auth;

import java.util.List;
import java.util.Optional;

import io.dropwizard.auth.AuthenticationException;
import io.dropwizard.auth.Authenticator;
import io.dropwizard.auth.basic.BasicCredentials;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.database.PersonDao;

public class AnetDevAuthenticator implements Authenticator<BasicCredentials, Person> {
	
	PersonDao dao;
	
	public AnetDevAuthenticator(AnetObjectEngine engine) { 
		this.dao = engine.getPersonDao();
	}

	@Override
	public Optional<Person> authenticate(BasicCredentials credentials) throws AuthenticationException {
		List<Person> p = dao.findByDomainUsername(credentials.getUsername());
		if (p.size() > 0) { 
			Person person = p.get(0);
			return Optional.of(person);
        }
        
		if (credentials.getUsername().equals(credentials.getPassword())) {
			//Special development mechanism to perform a 'first login'. 
			Person newUser = new Person();
			newUser.setName(credentials.getUsername());
			newUser.setRole(Role.ADVISOR);
			newUser.setDomainUsername(credentials.getUsername());
			newUser.setStatus(PersonStatus.NEW_USER);
			newUser = dao.insert(newUser);
        	
			return Optional.of(newUser);
        }
		return Optional.empty();
	}
	
}