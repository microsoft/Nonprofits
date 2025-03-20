/// <reference path="../../../node_modules/@types/xrm/index.d.ts" />
declare namespace Msnfp_engagementopportunitysettingEnum {
    const enum msnfp_messagewhensenttype {
        SignUpCompleted = 844060000,
        SignUpApproved = 844060001,
        EngagementCompleted = 844060002,
    }

    const enum msnfp_messagesendtotype {
        AllVolunteers = 844060000,
        ApprovedVolunteers = 844060001,
    }

    const enum msnfp_settingtype {
        Message = 844060000,
    }

    const enum statecode {
        Active = 0,
        Inactive = 1,
    }

    const enum statuscode {
        Active = 1,
        Inactive = 2,
    }

}

declare namespace Xrm {
    type Msnfp_engagementopportunitysetting = Omit<FormContext, 'getAttribute'> & Omit<FormContext, 'getControl'> & Msnfp_engagementopportunitysettingAttributes;

    interface EventContext {
        getFormContext(): Msnfp_engagementopportunitysetting;
    }

    interface Msnfp_engagementopportunitysettingAttributes {
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
        getAttribute(name: "msnfp_engagementopportunityid"): Attributes.LookupAttribute;
        getAttribute(name: "msnfp_engagementopportunityidname"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_engagementopportunitysettingid"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_messagesendtotype"): Attributes.OptionSetAttribute;
        getAttribute(name: "msnfp_messagesubject"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_messagetext"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_messagewhensenttype"): Attributes.OptionSetAttribute;
        getAttribute(name: "msnfp_name"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_settingtype"): Attributes.OptionSetAttribute;
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
        getControl(name: "msnfp_engagementopportunityid"): Controls.LookupControl;
        getControl(name: "msnfp_engagementopportunityidname"): Controls.StringControl;
        getControl(name: "msnfp_engagementopportunitysettingid"): Controls.StringControl;
        getControl(name: "msnfp_messagesendtotype"): Controls.OptionSetControl;
        getControl(name: "msnfp_messagesubject"): Controls.StringControl;
        getControl(name: "msnfp_messagetext"): Controls.StringControl;
        getControl(name: "msnfp_messagewhensenttype"): Controls.OptionSetControl;
        getControl(name: "msnfp_name"): Controls.StringControl;
        getControl(name: "msnfp_settingtype"): Controls.OptionSetControl;
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

