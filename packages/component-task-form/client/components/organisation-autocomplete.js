import React from 'react';
import styled from 'styled-components';

import { EntityAutocomplete, MenuItem, MenuHolder, ApplySmallAutocompleteStyle } from "ds-awards-theme/components/entity-autocomplete";

import RorLogoSmall from '../static/ror-logo-small.png';


const organisationEntityModifier = (entity) => {

    const orgEntity = {id:entity.id, name:entity.name};

    if(entity.country) {
        orgEntity.country = entity.country;
    }

    if(entity.external_ids) {

        const { GRID, FundRef } = entity.external_ids;

        if(GRID && GRID.preferred) {
            orgEntity.grid_id = GRID.preferred;
        }

        if(FundRef && FundRef.all && FundRef.all instanceof Array && FundRef.all.length) {
            orgEntity.fund_ref_id = FundRef.all[0];
        }
    }

    return orgEntity;
};

function organisationEntityLookup(value, maxItems=15) {

    if(!value || !value.length) {
        return Promise.resolve([]);
    }

    const qp = {};

    qp.page = "1";
    qp.query = encodeURIComponent(value);

    const q = Object.keys(qp).map(k => `${k}=${qp[k]}`).join("&");
    const url = `https://api.ror.org/organizations?${q}`;

    return fetch(url).then(function(response) {
        return response.json();
    }).then(function(r) {
        return (r.items || []).slice(0, maxItems-1);
    });
}

const OrganisationMenuItem = styled(MenuItem)`
    & .acronyms {
      color: #909090;
      font-style: italic;
    }
    & .acronyms:before {
      content: " ("
    }
    & .acronyms:after {
      content: ")"
    }
    
    & .country {
      color: #909090;
    }
    & .country:before {
      content: " - "
    }
`;

const renderOrganisationMenuItem = (item, isHighlighted) =>
    <OrganisationMenuItem key={item.id} className={isHighlighted ? "selected" : ""}>
        {item.name}
        {item.acronyms && item.acronyms.length ? <span className="acronyms">{item.acronyms[0]}</span> : null}
        {item.country && item.country.country_name ? <span className="country">{item.country.country_name}</span> : null}
    </OrganisationMenuItem>;


const CountryCodeSpan = styled.span`
  
  font-style: italic;
  &:before {
    content: " (";
  }
  &:after {
    content: ")";
  }
`;

const renderOrganisationValueRepresentation = (organisationEntity) =>
    <React.Fragment>
        {organisationEntity.name}
        {organisationEntity.country && organisationEntity.country.country_code ? <CountryCodeSpan>{organisationEntity.country.country_code}</CountryCodeSpan> : null}
    </React.Fragment>;


const LookupProviderNote = styled(MenuItem)`

  font-size: 10px;
  text-align: right;

  & img {
    height: 1.2em;
    vertical-align: middle;
  }  
`;


const OrganisationMenuHolder = styled(MenuHolder)`
  & > * + ${LookupProviderNote} {
    margin-top: 2px;
    border-top: 1px dashed lightgray;
  }
`;

const renderOrganisationMenu = function (items, value, style) {
    return (
        <OrganisationMenuHolder style={{ ...style, ...this.menuStyle }} children={items}>
            {items}
            <LookupProviderNote>
                <img src={RorLogoSmall} alt="ROR logo" /> Organisation lookup data sourced via ROR
            </LookupProviderNote>
        </OrganisationMenuHolder>
    );
};



const OrganisationAutocomplete = ({entityModifier=organisationEntityModifier, entityLookup=organisationEntityLookup,
                                   renderItem=renderOrganisationMenuItem, renderEntityValueRepresentation=renderOrganisationValueRepresentation,
                                   renderMenu=renderOrganisationMenu, ...props}) => (

    <EntityAutocomplete entityModifier={entityModifier} entityLookup={entityLookup} renderItem={renderItem}
        renderMenu={renderMenu} renderEntityValueRepresentation={renderEntityValueRepresentation} {...props} />
);

export default OrganisationAutocomplete;

const SmallOrganisationAutocomplete = ApplySmallAutocompleteStyle(OrganisationAutocomplete);

export { SmallOrganisationAutocomplete };