  module.exports = {
    continueIfResult: continueIfResult
  }


  function continueIfResult(requestParams, response, context, ee, next) {
    if (context.vars.result != null)
        return next();
  }
