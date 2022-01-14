# Open Data Community Kit

## 1. What is the Open Data Community Kit?

The Open Data Community Kit is a repository-based approach for a group collaborative to create an open data commons.
Open data is increasingly instrumental to solve some of the most intricate problems of the 21st century. However most open datasets today are releases of proprietary datasets made available under an open data agreement, and are still rarely the result of an open collaboration process. We hope the Open Data Community Kit will make it easier to collaborate to that end.

## 2. When should I use the Open Data Community Kit?

The Open Data Community Kit enables a community to start an open data collaboration as easily as an open source project. It is well suited if you want to share data under an open framework and enable contributions from your community.

The Open Data Community Kit includes only the basic elements necessary for an open data collaboration to work, including the handling of contributions, the agreements for sharing the open data commons, and the processes for defining key aspects of the open data commons. The Open Data Community Kit is agnostic of where the open data commons is actually hosted.


## 3. What is an open data commons and what kind of data can it contain?

One can think about an open data commons as a dataset and associated metadata assembled from the data contributions of many and shared under an open framework. 

Suitable types of data include organizational data, anonmymized data with no personal data.


## 4. Should I modify the Open Data Community Kit to fit my needs?

Probably not, or at least not until your open data commons has grown to a point where the current framework is no longer sufficient.

We designed the Open Data Community Kit as a ready-to-go package to meet the needs of many open data commons, especially in their early stages. Before you modify the kit, please consider the following aspects:
- speed: time spent fine tuning the framework is likely to delay the start of a collaboration, and may be better spent growing the community or defining the collaboration on a technical or functional level;
- simplicity and support: by relying on a default framework, you have access to the community behind that framework. Chances are they have encountered your issue before and can help you;
- predictability: modifying the framework may invite further requests for modification, making the whole exercise more unpredictable.

That being said, be particularly cautious about the following aspects:
- data agreement: the Open Data Community Kit default data agremeent is the [CDLA-Permissive-2.0](https://cdla.dev/permissive-2-0/). This agreement has several benefits: it is straghtforward to read and understand, makes it easy to collect and assemble data into larger datasets, creates a clear framework for Machine Learning and is legally sound, with the backing of many high profile entities. Consider these benefits before changing to another agreeement.
- adding legal requirements: be careful not to inadvertently add legal requirements on top of those in the data agreement itself. For example, there is no attributution requirement in the CDLA-Permissive-2.0, so don't add one to your project (unless that's really your goal!);
- the governance framework: the governance model for the Open Data Community Kit gives full control to the Data Commons Maintainer. You may want to revisit the model as the project evolves, but you may appreciate the flexibility and control at the early stages of the project.

If you think the project can be improved, feel free to make suggestions and issue a pull request.

## 5. My project has grown. I need a more sophisticated framework. What do I do?

You have several options depending on your situation.
- if you need a two-tier level governance, one at an organization-level and one for potentially multiple projects, the [Minimal Viable Governance](https://github.com/github/MVG) framework may be relevant. 
- if you need to expand beyond open data and create open source software or a technical specification, the [Joint Development Foundation](https://www.jointdevelopment.org/) may suit your needs.
- if you need to formalize the project, form a corporate entity and collect fees to provide financial resources to the project, consider exploring how existing foundations can help you, such as the [Open Data Institute](https://theodi.org/) or the [Linux Foundation](https://www.linuxfoundation.org/).

## 6. Where can I start?

Instructions for using the Open Data Community Kit are provided in the [GettingStarted.md](GettingStarted.md) file.
