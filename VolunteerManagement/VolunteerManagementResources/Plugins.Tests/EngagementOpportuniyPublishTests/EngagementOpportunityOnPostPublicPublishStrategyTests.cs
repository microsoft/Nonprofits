using System;
using Microsoft.Xrm.Sdk;
using Moq;
using NUnit.Framework;
using Plugins.Strategies;

namespace Plugins.Tests.EngagementOpportuniyPublishTests
{
	class EngagementOpportunityOnPostPublicPublishStrategyTests
	{
		private Mock<ITracingService> tracingService = new Mock<ITracingService>();
		private Mock<IPluginExecutionContext> pluginExecutionContext = new Mock<IPluginExecutionContext>();
		private Mock<IOrganizationServiceProvider> organizationServiceProvider = new Mock<IOrganizationServiceProvider>();

		public Guid EOGuid { get; set; } = new Guid();
		[Test]
		public void EngagmentOpportunityPublished()
		{
			const EngagementOpportunityStatus status = EngagementOpportunityStatus.PublishToWeb;
			DateTime startDate = new DateTime(2021, 1, 1);
			var sut = new EngagementOpportunityOnPostPublicPublishStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object);
			InitMocks(EOGuid, status, startDate);
			sut.Run();
		}
		private void InitMocks(Guid EngagementOpportunityId, EngagementOpportunityStatus opportunityStatus,
			DateTime startingDate,
			string description = "Long Sample Description",
			string shortDescription = "Short Sample Description",
			DateTime? endingDate = null,
			int maximum = 0,
			int minimum = 0,
			bool publicAddress = true,
			string street1 = "Street 1",
			string street2 = "Street 2",
			string street3 = "Street 3",
			bool publicCity = true,
			string city = "ExampleCity",
			string state = "EXampleState",
			string zip = "12345",
			string country = "ExampleCountry",
			string url = @"https://docs.microsoft.com/en-us/dynamics365/industry/accelerators/overview",
			bool showUrl = true
			)
		{	

			var inputParameters = new ParameterCollection();
			pluginExecutionContext.Setup(x => x.InputParameters).Returns(inputParameters);
			var engagementOpportunity = new Entity("msnfp_engagementoppportunity", EngagementOpportunityId);
			engagementOpportunity.Attributes.Add("msnfp_engagementopportunitytitle", opportunityStatus);
			engagementOpportunity.Attributes.Add("msnfp_description", description);
			engagementOpportunity.Attributes.Add("msnfp_shortdescription", shortDescription);
			engagementOpportunity.Attributes.Add("msnfp_startingdate", startingDate);
			engagementOpportunity.Attributes.Add("msnfp_endingdate", endingDate);
			engagementOpportunity.Attributes.Add("msnfp_maximum", maximum);
			engagementOpportunity.Attributes.Add("msnfp_minimum", minimum);
			engagementOpportunity.Attributes.Add("msnfp_publicaddress", publicAddress);
			engagementOpportunity.Attributes.Add("msnfp_street1", street1);
			engagementOpportunity.Attributes.Add("msnfp_street2", street2);
			engagementOpportunity.Attributes.Add("msnfp_street3", street3);
			engagementOpportunity.Attributes.Add("msnfp_publiccity", publicCity);
			engagementOpportunity.Attributes.Add("msnfp_city", city);
			engagementOpportunity.Attributes.Add("msnfp_stateprovince", state);
			engagementOpportunity.Attributes.Add("msnfp_zippostalcode", zip);
			engagementOpportunity.Attributes.Add("msnfp_country", country);
			engagementOpportunity.Attributes.Add("msnfp_url", url);
			engagementOpportunity.Attributes.Add("msnfp_virtualengagementurl", showUrl);
		}
	}
}