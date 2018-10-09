  module.exports = {
    continueIfResult: continueIfResult,
    generateRandomData: generateRandomData
  }

  const Faker = require('faker');

  function generateRandomData(requestParams, context, ee, next) {
    context.vars.intent = Faker.lorem.paragraph()
    context.vars.engagementDate = Faker.date.recent().toISOString()
    context.vars.atmosphere = Faker.random.arrayElement(["POSITIVE","NEUTRAL","NEGATIVE"])
    context.vars.atmosphereDetails = Faker.lorem.sentences()
    context.vars.reportText = Faker.lorem.paragraphs()
    context.vars.reportSensitiveInformationText = Faker.lorem.paragraphs()
    context.vars.nextSteps = Faker.lorem.paragraph()
    context.vars.keyOutcomes = Faker.lorem.paragraph()
    return next();
  }

  function continueIfResult(requestParams, response, context, ee, next) {
    if (context.vars.result != null)
        return next();
  }
