using System;
using System.Collections.Generic;
using Microsoft.Xrm.Sdk;

namespace Plugins.Services
{
	public interface IQualificationService
	{
		KeyValuePair<Guid, Entity> CreateQualificationStage(Entity onboardingProcesseStage, EntityReference qualificationRef);

		KeyValuePair<Guid, Entity> CreateQualificationStep(Entity onboardingProcesseStep, EntityReference qualificationStage);

		bool CheckForActiveStages(EntityReference qualficationStage);

		void CreateActivityFromStep(Entity qualificationStep, Guid userId);

		EntityCollection GetOpenStageActivities(EntityReference stage);
	}
}