// Dependencies
const passwordValidator = require("password-validator");

const schema = new passwordValidator();

schema.is().min(8).has().digits().has().lowercase().has().uppercase();

module.exports = schema;
