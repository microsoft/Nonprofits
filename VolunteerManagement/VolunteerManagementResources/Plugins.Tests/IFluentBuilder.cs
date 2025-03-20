namespace Plugins.Tests
{
	/// <summary>
	/// Fluent builder.
	/// </summary>
	/// <typeparam name="TOutputClass">Type of the output class.</typeparam>
	public interface IFluentBuilder<TOutputClass>
	{
		/// <summary>
		/// Builds an instance of the output class.
		/// </summary>
		/// <returns>An instance of the output class.</returns>
		TOutputClass Build();
	}
}
