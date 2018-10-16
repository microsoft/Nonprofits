# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.
$Environment = 'AzureCloud'
$Environment = 'AzureUSGovernment'

Login-AzureRmAccount -Environment $Environment
$subscription = Get-AzureRmSubscription |  Out-GridView -PassThru
Set-AzureRmContext -SubscriptionId $subscription.Id
Write-Host "Successfully logged in to Azure." -ForegroundColor Green 

$site=1



if($site -eq 1){
$VPNGWResourceGroup=Get-AzureRMResourceGroup | Out-GridView -PassThru -title "vnet104, aka Site 1, Services"

}
if($site -eq 2){
$VPNGWResourceGroup=Get-AzureRMResourceGroup | Out-GridView -PassThru -title "vnet204, aka Site 2, Services"

}
if($site -eq 3){
$VPNGWResourceGroup=Get-AzureRMResourceGroup | Out-GridView -PassThru -title "vnet304, aka Site 3, Services"

}
if($site -eq 4){
$VPNGWResourceGroup=Get-AzureRMResourceGroup | Out-GridView -PassThru -title "vnet404, aka Site 4, Services"
$VPNGWName=$VPNGWName4
}

$VPNGW= Get-AzureRMVirtualNetworkGateway -ResourceGroupName $VPNGWResourceGroup.ResourceGroupName | Out-GridView -PassThru -title "Select the Gateway"
ForEach($GW in $VPNGW){
    Write-Output "Name: "$GW.Name "Provisioning State: "$GW.ProvisioningState "BGP Enabled: " $gw.EnableBgp "BGP Settings:" $gw.BgpSettings

    #check if resetting the gateway will clear a failed provisioning state
    if($GW.ProvisioningState -eq 'Failed'){
        Reset-AzureRmVirtualNetworkGateway -VirtualNetworkGateway $GW
    }

    #Is Routing Working?
        $VPNPeerStatus = Get-AzureRmVirtualNetworkGatewayBGPPeerStatus -ResourceGroupName $VPNGWResourceGroup.ResourceGroupName -VirtualNetworkGatewayName $GW.Name
        $VPNLearnedRoutes = Get-AzureRmVirtualNetworkGatewayLearnedRoute  -ResourceGroupName $VPNGWResourceGroup.ResourceGroupName -VirtualNetworkGatewayName $GW.Name
        $VPNLearnedRoutes|Format-Table
}

#LocalNetworkConnection - The location we are connecting to's details.
$LocalGWs = Get-AzureRmLocalNetworkGateway -ResourceGroupName $VPNGWResourceGroup.ResourceGroupName
foreach($LocalGW in $localGWs){
    Write-Output "LocalNetworkGateway: " $LocalGW.Name "Gateway Address: " $LocalGW.GatewayIpAddress "BGP Settings: " $localgw.BgpSettings

}


#The VNET's Gateway, what allows traffic from other locations into the VNET

$VPNConnections = Get-AzureRmVirtualNetworkGatewayConnection -ResourceGroupName $VPNGWResourceGroup.ResourceGroupName

foreach($Connection in $VPNConnections){
$connectionDetails = Get-AzureRmVirtualNetworkGatewayConnection -ResourceGroupName $VPNGWResourceGroup.ResourceGroupName -name $Connection.name
$ConnectionDetails

}

#Now can we see what happens between a Source and Destination IP?
$NIC1 =
$NIC2 =

#what do we want to see?
Write-output "gateway BGP:  " $VPNGW[0].BgpSettingsText
Write-Output "gateway.EnableBgp: "$VPNGW[0].EnableBgp
Write-Output "Connection BGP: "$VPNConnections[0].EnableBgp
Write-Output "connection Status: " $VPNConnections[0].TunnelConnectionStatus
Write-output "VPN Peer Status: " $VPNPeerStatus.Asn $VPNPeerStatus.Neighbor $VPNPeerStatus.State

$i=0


#Actions



#Set-AzureRmVirtualNetworkGateway -VirtualNetworkGateway $VPNGW[0] -Asn "65523"
$VPNConnections = Set-AzureRmVirtualNetworkGatewayConnection -VirtualNetworkGatewayConnection $VPNConnections[0] -EnableBgp 1


#Reset-AzureRmVirtualNetworkGateway -VirtualNetworkGateway $VPNGW[1] 