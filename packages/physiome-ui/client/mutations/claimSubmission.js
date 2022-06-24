import { useMemo } from 'react';
import gql from 'graphql-tag';
import { useMutation } from 'react-apollo-hooks';

export default (instanceType, opts = {}) => {

    const claimSubmissionMutation = useMemo(() => {
        return gql`
            mutation ClaimSubmission($id:ID, $adminId:ID) {
                result: claim${instanceType.name}(id:$id, adminId:$adminId)
            }
        `;
    }, [instanceType]);

    const mutation = useMutation(claimSubmissionMutation, opts);

    return function wrappedClaimSubmissionMutation(id, adminId) {

        const combinedOpts = Object.assign({}, opts);
        combinedOpts.variables = { id, adminId };

        return mutation(combinedOpts).then(result => {
            return (result && result.data) ? result.data.result : null;
        });
    };
};
