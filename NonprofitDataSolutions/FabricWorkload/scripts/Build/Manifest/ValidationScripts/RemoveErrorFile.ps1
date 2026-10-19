# Function to write errors to file
param (
    [string]$outputDirectory
)

try
{
    if (-not($outputDirectory))
    {
        throw "Invalid input"
    }

    $ValidationErrorsFile = "ValidationErrors.txt"
    $outputFile = Join-Path -Path $outputDirectory -ChildPath $ValidationErrorsFile

    if (Test-Path $outputFile)
    {
        Remove-Item $outputFile
    }
}
catch
{
    Write-Host "An error occurred:"
    Write-Host $_
}