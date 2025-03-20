using System;
using Microsoft.Xrm.Sdk;

namespace Plugins
{
	public interface IOrganizationServiceProvider
	{
		/// <summary>
		/// Returns organization service for the user from the current execution context
		/// </summary>
		/// <returns>Instance of organization service</returns>
		IOrganizationService CreateCurrentUserOrganizationService();

		/// <summary>
		/// Returns organization service with elevated access (using system user)
		/// All usages of the method to be accompanied with the explanation why elevation is needed.
		/// </summary>
		/// <returns>Instance of organization service</returns>
		IOrganizationService CreateSystemUserOrganizationService();

		/// <summary>
		/// Returns organization service with the specified user
		/// All usages of the method to be accompanied with the explanation why impersonation is needed.
		/// </summary>
		/// <param name="systemUserId">ID of the system user</param>
		/// <returns>Instance of organization service</returns>
		IOrganizationService CreateSpecificUserOrganizationService(Guid systemUserId);
	}
}
