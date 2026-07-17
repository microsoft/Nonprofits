# Networking Modules

This folder contains the bounded networking profiles for Azure Landing Zone V2.

Current modules:

- `foundation-network-profile.bicep`: orchestrates the optional Foundation VNet, subnet layout, and Key Vault private connectivity path
- `foundation-network-resources.bicep`: creates the Foundation VNet, subnets, private DNS zone, virtual network link, and Key Vault private endpoint resources in the Foundation network resource group
- `expanded-network-profile.bicep`: orchestrates the bounded Expanded Platform hub network and optional advanced networking features
- `expanded-hub-network-resources.bicep`: creates the Expanded Platform hub VNet, optional GatewaySubnet reservation, and private Key Vault connectivity

Implementation notes:

- Foundation networking is disabled by default.
- Foundation networking never creates hub-and-spoke resources.
- The Foundation application subnet is private and uses a no-cost NSG that blocks internet ingress and egress. Workload teams must add narrowly scoped allow rules and an explicit outbound method when their workloads require them.
- Expanded Platform always creates one dedicated hub VNet in the connectivity subscription.
- Optional Expanded Platform networking features are bounded to GatewaySubnet reservation and Key Vault private connectivity.
- The deployment does not create peering between Foundation and Expanded Platform. Organizations that want to peer an existing Foundation VNet to a new Expanded hub can follow the manual peering runbook (`docs/runbooks/foundation-to-expanded-peering.md`).
- Private connectivity is limited to the shared platform Key Vault in this implementation.
- In Foundation, private Key Vault connectivity requires the simple network baseline.
- NAT Gateway, route-based centralized egress, Azure Firewall, and paid DDoS protection remain outside the Foundation baseline.