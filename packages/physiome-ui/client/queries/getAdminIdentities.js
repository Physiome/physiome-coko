import { useMemo } from 'react';
import gql from 'graphql-tag';
import { useApolloClient } from 'react-apollo-hooks';

export default (opts = {}) => {

    const queryOptions = {
        suspend: false,
        fetchPolicy: 'network-only'
    };
    Object.assign(queryOptions, opts);

    const getAdminIdentitiesQuery = useMemo(() => gql`
        query GetAdminIdentities {
          result: getAdminIdentities {
            identityId
            displayName
          }
        }`
    );

    const client = useApolloClient();

    const runQuery = () => {

        const opts = Object.assign({query:getAdminIdentitiesQuery}, queryOptions);
        opts.variables = {};

        return client.query(opts).then(r => {
            if(r && r.data && r.data.result) {
                return r.data.result;
            }
            return null;
        });
    };

    return [runQuery];
};
