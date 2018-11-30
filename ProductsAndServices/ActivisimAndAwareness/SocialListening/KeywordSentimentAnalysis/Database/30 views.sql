

Alter VIEW [bpst_news].[vw_FullEntities]
AS
SELECT        documentId AS [Document Id], entityType AS [Entity Type], entityValue AS [Entity Value], 
			 offset AS [Offset], offsetDocumentPercentage AS [Offset Document Percentage], 
			 [length] AS [Lenth], 
			 entityType + entityValue AS [Entity Id], 
             CASE WHEN entityType_id = 8 THEN 'fa fa-certificate' 
			 WHEN entityType_id = 4 THEN 'fa fa-certificate'
			 WHEN entityType_id = 1 THEN 'fa fa-male' 
			  WHEN entityType_id = 5 THEN 'fa fa-male'
			  WHEN entityType_id = 3 THEN 'fa fa-sitemap' 
			  WHEN entityType_id = 7 THEN 'fa fa-sitemap' 
			  WHEN entityType_id = 2 THEN 'fa fa-globe' 
			  WHEN entityType_id = 6 THEN 'fa fa-globe'
			   ELSE NULL END [Entity Class], 
              
			  CASE WHEN entityType_id = 8 THEN '#FFFFFF'
			   WHEN entityType_id = 4 THEN '#FFFFFF'
			    WHEN entityType_id = 1 THEN '#1BBB6A' 
				WHEN entityType_id = 5 THEN '#1BBB6A' 
				WHEN entityType_id = 3 THEN '#FF001F' 
				WHEN entityType_id = 7 THEN '#FF001F'
				WHEN entityType_id = 2 THEN '#FF8000' 
				WHEN entityType_id = 6 THEN '#FF8000' 
				ELSE NULL END [Entity Color]
FROM            bpst_news.entities

	
UNION ALL
SELECT        [entities].documentId AS [Document Id], [entities].entityType AS [Entity Type], [entities].entityValue AS [Entity Value], [entities].offset AS [Offset], [entities].offsetDocumentPercentage AS [Offset Document Percentage], 
                         [entities].[length] AS [Lenth], [entities].entityType + [entities].entityValue AS [Entity Id], [types].icon AS [Entity Class], [types].color AS [Entity Color]
FROM            bpst_news.userdefinedentities AS entities INNER JOIN
                         bpst_news.typedisplayinformation AS [types] ON [entities].entityType = [types].entityType;
GO


