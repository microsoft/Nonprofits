using System;
using System.Collections.Concurrent;
using Microsoft.Xrm.Sdk;

namespace Plugins
{
	/// <summary>
	/// Class implementing the Organization Service Provider interface.
	/// It is the most straightforward implementation, the purpose of which is
	/// to guarantee the control of options when instantiating Organization Service
	/// </summary>
	public class OrganizationServiceProvider : IOrganizationServiceProvider
	{
		private readonly IOrganizationServiceFactory factory;

		private readonly ConcurrentDictionary<Guid, IOrganizationService> servicesByUser = new ConcurrentDictionary<Guid, IOrganizationService>();

		private readonly Lazy<IOrganizationService> currentUserService = null;
		private readonly Lazy<IOrganizationService> systemUserService = null;

		/// <summary>
		/// Initializes a new instance of the <see cref="OrganizationServiceProvider" /> class.
		/// </summary>
		/// <param name="factory">Organization Service Factory from CDS SDK</param>
		public OrganizationServiceProvider(IOrganizationServiceFactory factory)
		{
			this.factory = factory;
			this.currentUserService = new Lazy<IOrganizationService>(() => factory.CreateOrganizationService(Guid.Empty), isThreadSafe: true);
			this.systemUserService = new Lazy<IOrganizationService>(() => factory.CreateOrganizationService(null), isThreadSafe: true);
		}

		public IOrganizationService CreateCurrentUserOrganizationService()
		{
			return this.currentUserService.Value;
		}

		public IOrganizationService CreateSpecificUserOrganizationService(Guid systemUserId)
		{
			if (systemUserId == Guid.Empty)
			{
				throw new NotSupportedException("Use dedicated method CreateCurrentUserOrganizationService!");
			}

			return this.servicesByUser.GetOrAdd(systemUserId, userId => this.factory.CreateOrganizationService(userId));
		}

		public IOrganizationService CreateSystemUserOrganizationService()
		{
			return this.systemUserService.Value;
		}
	}
}