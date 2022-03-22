const { ServiceSendEmail, EmailTemplate } = require('component-workflow-send-email');
const config = require('config');

const { models } = require('component-workflow-model/model');
const { Submission } = models;

const BaseUrl = config.get('pubsweet-client.baseUrl');
const EmailSignature = config.get('workflow-send-email.signature');


class TaskSendEmail {

    constructor(emailTemplateName, logger) {
        if (emailTemplateName) {
            this.emailTemplate = new EmailTemplate(emailTemplateName);
        }
        this.logger = logger;
    }

    configure(client, externalTaskName) {
        client.subscribe(externalTaskName, async ({ task, taskService }) => {
            return this.processTask(task, taskService);
        });
    }

    skipTaskWithoutSendingEmail() {
        return false;
    }

    async resolveSubmission(submissionId) {

        return Submission.find(submissionId, ['submitter']);
    }

    async formatEmailSubject(submission) {

        return '-';
    }

    async submissionToRecipient(submission) {
        return submission.submitter;
    }

    baseTemplateData(submission) {
        const link = `${BaseUrl}/details/${encodeURI(submission.id)}`;
        return {
            submission,
            datetime: new Date().toISOString().slice(0, 10),
            link,
            signature: EmailSignature
        }
    }

    async submissionToEmailData(submission) {

        const subject = await this.formatEmailSubject(submission);
        const recipient = await this.submissionToRecipient(submission);

        return {
            subject,
            recipientName: recipient.displayName,
            recipientEmail: recipient.email,
            data: {
                user: recipient,
                ...this.baseTemplateData(submission)
            }
        };
    }

    _sendEmail(emailDatum, submission) {
        const {subject, recipientName, recipientEmail, data} = emailDatum;
        // XXX this fails if neiter text or template and data was provided
        const text = emailDatum.text || this.emailTemplate.template(data);
        const to = `${recipientName} <${recipientEmail}>`;

        const opts = {
            subject,
            to,
            text
        };

        const emailDefaults = config.get('workflow-send-email');
        const fromAddress = emailDefaults.from.trim().match(/^.+\<(.*)\>$/);
        if(emailDefaults.cc_sender && (fromAddress === null || recipientEmail !== fromAddress[1])) {
            opts.cc = emailDefaults.from;
        }

        return ServiceSendEmail.sendEmail(opts);
    }

    sendEmail(emailData, submission) {
        const self = this;
        const logger = self.logger;
        if (!(emailData instanceof Array)) {
            emailData = [emailData];
        }
        return Promise.all(emailData.map(emailDatum => {
            self._sendEmail(emailDatum).catch(error => {
                logger.error(`sendEmail error: ${error}`);
                return error
            });
        }));
    }

    async processTask(task, taskService) {

        const logger = this.logger;
        logger.debug(`process task is starting`);

        if(this.skipTaskWithoutSendingEmail()) {
            logger.debug(`process task has been skipped without sending email, completing external task`);
            return taskService.complete(task);
        }

        const submissionId = task.businessKey;
        if(!submissionId) {
            logger.error(`failed to process email for submission due to missing business key (processInstanceId="${task.processInstanceId}")`);
            return;
        }

        const submission = await this.resolveSubmission(submissionId);
        if(!submission) {
            logger.warn(`unable to find submission instance for id (${submissionId})`);
            return;
        }

        const emailData = await this.submissionToEmailData(submission);

        return this.sendEmail(emailData, submission).then(result => {
            // what if there is no emailData? the following would be wrong...
            // if (values.filter(v => !(v instanceof Error)).length == 0) {
            //     throw new Error('failed to send a email');
            // }
            logger.debug(`process task has successfully finished, completing external task`);
            return taskService.complete(task);

        }).catch(err => {
            logger.error(`process task has failed due to: ${err.toString()}`);
        });
    }
}


module.exports = TaskSendEmail;
