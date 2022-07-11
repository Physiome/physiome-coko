import gql from 'graphql-tag';
import { useMutation } from 'react-apollo-hooks';

const commentOnSubmissionMutation = gql`
    mutation CommentOnSubmission($input:CommentInput) {
        comment: commentOnSubmission(input:$input) {
            id
            commentBody
        }
    }
`;

export default (opts = {}) => {

    const mutation = useMutation(commentOnSubmissionMutation, opts);

    return function wrappedCommentOnSubmissionMutation(input) {

        const options = Object.assign({}, opts);
        options.variables = {input};

        return mutation(options).then(result => {
            return (result && result.data) ? result.data.comment : null;
        });
    };
};
