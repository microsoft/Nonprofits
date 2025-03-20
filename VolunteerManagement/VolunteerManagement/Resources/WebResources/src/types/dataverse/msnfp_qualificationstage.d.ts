/// <reference path="../../../node_modules/@types/xrm/index.d.ts" />
declare namespace Msnfp_qualificationstageEnum {
    const enum statecode {
        Active = 0,
        Inactive = 1,s
    }

    const enum statuscode {
        Active = 1,
        Inactive = 2,
    }

    const enum msnfp_stagestatus {
        Pending = 844060000,
        Active = 844060001,
        Completed = 844060002,
        Abandon = 844060003,
    }

}

declare namespace Xrm {
    type Msnfp_qualificationstage = Omit<FormContext, 'getAttribute'> & Omit<FormContext, 'getControl'> & Msnfp_qualificationstageAttributes;

    interface EventContext {
        getFormContext(): Msnfp_qualificationstage;
    }

    interface Msnfp_qualificationstageAttributes {
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
        getAttribute(name: "msnfp_completiondate"): Attributes.DateAttribute;
        getAttribute(name: "msnfp_description"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_duedate"): Attributes.DateAttribute;
        getAttribute(name: "msnfp_plannedlengthdays"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_qualificationid"): Attributes.LookupAttribute;
        getAttribute(name: "msnfp_qualificationidname"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_qualificationstageid"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_sequencenumber"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_stagename"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_stagestatus"): Attributes.OptionSetAttribute;
        getAttribute(name: "msnfp_startdate"): Attributes.DateAttribute;
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
        getControl(name: "msnfp_completiondate"): Controls.DateControl;
        getControl(name: "msnfp_description"): Controls.StringControl;
        getControl(name: "msnfp_duedate"): Controls.DateControl;
        getControl(name: "msnfp_plannedlengthdays"): Controls.NumberControl;
        getControl(name: "msnfp_qualificationid"): Controls.LookupControl;
        getControl(name: "msnfp_qualificationidname"): Controls.StringControl;
        getControl(name: "msnfp_qualificationstageid"): Controls.StringControl;
        getControl(name: "msnfp_sequencenumber"): Controls.NumberControl;
        getControl(name: "msnfp_stagename"): Controls.StringControl;
        getControl(name: "msnfp_stagestatus"): Controls.OptionSetControl;
        getControl(name: "msnfp_startdate"): Controls.DateControl;
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

