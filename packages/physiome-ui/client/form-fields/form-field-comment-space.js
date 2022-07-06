import "regenerator-runtime/runtime";  // for async
import React, { useState, useContext, useEffect } from 'react';
import styled from 'styled-components';

import { withFormField, useFormValueBinding, fetchFields } from 'component-task-form/client';

import AuthenticatedUserContext from "component-authentication/client/AuthenticatedUserContext";
import { BasicOverlay } from 'component-overlay';

import { BlockLabel } from 'ds-theme/components/label';
import { InlineButton, SmallInlineButton } from 'ds-theme/components/inline-button';
import StaticText from 'ds-theme/components/static-text';
import TextArea from 'ds-theme/components/text-area';
import { th } from 'ds-theme';


function FormFieldCommentSpace({data, binding, instanceId, instanceType, saveData, refetchData, options = {}}) {
    const [comment, setComment] = useState("");
    const [identity] = useFormValueBinding(data, binding, null);
    const currentUser = useContext(AuthenticatedUserContext);

    const [ShowConfirmation, setShowConfirmation] = useState(false);
    const onClick = () => {
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
        (saveData ? saveData() : Promise.resolve()).then(() => {
            // TODO implement comment
            return true;
        }).then(r => {
            return refetchData();
        });
        setShowConfirmation(false);
    };

    const ConfirmationContent = styled.div`
      min-width: 400px;
      max-width: 550px;
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

    return (
        <CommentSpaceHolder>
            {options.label ? <BlockLabel>{options.label}</BlockLabel> : null}
            <InlineButton bordered={true} onClick={onClick}>Access Comments</InlineButton>
            <BasicOverlay isOpen={ShowConfirmation} onRequestClose={closeModal}>
                <ConfirmationContent>
                    <ConfirmationHeading>Comment on submission</ConfirmationHeading>
                    <TextArea className="comment" value={comment}
                        onChange={setComment} />
                    <ConfirmationButtonSet>
                        <InlineButton bordered={true} onClick={closeModal}>{options.confirmationNegativeLabel || "Cancel"}</InlineButton>
                        <InlineButton bordered={true} default={true} onClick={affirmativeOnClick}>{options.confirmationAffirmativeLabel || "Ok"}</InlineButton>
                    </ConfirmationButtonSet>
                </ConfirmationContent>
            </BasicOverlay>
        </CommentSpaceHolder>
    );
}

const CommentSpaceHolder = styled.div`
`;

export default withFormField(FormFieldCommentSpace, function(element) {

    const topLevel = element.binding;
    const fetch = fetchFields(element.binding, `id, comment_body`);

    return {topLevel, fetch};
});
