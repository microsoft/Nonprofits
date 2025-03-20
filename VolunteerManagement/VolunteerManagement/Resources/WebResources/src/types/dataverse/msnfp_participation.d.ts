/// <reference path="../../../node_modules/@types/xrm/index.d.ts" />
declare namespace Msnfp_participationEnum {
    const enum statecode {
        Active = 0,
        Inactive = 1,
    }

    const enum msnfp_status {
        NeedsReview = 844060000,
        InReview = 844060001,
        Approved = 844060002,
        Dismissed = 844060003,
        Cancelled = 844060004,
    }

    const enum statuscode {
        Active = 1,
        Inactive = 2,
    }

}

declare namespace Xrm {
    type Msnfp_participation = Omit<FormContext, 'getAttribute'> & Omit<FormContext, 'getControl'> & Msnfp_participationAttributes;

    interface EventContext {
        getFormContext(): Msnfp_participation;
    }

    interface Msnfp_participationAttributes {
        getAttribute(name: "createdby"): Attributes.LookupAttribute;
        getAttribute(name: "createdbyname"): Attributes.StringAttribute;
        getAttribute(name: "createdbyyominame"): Attributes.StringAttribute;
        getAttribute(name: "createdon"): Attributes.DateAttribute;
        getAttribute(name: "createdonbehalfby"): Attributes.LookupAttribute;
        getAttribute(name: "createdonbehalfbyname"): Attributes.StringAttribute;
        getAttribute(name: "createdonbehalfbyyominame"): Attributes.StringAttribute;
        getAttribute(name: "importsequencenumber"): Attributes.NumberAttribute;
        getAttribute(name: "modifiedby"): Attributes.LookupAttribute;
        getAttribute(name: "modifiedbyname"): Attributes.StringAttribute;
        getAttribute(name: "modifiedbyyominame"): Attributes.StringAttribute;
        getAttribute(name: "modifiedon"): Attributes.DateAttribute;
        getAttribute(name: "modifiedonbehalfby"): Attributes.LookupAttribute;
        getAttribute(name: "modifiedonbehalfbyname"): Attributes.StringAttribute;
        getAttribute(name: "modifiedonbehalfbyyominame"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_contactid"): Attributes.LookupAttribute;
        getAttribute(name: "msnfp_contactidname"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_contactidyominame"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_description"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_enddate"): Attributes.DateAttribute;
        getAttribute(name: "msnfp_engagementopportunityid"): Attributes.LookupAttribute;
        getAttribute(name: "msnfp_engagementopportunityidname"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_hours"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_participationid"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_participationtitle"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_participationtypeid"): Attributes.LookupAttribute;
        getAttribute(name: "msnfp_participationtypeidname"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_startdate"): Attributes.DateAttribute;
        getAttribute(name: "msnfp_status"): Attributes.OptionSetAttribute;
        getAttribute(name: "msnfp_volunteergroupid"): Attributes.LookupAttribute;
        getAttribute(name: "msnfp_volunteergroupidname"): Attributes.StringAttribute;
        getAttribute(name: "overriddencreatedon"): Attributes.DateAttribute;
        getAttribute(name: "ownerid"): Attributes.LookupAttribute;
        getAttribute(name: "owneridname"): Attributes.StringAttribute;
        getAttribute(name: "owneridtype"): Attributes.Attribute;
        getAttribute(name: "owneridyominame"): Attributes.StringAttribute;
        getAttribute(name: "owningbusinessunit"): Attributes.LookupAttribute;
        getAttribute(name: "owningbusinessunitname"): Attributes.StringAttribute;
        getAttribute(name: "owningteam"): Attributes.LookupAttribute;
        getAttribute(name: "owninguser"): Attributes.LookupAttribute;
        getAttribute(name: "statecode"): Attributes.OptionSetAttribute;
        getAttribute(name: "statuscode"): Attributes.OptionSetAttribute;
        getAttribute(name: "timezoneruleversionnumber"): Attributes.NumberAttribute;
        getAttribute(name: "utcconversiontimezonecode"): Attributes.NumberAttribute;
        getAttribute(name: "versionnumber"): Attributes.NumberAttribute;
        getControl(name: "createdby"): Controls.LookupControl;
        getControl(name: "createdbyname"): Controls.StringControl;
        getControl(name: "createdbyyominame"): Controls.StringControl;
        getControl(name: "createdon"): Controls.DateControl;
        getControl(name: "createdonbehalfby"): Controls.LookupControl;
        getControl(name: "createdonbehalfbyname"): Controls.StringControl;
        getControl(name: "createdonbehalfbyyominame"): Controls.StringControl;
        getControl(name: "importsequencenumber"): Controls.NumberControl;
        getControl(name: "modifiedby"): Controls.LookupControl;
        getControl(name: "modifiedbyname"): Controls.StringControl;
        getControl(name: "modifiedbyyominame"): Controls.StringControl;
        getControl(name: "modifiedon"): Controls.DateControl;
        getControl(name: "modifiedonbehalfby"): Controls.LookupControl;
        getControl(name: "modifiedonbehalfbyname"): Controls.StringControl;
        getControl(name: "modifiedonbehalfbyyominame"): Controls.StringControl;
        getControl(name: "msnfp_contactid"): Controls.LookupControl;
        getControl(name: "msnfp_contactidname"): Controls.StringControl;
        getControl(name: "msnfp_contactidyominame"): Controls.StringControl;
        getControl(name: "msnfp_description"): Controls.StringControl;
        getControl(name: "msnfp_enddate"): Controls.DateControl;
        getControl(name: "msnfp_engagementopportunityid"): Controls.LookupControl;
        getControl(name: "msnfp_engagementopportunityidname"): Controls.StringControl;
        getControl(name: "msnfp_hours"): Controls.NumberControl;
        getControl(name: "msnfp_participationid"): Controls.StringControl;
        getControl(name: "msnfp_participationtitle"): Controls.StringControl;
        getControl(name: "msnfp_participationtypeid"): Controls.LookupControl;
        getControl(name: "msnfp_participationtypeidname"): Controls.StringControl;
        getControl(name: "msnfp_startdate"): Controls.DateControl;
        getControl(name: "msnfp_status"): Controls.OptionSetControl;
        getControl(name: "msnfp_volunteergroupid"): Controls.LookupControl;
        getControl(name: "msnfp_volunteergroupidname"): Controls.StringControl;
        getControl(name: "overriddencreatedon"): Controls.DateControl;
        getControl(name: "ownerid"): Controls.LookupControl;
        getControl(name: "owneridname"): Controls.StringControl;
        getControl(name: "owneridtype"): Controls.Control;
        getControl(name: "owneridyominame"): Controls.StringControl;
        getControl(name: "owningbusinessunit"): Controls.LookupControl;
        getControl(name: "owningbusinessunitname"): Controls.StringControl;
        getControl(name: "owningteam"): Controls.LookupControl;
        getControl(name: "owninguser"): Controls.LookupControl;
        getControl(name: "statecode"): Controls.OptionSetControl;
        getControl(name: "statuscode"): Controls.OptionSetControl;
        getControl(name: "timezoneruleversionnumber"): Controls.NumberControl;
        getControl(name: "utcconversiontimezonecode"): Controls.NumberControl;
        getControl(name: "versionnumber"): Controls.NumberControl;
    }

}

