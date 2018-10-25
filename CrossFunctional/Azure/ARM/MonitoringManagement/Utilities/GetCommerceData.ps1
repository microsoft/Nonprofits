Function Get-DateRange 
{   
 [System.Reflection.Assembly]::LoadWithPartialName("System.windows.forms") | 
 out-null 
  
 $WinForm = New-Object Windows.Forms.Form   
 $WinForm.text = "Calendar Control"   
 $WinForm.Size = New-Object Drawing.Size(812,280) 

 $Calendar = New-Object System.Windows.Forms.MonthCalendar   
 $Calendar.MaxSelectionCount = 356     
 $Calendar.SetCalendarDimensions([int]2,[int]1) 
 $WinForm.Controls.Add($Calendar)   
  
 $WinForm.Add_Shown($WinForm.Activate())  
 $WinForm.showdialog() | Out-Null  
 $Calendar.SelectionRange 
} #end function Get-DateRange 

# *** Entry point to script *** 
$dates = Get-DateRange 
"Start Date: " + ($dates.Start).tostring("dd-MM-yyyy") 
"End Date: " + ($dates.End ).tostring("dd-MM-yyyy")

$startTime = 8/1/17
$TimeRange = Get-DateRange

#Get-AzureRmResourceProvider -ListAvailable | Where-Object { $_.ProviderNamespace -eq "Microsoft.Commerce" }
$UsageDetails = Get-UsageAggregates -ReportedStartTime $TimeRange.Start -ReportedEndTime $TimeRange.End -AggregationGranularity Daily -ShowDetails $true -ContinuationToken $null
$usageDetails | export-csv -path 'c:\temp\txdot\subUsage1.csv'