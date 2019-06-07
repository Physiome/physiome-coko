import gql from 'graphql-tag';
import { useQuery } from 'react-apollo-hooks';

export default (filter, sorting, opts = {}) => {

    const queryOptions = {
        suspend: false,
        fetchPolicy: 'network-only'
    };

    Object.assign(queryOptions, opts);
    Object.assign(queryOptions, {
        variables: {
            filter,
            sorting
        }
    });

    const getAwardSubmissionsQuery = gql`
query GetSubmissions($filter:SubmissionListingFilterInput, $sorting:SubmissionListingSortingInput) {
  submissions: submissions(filter:$filter, sorting:$sorting) {
    id
    title
    authors
    phase
    submissionDate
    submitter {
        id
        type
        identityId
        displayName
    }
    curator {
        id
        displayName
    }
    tasks {
        id
        formKey
    }
  }
}
`;

    return useQuery(getAwardSubmissionsQuery, queryOptions);
};

