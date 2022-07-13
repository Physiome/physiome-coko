const TaskEmailManuscriptAcceptance = require('./task-email-acceptance');
const TaskEmailAssignCurator = require('./task-email-assign-curator');
const TaskEmailCommentSubmitted = require('./task-email-comment-submitted');
const TaskEmailManuscriptInitialSubmission = require('./task-email-initial-submission');
const TaskEmailManuscriptPaymentReceived = require('./task-email-payment-received');
const TaskEmailManuscriptPublished = require('./task-email-published');
const TaskEmailManuscriptRejection = require('./task-email-rejection');
const TaskEmailManuscriptRevisionsNeeded = require('./task-email-revisions-needed');
const TaskEmailManuscriptRevisionSubmitted = require('./task-email-revision-submitted');
const TaskEmailDecisionRequired = require('./task-email-decision-required');

const TaskPublishArticle = require('./task-publish-article');
const TaskRepublishArticle = require('./task-republish-article');
const TaskReserveDoi = require('./task-reserve-doi');
const TaskRejectionCleanup = require('./task-rejection-cleanup');

const TaskTimeoutSubmission = require('./task-time-out-submission');


const AllTaskSetups = [
    TaskEmailManuscriptAcceptance,
    TaskEmailAssignCurator,
    TaskEmailCommentSubmitted,
    TaskEmailManuscriptInitialSubmission,
    TaskEmailManuscriptPaymentReceived,
    TaskEmailManuscriptPublished,
    TaskEmailManuscriptRejection,
    TaskEmailManuscriptRevisionsNeeded,
    TaskEmailManuscriptRevisionSubmitted,
    TaskEmailDecisionRequired,
    TaskPublishArticle,
    TaskRepublishArticle,
    TaskReserveDoi,
    TaskRejectionCleanup,
    TaskTimeoutSubmission
];


module.exports = function initExternalTasks(client) {
    return Promise.all(AllTaskSetups.map(taskSetup => taskSetup(client)));
};
