const { registerConditionFunction } = require('client-workflow-model/ConditionFunctions');
const { correspondingAuthors, singleCorrespondingAuthor, validCitations, validIdentity, validUri, fileCount } = require('./shared/validations');

registerConditionFunction('correspondingAuthors', correspondingAuthors);
registerConditionFunction('singleCorrespondingAuthor', singleCorrespondingAuthor);
registerConditionFunction('validCitations', validCitations);
registerConditionFunction('validIdentity', validIdentity);
registerConditionFunction('validUri', validUri);
registerConditionFunction('fileCount', fileCount);


const resolvers = require('./server/resolvers');
const fs = require('fs');

const typeDefs = fs.readFileSync(__dirname + '/server/defs.graphqls', 'utf8');

module.exports = {
    resolvers,
    typeDefs
};