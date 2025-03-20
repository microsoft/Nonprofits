using Microsoft.Xrm.Sdk;
using NUnit.Framework;

namespace Plugins.Tests.Mock
{
	class TestTracingService : ITracingService
	{
		public void Trace(string format, params object[] args)
		{
			TestContext.WriteLine(string.Format(format, args)); // CodeQL [SM02988] False Positive: CodeQL wrongly detected
		}
	}
}