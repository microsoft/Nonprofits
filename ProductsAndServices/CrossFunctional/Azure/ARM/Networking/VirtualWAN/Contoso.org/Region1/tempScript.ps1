
$TemplatePathVNET104="C:\Users\willst\Downloads\Network\Site1\af_vnet_azuredeploy_template_Site1_services_A.json"

$ParametersPathVNET104="C:\Users\willst\Downloads\Network\Site1\af_vnet_azuredeploy_parameters_Site1_services_A.json"


Test-AzureRmResourceGroupDeployment  -ResourceGroupName $ResourceGroupName_vnet104 -TemplateFile $TemplatePathVNET104 -TemplateParameterFile $ParametersPathVNET104;

New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $ResourceGroupName_vnet104 -Templatefile $TemplatePathVNET104 -TemplateParameterfile $ParametersPathVNET104;
