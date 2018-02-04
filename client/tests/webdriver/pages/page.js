const DEFAULT_CREDENTIALS = { user: 'erin', superUser: 'rebecca', adminUser: 'arthur' }

class Page {
    open(pathName = '/', credentials = DEFAULT_CREDENTIALS.user) {
        const urlToGet = `${browser.options.baseUrl}${pathName}?user=${credentials}&pass=${credentials}`
        browser.url(urlToGet)
    }

    openAsSuperUser(pathName = '/') {
        const credentials = DEFAULT_CREDENTIALS.superUser
        const urlToGet = `${browser.options.baseUrl}${pathName}?user=${credentials}&pass=${credentials}`
        browser.url(urlToGet)
    }

    openAsAdminUser(pathName = '/') {
      const credentials = DEFAULT_CREDENTIALS.adminUser
      const urlToGet = `${browser.options.baseUrl}${pathName}?user=${credentials}&pass=${credentials}`
      browser.url(urlToGet)
    }

    getRandomOption(select) {
        const options = select.$$('option')
        // Ignore the first option, it is always the empty one
        const index = 1 + Math.floor(Math.random() * (options.length - 1));
        return options[index].getValue()
    }
}

export default Page
