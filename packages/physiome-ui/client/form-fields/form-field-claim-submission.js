import "regenerator-runtime/runtime";  // for async
import React, { useState, useContext, useEffect } from 'react';
import styled from 'styled-components';

import { withFormField, useFormValueBinding, fetchFields } from 'component-task-form/client';
import { Select } from 'ds-theme/components/select-input';

import useClaimSubmissionMutation from './../mutations/claimSubmission';
import useUnclaimSubmissionMutation from './../mutations/unclaimSubmission';
import useAdminIdentitiesQuery from './../queries/getAdminIdentities';
import AuthenticatedUserContext from "component-authentication/client/AuthenticatedUserContext";
import { BasicOverlay } from 'component-overlay';

import { BlockLabel } from 'ds-theme/components/label';
import { InlineButton, SmallInlineButton } from 'ds-theme/components/inline-button';
import StaticText from 'ds-theme/components/static-text';
import { th } from 'ds-theme';


function FormFieldClaimSubmission({data, binding, instanceId, instanceType, saveData, refetchData, options = {}}) {

    const [identity] = useFormValueBinding(data, binding, null);
    const claimSubmission = useClaimSubmissionMutation(instanceType);
    const unclaimSubmission = useUnclaimSubmissionMutation(instanceType);
    const currentUser = useContext(AuthenticatedUserContext);

    const handleClaimSubmission = () => {
        (saveData ? saveData() : Promise.resolve()).then(() => {
            return claimSubmission(instanceId);
        }).then(r => {
            return refetchData();
        });
    };

    const handleUnclaimSubmission = () => {

        (saveData ? saveData() : Promise.resolve()).then(() => {
            return unclaimSubmission(instanceId);
        }).then(r => {
            return refetchData();
        });
    };

    const isAssignedToCurrentUser = (currentUser && identity && currentUser.id === identity.id);

    const [adminIdentity, setAdminIdentity] = useState("");
    const [adminIdentities, setAdminIdentities] = useState([]);
    const [getAdminIdentities] = useAdminIdentitiesQuery();

    const optValues = async () => {
        const results = await getAdminIdentities()
        const ids = results.map((r) => {
            return {
                value: r.identityId,
                display: r.displayName,
            }
        })
        setAdminIdentities(ids);
    }

    useEffect(() => {
        optValues();
    }, [])

    const [ShowConfirmation, setShowConfirmation] = useState(false);
    const onAdminChange = (event) => {
        setAdminIdentity(event.target.value);
    };
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
        if (!adminIdentity) {
            return;
        }
        (saveData ? saveData() : Promise.resolve()).then(() => {
            return claimSubmission(instanceId, adminIdentity);
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
        <ClaimSubmissionHolder>
            {options.label ? <BlockLabel>{options.label}</BlockLabel> : null}
            <div>
                {identity ?
                    <React.Fragment>
                        <StaticText>{identity.displayName}</StaticText>
                        {!isAssignedToCurrentUser ?
                            <span> &mdash; <SmallInlineButton bordered={true} onClick={handleClaimSubmission}>Assign Myself</SmallInlineButton></span>
                            :
                            <span> &mdash; <SmallInlineButton bordered={true} onClick={handleUnclaimSubmission}>Un-assign Myself</SmallInlineButton></span>
                        }
                    </React.Fragment>
                    :
                    (<SmallInlineButton bordered={true} onClick={handleClaimSubmission}>Assign to me</SmallInlineButton>)
                }
            </div>

            <SmallInlineButton bordered={true} onClick={onClick}>Assign to another</SmallInlineButton>
            <BasicOverlay isOpen={ShowConfirmation} onRequestClose={closeModal}>
                <ConfirmationContent>
                    <ConfirmationHeading>Assign a different curator</ConfirmationHeading>
                    <Select className="curators" value={adminIdentity}
                        placeholder="Select from the following curators"
                        onChange={onAdminChange} options={adminIdentities} />

                    <ConfirmationButtonSet>
                        <InlineButton bordered={true} onClick={closeModal}>{options.confirmationNegativeLabel || "Cancel"}</InlineButton>
                        <InlineButton bordered={true} default={true} onClick={affirmativeOnClick}>{options.confirmationAffirmativeLabel || "Ok"}</InlineButton>
                    </ConfirmationButtonSet>
                </ConfirmationContent>
            </BasicOverlay>

        </ClaimSubmissionHolder>
    );
}

const ClaimSubmissionHolder = styled.div`  
`;

export default withFormField(FormFieldClaimSubmission, function(element) {

    const topLevel = element.binding;
    const fetch = fetchFields(element.binding, `id, displayName`);

    return {topLevel, fetch};
});
