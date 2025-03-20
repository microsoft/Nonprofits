using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Moq;
using NUnit.Framework;
using Plugins.Localization;
using Plugins.Resx;
using Plugins.Services;
using Plugins.Strategies;
using VolunteerManagement.Definitions;

namespace Plugins.Tests.EngagementOpportunityTests
{
	class EngagementOpportunityUpdateStrategyTests
	{
		private Mock<ITracingService> tracingService = new Mock<ITracingService>();
		private Mock<IPluginExecutionContext> context = new Mock<IPluginExecutionContext>();
		private Mock<IOrganizationService> service = new Mock<IOrganizationService>();
		private Mock<IEngagementOpportunityScheduleService> scheduleService = new Mock<IEngagementOpportunityScheduleService>();
		private Mock<ILocalizationHelper<Labels>> localizationHelper = new Mock<ILocalizationHelper<Labels>>();

		[Test]
		public void EngagmentOpportunityShiftUpdatetoTrue()
		{
			Entity Target = new Entity("msnfp_engagementopportunity");
			Target.Attributes.Add("msnfp_shifts", true);
			Target.Id = Guid.NewGuid();
			Entity PostEntityImages = new Entity("msnfp_engagementopportunity");
			PostEntityImages.Attributes.Add("msnfp_shifts", true);
			PostEntityImages.Id = Target.Id;
			Entity PreEntityImages = new Entity("msnfp_engagementopportunity");
			PreEntityImages.Attributes.Add("msnfp_shifts", false);
			PreEntityImages.Id = Target.Id;

			var sut = new EngagementOpportunityOnPostUpdateStrategy(this.tracingService.Object, this.context.Object, this.localizationHelper.Object, this.scheduleService.Object);
			InitMocks(Target, new KeyValuePair<string, Entity>("Target", PreEntityImages), new KeyValuePair<string, Entity>("Target", PostEntityImages));
			Assert.DoesNotThrow(delegate { sut.Run(); });
			scheduleService.Verify(x => x.DeactivateDefaultShifts(Target.ToEntityReference(), false), Times.Once);
		}

		[Test]
		public void EngagmentOpportunityShiftUpdatetoFalse()
		{
			Entity Target = new Entity("msnfp_engagementopportunity");
			Target.Attributes.Add("msnfp_shifts", false);
			Target.Id = Guid.NewGuid();
			Entity PostEntityImages = new Entity("msnfp_engagementopportunity");
			PostEntityImages.Attributes.Add("msnfp_shifts", false);
			PostEntityImages.Id = Target.Id;
			PostEntityImages["msnfp_minimum"] = 2;
			PostEntityImages["msnfp_maximum"] = 4;
			PostEntityImages[EngagementOpportunityDef.PrimaryName] = Guid.NewGuid().ToString();
			PostEntityImages["msnfp_startingdate"] = DateTime.Now;
			PostEntityImages["msnfp_endingdate"] = DateTime.Now.AddHours(1);
			Entity PreEntityImages = new Entity("msnfp_engagementopportunity");
			PreEntityImages.Attributes.Add("msnfp_shifts", true);
			PreEntityImages.Id = Target.Id;

			List<Entity> retrieveList = new List<Entity>
			{
				Target
			};

			var sut = new EngagementOpportunityOnPostUpdateStrategy(this.tracingService.Object, this.context.Object, this.localizationHelper.Object, this.scheduleService.Object);
			InitMocks(Target, new KeyValuePair<string, Entity>("Target", PreEntityImages), new KeyValuePair<string, Entity>("Target", PostEntityImages), retrieveList);
			Assert.DoesNotThrow(delegate { sut.Run(); });

			scheduleService.Verify(x => x.RetrieveRelatedShifts(Target.ToEntityReference()), Times.Once);
			scheduleService.Verify(x => x.RecalculateMinMaxForEngOpportunity(It.Is<Entity>(e => e.GetAttributeValue<bool>("msnfp_shifts") == false)), Times.Once);
		}

		private void InitMocks(Entity target, KeyValuePair<string, Entity> preImage, KeyValuePair<string, Entity> postImage, List<Entity> retrieveDefault = null)
		{	
			var inputParameters = new ParameterCollection();
			this.context.Setup(x => x.InputParameters).Returns(inputParameters);
			this.context.Setup(x => x.MessageName).Returns("Update");

			EntityImageCollection entityImage = new EntityImageCollection();
			entityImage.Add(postImage.Key, postImage.Value);
			context.Setup(x => x.PostEntityImages).Returns(entityImage);
			EntityImageCollection entityPreImage = new EntityImageCollection();
			entityPreImage.Add(preImage.Key, preImage.Value);
			context.Setup(x => x.PreEntityImages).Returns(entityPreImage);

			inputParameters.Add("Target", target);

			Entity entity = new Entity("msnfp_engagementopportunityschedule");
			entity.Id = Guid.NewGuid();
			// entity[EngagementOpportunityScheduleDef.Status] = new OptionSetValue((int)EngagementOpportunityScheduleStatus.Active);
			entity["msnfp_engagementopportunity"] = new EntityReference("msnfp_engagementopportunity", target.Id);

			List<Entity> EOschedules = new List<Entity>();
			EOschedules.Add(entity);
			scheduleService.Setup(x => x.RetrieveRelatedShifts(It.IsAny<EntityReference>())).Returns(EOschedules);

			if (retrieveDefault != null)
			{
				service.Setup(x => x.Retrieve("msnfp_engagementopportunity", target.Id, It.IsAny<ColumnSet>())).Returns(retrieveDefault.Where(e => e.LogicalName == "msnfp_engagementopportunity").FirstOrDefault());
			}
			scheduleService.Setup(x=>x.CreateOrUpdateDefaultShift(It.IsAny<IEnumerable<Entity>>(), It.IsAny<Entity>())).Returns(entity);
		}
	}
}