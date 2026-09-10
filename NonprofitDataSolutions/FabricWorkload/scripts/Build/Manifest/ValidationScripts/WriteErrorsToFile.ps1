# Function to write errors to file
param (
	[string]$errors,
	[string]$outputDirectory
)

try
{
	if (-not($errors -and $outputDirectory))
	{
		throw "Invalid input"
	}

	$ValidationErrorsFile = "ValidationErrors.txt"
	$outputFile = Join-Path -Path $outputDirectory -ChildPath $ValidationErrorsFile

	$errors | Out-File -FilePath $outputFile -Append
}
catch
{
	Write-Host "An error occurred:"
	Write-Host $_
}