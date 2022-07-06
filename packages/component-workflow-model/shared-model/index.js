const ModelFile = require('./file');
const ModelIdentity = require('./identity');
const ModelComment = require('./comment');

const fs = require('fs');
const path = require('path');


module.exports = function loaderSupport() {

    const typeDefs = fs.readFileSync(path.resolve(__dirname, './shared.graphqls'), 'utf8');

    return {
        serverSetups: [
            ModelFile.serverSetup
        ],

        resolvers: [
            ModelFile.resolvers,
            ModelIdentity.resolvers,
            ModelComment.resolvers
        ],

        models: {
            File: ModelFile.model,
            ExtendedFile: ModelFile.model,
            Identity: ModelIdentity.model,
            Comment: ModelComment.model,
        },

        typeDefs
    };
};
