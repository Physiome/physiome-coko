import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { th } from 'ds-awards-theme';

import ArticleCitation from './article-citation';

import Card from "ds-awards-theme/components/card";
import { SmallBlockLabel } from "ds-awards-theme/components/label";
import { SmallTextInput } from "ds-awards-theme/components/text-input";
import { InlineButton, SmallInlineButton } from "ds-awards-theme/components/inline-button";
import ButtonGroup from "ds-awards-theme/components/button-group";
import Spinner from "ds-awards-theme/components/spinner";

import useDebounceValue from '../hooks/useDebouncedValue';
import useGetDetailsForDOI from 'dimensions-lookup-service/client/queries/getDetailsForDOI';


//// 10.3389/fphys.2018.00148    test DOI


const FormattedCitationHolder = styled.div`

    margin-top: 10px;
    margin-bottom: 10px;
    
    padding: 6px;
    border: ${th('borderedElement.small.borderWidth')} ${th('borderedElement.small.borderStyle')} ${th('borderedElement.small.borderColor')};
    border-radius: ${th('borderedElement.small.borderRadius')};
    
    & ${ArticleCitation} span.notice {
      font-style: italic;
      font-size: 12px;
    }
`;

const PossibleCitationHolder = styled(FormattedCitationHolder)`
    cursor: pointer;
    &:hover {
        background: ${th('citation.selectedBackground')};
    }
`;


const ArticleCitationDataEditorHolder = styled.div`
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
`;


const ArticleCitationFormGroup = styled.div`
    margin-bottom: 8px;
    flex-basis: 100%;
    flex-shrink: 0;
`;

const ArticleCitationFormGroupMedium = styled(ArticleCitationFormGroup)`
    flex-basis: calc(50% - 5px);
    flex-shrink: 1;
`;

const ArticleCitationFormGroupSmall = styled(ArticleCitationFormGroup)`
    flex-basis: calc(25% - 10px);
    flex-shrink: 1;
`;


const ArticleCitationHolder = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: flex-end;

  & ${FormattedCitationHolder} {
    flex-basis: 100%;
  }

  & ${SmallInlineButton} {
    float: right;
  }
  
  & ${SmallInlineButton} + ${SmallInlineButton}{
    margin-left: 5px;
  }
