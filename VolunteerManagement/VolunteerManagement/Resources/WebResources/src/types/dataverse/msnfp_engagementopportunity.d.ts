/// <reference path="../../../node_modules/@types/xrm/index.d.ts" />
declare namespace Msnfp_engagementopportunityEnum {
    const enum msnfp_locationtype {
        OnLocation = 844060000,
        Virtual = 844060001,
        Both = 844060002,
        None = 844060003,
    }

    const enum msnfp_engagementopportunitystatus {
        Draft = 844060000,
        SetToPublish = 844060001,
        PublishToWeb = 844060002,
        PrivatelyPublished = 844060003,
        Closed = 844060004,
        Cancelled = 844060005,
    }

    const enum msnfp_type {
        Type1 = 844060000,
        Type2 = 844060001,
    }

    const enum statuscode {
        Active = 1,
        Inactive = 2,
    }

    const enum statecode {
        Active = 0,
        Inactive = 1,
    }

}

declare namespace Xrm {
    type Msnfp_engagementopportunity = Omit<FormContext, 'getAttribute'> & Omit<FormContext, 'getControl'> & Msnfp_engagementopportunityAttributes;

    interface EventContext {
        getFormContext(): Msnfp_engagementopportunity;
    }

    interface Msnfp_engagementopportunityAttributes {
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
        getAttribute(name: "msnfp_appliedparticipants"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_automaticallyapproveallapplicants"): Attributes.BooleanAttribute;
        getAttribute(name: "msnfp_cancelledparticipants"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_cancelledshifts"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_city"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_completed"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_countdown"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_country"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_county"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_deliveryframeworkid"): Attributes.LookupAttribute;
        getAttribute(name: "msnfp_deliveryframeworkidname"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_description"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_endingdate"): Attributes.DateAttribute;
        getAttribute(name: "msnfp_engagementopportunityid"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_engagementopportunitystatus"): Attributes.OptionSetAttribute;
        getAttribute(name: "msnfp_engagementopportunitytitle"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_filledshifts"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_georeference"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_latitude"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_location"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_locationtype"): Attributes.OptionSetAttribute;
        getAttribute(name: "msnfp_longitude"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_maximum"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_minimum"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_multipledays"): Attributes.BooleanAttribute;
        getAttribute(name: "msnfp_needsreviewedparticipants"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_noshow"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_number"): Attributes.NumberAttribute;
        getAttribute(name: "msnfp_operationid"): Attributes.LookupAttribute;
        getAttribute(name: "msnfp_operationidname"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_primarycontactid"): Attributes.LookupAttribute;
        getAttribute(name: "msnfp_primarycontactidname"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_primarycontactidyominame"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_publicaddress"): Attributes.BooleanAttribute;
        getAttribute(name: "msnfp_publiccity"): Attributes.BooleanAttribute;
        getAttribute(name: "msnfp_shifts"): Attributes.BooleanAttribute;
        getAttribute(name: "msnfp_shortdescription"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_startingdate"): Attributes.DateAttribute;
        getAttribute(name: "msnfp_stateprovince"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_street1"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_street2"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_street3"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_type"): Attributes.OptionSetAttribute;
        getAttribute(name: "msnfp_url"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_virtualengagementurl"): Attributes.BooleanAttribute;
        getAttribute(name: "msnfp_workitemid"): Attributes.LookupAttribute;
        getAttribute(name: "msnfp_workitemidname"): Attributes.StringAttribute;
        getAttribute(name: "msnfp_zippostalcode"): Attributes.StringAttribute;
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
        getControl(name: "msnfp_appliedparticipants"): Controls.NumberControl;
        getControl(name: "msnfp_automaticallyapproveallapplicants"): Controls.StandardControl;
        getControl(name: "msnfp_cancelledparticipants"): Controls.NumberControl;
        getControl(name: "msnfp_cancelledshifts"): Controls.NumberControl;
        getControl(name: "msnfp_city"): Controls.StringControl;
        getControl(name: "msnfp_completed"): Controls.NumberControl;
        getControl(name: "msnfp_countdown"): Controls.NumberControl;
        getControl(name: "msnfp_country"): Controls.StringControl;
        getControl(name: "msnfp_county"): Controls.StringControl;
        getControl(name: "msnfp_deliveryframeworkid"): Controls.LookupControl;
        getControl(name: "msnfp_deliveryframeworkidname"): Controls.StringControl;
        getControl(name: "msnfp_description"): Controls.StringControl;
        getControl(name: "msnfp_endingdate"): Controls.DateControl;
        getControl(name: "msnfp_engagementopportunityid"): Controls.StringControl;
        getControl(name: "msnfp_engagementopportunitystatus"): Controls.OptionSetControl;
        getControl(name: "msnfp_engagementopportunitytitle"): Controls.StringControl;
        getControl(name: "msnfp_filledshifts"): Controls.NumberControl;
        getControl(name: "msnfp_georeference"): Controls.StringControl;
        getControl(name: "msnfp_latitude"): Controls.NumberControl;
        getControl(name: "msnfp_location"): Controls.StringControl;
        getControl(name: "msnfp_locationtype"): Controls.OptionSetControl;
        getControl(name: "msnfp_longitude"): Controls.NumberControl;
        getControl(name: "msnfp_maximum"): Controls.NumberControl;
        getControl(name: "msnfp_minimum"): Controls.NumberControl;
        getControl(name: "msnfp_multipledays"): Controls.StandardControl;
        getControl(name: "msnfp_needsreviewedparticipants"): Controls.NumberControl;
        getControl(name: "msnfp_noshow"): Controls.NumberControl;
        getControl(name: "msnfp_number"): Controls.NumberControl;
        getControl(name: "msnfp_operationid"): Controls.LookupControl;
        getControl(name: "msnfp_operationidname"): Controls.StringControl;
        getControl(name: "msnfp_primarycontactid"): Controls.LookupControl;
        getControl(name: "msnfp_primarycontactidname"): Controls.StringControl;
        getControl(name: "msnfp_primarycontactidyominame"): Controls.StringControl;
        getControl(name: "msnfp_publicaddress"): Controls.StandardControl;
        getControl(name: "msnfp_publiccity"): Controls.StandardControl;
        getControl(name: "msnfp_shifts"): Controls.StandardControl;
        getControl(name: "msnfp_shortdescription"): Controls.StringControl;
        getControl(name: "msnfp_startingdate"): Controls.DateControl;
        getControl(name: "msnfp_stateprovince"): Controls.StringControl;
        getControl(name: "msnfp_street1"): Controls.StringControl;
        getControl(name: "msnfp_street2"): Controls.StringControl;
        getControl(name: "msnfp_street3"): Controls.StringControl;
        getControl(name: "msnfp_type"): Controls.OptionSetControl;
        getControl(name: "msnfp_url"): Controls.StringControl;
        getControl(name: "msnfp_virtualengagementurl"): Controls.StandardControl;
        getControl(name: "msnfp_workitemid"): Controls.LookupControl;
        getControl(name: "msnfp_workitemidname"): Controls.StringControl;
        getControl(name: "msnfp_zippostalcode"): Controls.StringControl;
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

