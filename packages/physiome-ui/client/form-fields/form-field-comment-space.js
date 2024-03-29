import "regenerator-runtime/runtime";  // for async
import moment from "moment";
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { withFormField, useFormValueBinding, fetchFields } from 'component-task-form/client';

import AuthenticatedUserContext from "component-authentication/client/AuthenticatedUserContext";
import { BasicOverlay } from 'component-overlay';

import useCommentOnSubmission from './../mutations/commentOnSubmission';

import { BlockLabel } from 'ds-theme/components/label';
import { InlineButton, SmallInlineButton } from 'ds-theme/components/inline-button';
import StaticText from 'ds-theme/components/static-text';
import TextArea from 'ds-theme/components/text-area';
import { th } from 'ds-theme';


function FormFieldCommentSpace({data, binding, instanceId, instanceType, saveData, refetchData, options = {}}) {
    const commentMaxLength = 64000;
    const [comment, setComment] = useState("");
    const [commentCharCount, setCommentCharCount] = useState(0);
    const [comments, setComments] = useState([]);
    const [commentsModified, setCommentsModified] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [identity] = useFormValueBinding(data, binding, null);
    const currentUser = useContext(AuthenticatedUserContext);

    const commentOnSubmission = useCommentOnSubmission();
    const handleInputChange = (e) => {
        if (e.target.value.length > commentMaxLength)
            return false;
        setComment(e.target.value);
        setCommentCharCount(e.target.value.length);
    };

    useEffect(() => {
        setComments(data.getFieldValue(binding) || []);
        setCommentsModified(false);
    }, [data, binding, setComments, setCommentsModified]);

    const [ShowConfirmation, setShowConfirmation] = useState(false);
    const onClick = () => {
        setComments(data.getFieldValue(binding) || []);
        if(ShowConfirmation) {
            setShowConfirmation(false);
            return;
        }

        setShowConfirmation(true);
    };
    const closeModal = () => {
        setShowConfirmation(false);
    };
    const affirmativeOnClick = () => {
        commentOnSubmission({submission_id: instanceId, comment_body: comment}).then(result => {
            if(!result) {
                // update the comment section
            }
            setShowConfirmation(false);
            setCommentsModified(true);
            setErrorMsg('');
            setComment('');
            setCommentCharCount(0);
            return refetchData();
        }).catch(err => {
            setErrorMsg('Error when attempting to submit comment');
        });
    };

    return (
        <CommentSpaceHolder>
            {options.label ? <BlockLabel>{options.label}</BlockLabel> : null}
            <InlineButton bordered={true} onClick={onClick}>Access Comments</InlineButton>
            <BasicOverlay isOpen={ShowConfirmation} onRequestClose={closeModal}>
                <ConfirmationContent style={{maxHeight: '90vh'}}>
                    <ConfirmationHeading>Correspondence</ConfirmationHeading>
                    <Comments>
                    {comments.map((comment) => {
                        return (
                            <Comment key={comment.id}>
                                <CommentHeading>
                                    <CommentAuthor>{comment.author.displayName}</CommentAuthor>
                                    <CommentTimestamp>{' on ' + moment(new Date(comment.created)).format(
                                        'MMM DD, YYYY h:mm:ss a')
                                    }</CommentTimestamp>
                                </CommentHeading>
                                <CommentBody>{comment.commentBody}</CommentBody>
                            </Comment>
                        )
                    })}
                    </Comments>
                    <ConfirmationHeading>Comment on submission</ConfirmationHeading>
                    <TextArea style={{minHeight: '15vh'}} className="comment" type="text"
                        value={comment || ""} onChange={handleInputChange} />
                    <ConfirmationButtonSet>
                        <NewCommentInfo style={{
                            color: commentCharCount > commentMaxLength * .85 ? commentCharCount == commentMaxLength ? '#800000' : '#805000' : '#333333'
                        }}>{commentCharCount} / {commentMaxLength}</NewCommentInfo>
                        <InlineButton bordered={true} onClick={closeModal}>{options.confirmationNegativeLabel || "Cancel"}</InlineButton>
                        <InlineButton bordered={true} default={true} onClick={affirmativeOnClick}>{options.confirmationAffirmativeLabel || "Ok"}</InlineButton>
                    </ConfirmationButtonSet>
                </ConfirmationContent>
                <Error>{errorMsg}</Error>
            </BasicOverlay>
        </CommentSpaceHolder>
    );
}

const CommentSpaceHolder = styled.div`
`;

const ConfirmationContent = styled.div`
  min-width: 80vh;
  max-width: 90vh;
`;
const ConfirmationHeading = styled.div`
  margin-bottom: 15px;
  font-family: ${th('modal.fontFamily')};
  font-size: ${th('modal.headingFontSize')};
  font-weight: ${th('modal.headingFontWeight')};
  color: ${th('modal.headingTextColor')};
`;
const ConfirmationMessage = styled.div`
  margin-top: 15px;
  margin-bottom: 15px;
  font-family: ${th('modal.fontFamily')};
  font-size: ${th('modal.messageFontSize')};
  color: ${th('modal.messageTextColor')};
`;
const ConfirmationButtonSet = styled.div`
  text-align: right;
  margin-top: 15px;

  > ${InlineButton} + ${InlineButton} {
    margin-left: 10px;
  }
`;
const Error = styled.div`
  color: red;
  font-family: ${th('modal.fontFamily')};
  font-size: ${th('modal.messageFontSize')};
`;
const Comment = styled.div`
  font-family: ${th('modal.fontFamily')};
  font-size: ${th('modal.messageFontSize')};
  border: 1px #666 solid;
  margin: 0.5em 0;
  border-radius: 7px;
`;
const CommentHeading = styled.div`
  border-bottom: 1px #666 solid;
  padding: 0.5em;
  background: #eee;
  border-radius: 7px 7px 0 0;
`;
const CommentTimestamp = styled.span`
  color: #666;
`;
const CommentAuthor = styled.span`
`;
const CommentBody = styled.div`
  padding: 0.5em;
  white-space: pre-wrap;
`;
const Comments = styled.div`
  max-height: 60vh;
  overflow: auto;
`;
const NewCommentInfo = styled.span`
  font-family: ${th('modal.fontFamily')};
  font-size: ${th('modal.messageFontSize')};
  padding-right: 1em;
`


export default withFormField(FormFieldCommentSpace, function(element) {

    const topLevel = element.binding;
    const fetch = fetchFields(element.binding, `id, commentBody, created, author { displayName }`);

    return {topLevel, fetch};
});