`;



function useManualCitationValueField(citation, field) {

    const [value, setValue] = useState(citation[field] || "");

    const handleChange = (event) => {
        const v = event.target.value;
        setValue(v);
        citation[field] = v;
    };

    return [value, handleChange, setValue];
}


function _citationHasContent(c) {

    return !!(c.title || c.journal || c.doi || c.year || c.volume || c.issue || c.pages || c.authors);
}


const _ArticleCitationEditorCard = ({className, citation, didModifyCitation}) => {

    const citationHasContent = useMemo(() => {
        return (citation && _citationHasContent(citation));
    }, [citation]);
    const [editing, setEditing] = useState(!citationHasContent);

    const [doi, setDoi] = useState((citation && citation.id && citation.doi) ? citation.doi : "");
    const [isFindingDoi, setIsFindingDoi] = useState(false);
    const lookupGeneration = useRef(0);

    const [isEditingManualCitation, setIsEditingManualCitation] = useState(false);
    const [manualCitation] = useState(Object.assign({}, citation));

    const onDoiChange = (event) => {
        setDoi(event.target.value || "");
    };

    const [debouncedDoi] = useDebounceValue(doi, 250, null, doi);
    const [performGetDOIDetails] = useGetDetailsForDOI();
    const [doiLookupCitation, setDoiLookupCitation] = useState((citation && citation.id && citation.doi) ? citation : null);

    // Manual data entry
    const [title, handleTitleChange] = useManualCitationValueField(manualCitation, "title");
    const [journal, handleJournalChange] = useManualCitationValueField(manualCitation, "journal");
    const [manualDOI, handleManualDOIChange] = useManualCitationValueField(manualCitation, "doi");

    const [year, handleYearChange] = useManualCitationValueField(manualCitation, "year");
    const [volume, handleVolumeChange] = useManualCitationValueField(manualCitation, "volume");
    const [issue, handleIssueChange] = useManualCitationValueField(manualCitation, "issue");
    const [pages, handlePagesChange] = useManualCitationValueField(manualCitation, "pages");

    const [authors, handleAuthorChanges] = useManualCitationValueField(manualCitation, "authors");

    const manualCitationHasContent = (title || journal || manualDOI || year || volume || issue || pages || authors);
    const ManualCitationHolder = manualCitationHasContent ? PossibleCitationHolder : FormattedCitationHolder;


    const setCitation = (newCitation) => {
        const d = Object.assign({}, newCitation);
        didModifyCitation(d);
    };

    const saveManualCitation = () => {
        if(manualCitationHasContent) {
            setCitation(manualCitation);
            setEditing(false);
        }
    };

    const selectLookupCitation = () => {
        if(doiLookupCitation) {
            setCitation(doiLookupCitation);
            setEditing(false);
        }
    };

    const editCitation = () => {
        setEditing(true);
    };

    const removeCitation = () => {
        didModifyCitation(null);
        setEditing(true);
    };

    useEffect(() => {

        setEditing(!citationHasContent);

        if(citation && citation.id && citation.doi) {
            setDoiLookupCitation(citation);
            setDoi(citation.doi);
        }

    }, [citation]);

    useEffect(() => {

        if(!debouncedDoi || !debouncedDoi.length) {
            return;
        }

        if(doiLookupCitation && doiLookupCitation.doi === debouncedDoi) {
            return;
        }

        setIsFindingDoi(true);

        lookupGeneration.current++;
        const generation = lookupGeneration.current;

        performGetDOIDetails(debouncedDoi).then(details => {
            if(generation >= lookupGeneration.current) {
                setDoiLookupCitation(details);
            }
        }).finally(() => {
            if(generation >= lookupGeneration.current) {
                setIsFindingDoi(false);
            }
        });

    }, [doiLookupCitation, debouncedDoi]);


    return (
        <Card className={className} reorderingGrabber={true}>

            {(editing || !citationHasContent) ?

                <React.Fragment>
                    <ButtonGroup>
                        <SmallInlineButton bordered={true} selected={!isEditingManualCitation} onClick={() => setIsEditingManualCitation(false)}>DOI Lookup</SmallInlineButton>
                        <SmallInlineButton bordered={true} selected={isEditingManualCitation} onClick={() => setIsEditingManualCitation(true)}>Manual Entry</SmallInlineButton>
                    </ButtonGroup>

                    {!isEditingManualCitation ? (

                        <React.Fragment>
                            <div className="doi-lookup-group">
                                <SmallBlockLabel>DOI Lookup</SmallBlockLabel>
                                <SmallTextInput placeholder="Article DOI e.g. 10.3389/fphys.2018.00148" value={doi} onChange={onDoiChange} disabled={isEditingManualCitation} />
                            </div>

                            {isFindingDoi ? <Spinner small={true} message="Finding details for DOI"/> : null}

                            {doiLookupCitation ? (
                                <ArticleCitationHolder>
                                    <PossibleCitationHolder onClick={selectLookupCitation}>
                                        <ArticleCitation citation={doiLookupCitation} />
                                    </PossibleCitationHolder>
                                    {citationHasContent ? <SmallInlineButton bordered={true} onClick={() => setEditing(false)}>Cancel</SmallInlineButton> : null}
                                    <SmallInlineButton bordered={true} onClick={selectLookupCitation}>Select Citation</SmallInlineButton>
                                </ArticleCitationHolder>
                            ) : (
                                <ArticleCitationHolder>
                                    {citationHasContent ? <SmallInlineButton bordered={true} onClick={() => setEditing(false)}>Cancel</SmallInlineButton> : null}
                                </ArticleCitationHolder>
                            )}
                        </React.Fragment>

                    ) : (
                        <React.Fragment>
                            <ArticleCitationDataEditorHolder>

                                <ArticleCitationFormGroup>
                                    <SmallBlockLabel>Article Title</SmallBlockLabel>
                                    <SmallTextInput value={title} onChange={handleTitleChange} />
                                </ArticleCitationFormGroup>

                                <ArticleCitationFormGroupMedium>
                                    <SmallBlockLabel>Journal Name</SmallBlockLabel>
                                    <SmallTextInput value={journal} onChange={handleJournalChange} />
                                </ArticleCitationFormGroupMedium>

                                <ArticleCitationFormGroupMedium>
                                    <SmallBlockLabel>DOI</SmallBlockLabel>
                                    <SmallTextInput value={manualDOI} onChange={handleManualDOIChange} />
                                </ArticleCitationFormGroupMedium>


                                <ArticleCitationFormGroupSmall>
                                    <SmallBlockLabel>Year Published</SmallBlockLabel>
                                    <SmallTextInput value={year} onChange={handleYearChange} />
                                </ArticleCitationFormGroupSmall>

                                <ArticleCitationFormGroupSmall>
                                    <SmallBlockLabel>Volume</SmallBlockLabel>
                                    <SmallTextInput value={volume} onChange={handleVolumeChange} />
                                </ArticleCitationFormGroupSmall>

                                <ArticleCitationFormGroupSmall>
                                    <SmallBlockLabel>Issue</SmallBlockLabel>
                                    <SmallTextInput value={issue} onChange={handleIssueChange} />
                                </ArticleCitationFormGroupSmall>

                                <ArticleCitationFormGroupSmall>
                                    <SmallBlockLabel>Pages</SmallBlockLabel>
                                    <SmallTextInput value={pages} onChange={handlePagesChange} />
                                </ArticleCitationFormGroupSmall>


                                <ArticleCitationFormGroup>
                                    <SmallBlockLabel>Authors</SmallBlockLabel>
                                    <SmallTextInput value={authors} onChange={handleAuthorChanges} />
                                </ArticleCitationFormGroup>

                            </ArticleCitationDataEditorHolder>

                            {/*fix me: only display a formatted citation when we have a citation to actually show*/}
                            <ArticleCitationHolder>
                                <ManualCitationHolder onClick={saveManualCitation}>
                                    <ArticleCitation citation={manualCitation}>
                                        <span className="notice">Enter the citaton details in the fields above to generate your article citation.</span>
                                    </ArticleCitation>
                                </ManualCitationHolder>
                                {citationHasContent ? <SmallInlineButton bordered={true} onClick={() => setEditing(false)}>Cancel</SmallInlineButton> : null}
                                <SmallInlineButton bordered={true} onClick={saveManualCitation}>Save Citation</SmallInlineButton>
                            </ArticleCitationHolder>

                        </React.Fragment>
                    )
                    }

                </React.Fragment>

                :

                <React.Fragment>
                    <ArticleCitationHolder>
                        <FormattedCitationHolder>
                            <ArticleCitation citation={citation} />
                        </FormattedCitationHolder>
                        <SmallInlineButton bordered={true} onClick={removeCitation}>Remove Citation</SmallInlineButton>
                        <SmallInlineButton bordered={true} onClick={editCitation}>Modify Citation</SmallInlineButton>
                    </ArticleCitationHolder>
                </React.Fragment>
            }



        </Card>
    );
};

const ArticleCitationEditorCard = styled(_ArticleCitationEditorCard)`

  .doi-lookup-group {
    margin-bottom: 10px;
  }

  & ${ButtonGroup} {
    margin-top: -10px;
    margin-bottom: 15px;
    margin-left: -15px;
    margin-right: -15px;
    
    padding-top: 10px;
    padding-bottom: 10px;

    background: #f1f1f1;
    border-bottom: 1px solid #d0d0d0;
  }
  
  & ${ButtonGroup} ${InlineButton} {
    border-color: #afafaf !important;
  }
  
  & ${Spinner} {
    margin: 10px 0 !important;
  }

`;

export default ArticleCitationEditorCard;