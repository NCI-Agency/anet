  module.exports = {
    continueIfResult: continueIfResult,
    generateRandomData: generateRandomData
  }

  const Faker = require('faker');

  function generateRandomData(requestParams, context, ee, next) {
    context.vars.report = {}
    context.vars.report.intent = Faker.lorem.paragraph()
    context.vars.report.engagementDate = Faker.date.recent()

    return next();
  }

  function continueIfResult(requestParams, response, context, ee, next) {
    if (context.vars.result != null)
        return next();
  }
