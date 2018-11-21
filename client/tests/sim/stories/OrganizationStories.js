import { Organization } from 'models'
import { runGQL, fuzzy } from '../simutils'
import faker from 'faker'


const populateOrganization = function (org) {
    fuzzy.always() && (org.shortName = faker.company.companyName());
    fuzzy.sometimes() && (org.longName = faker.lorem.paragraph());
    org.status = faker.random.objectElement(Organization.STATUS);
    fuzzy.seldomly() && (org.identificationCode = (fuzzy.often() && faker.helper.replaceSymbols('??????')) || faker.helper.replaceSymbols(faker.random.word().replace(/./g, '*')));
    org.type = faker.random.objectElement(Organization.TYPE);
    fuzzy.often() && (org.parentOrg = faker.random.arrayElement(organizations));
    // childrenOrgs: [],
    // approvalSteps: [],
    // positions: [],
    // tasks: []
}

const createOrganization = async function () {
    const org = new Organization()
    populateOrganization(org)
    return await runGQL(user,
        {
            query: `mutation($organization: OrganizationInput!) { createOrganization(organization: $organization) { uuid } }`,
            variables: { organization: org }
        })
}

const deleteOrganization = function () {
    // todo
}