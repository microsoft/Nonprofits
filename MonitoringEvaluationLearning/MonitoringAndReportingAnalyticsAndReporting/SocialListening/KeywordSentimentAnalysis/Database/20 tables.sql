

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [bpst_news].[RegionLang](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[Region] [varchar](255) NULL,
	[MarketCode] [varchar](10) NULL,
PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


CREATE TABLE [bpst_news].[Keywords](
	[KeyID] [int] IDENTITY(1,1) NOT NULL,
	[Keyword] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[KeyID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

CREATE TABLE [bpst_news].[Synonyms](
	[Syn_ID] [int] IDENTITY(1,1) NOT NULL,
	[Syn_Description] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[Syn_ID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

CREATE TABLE [bpst_news].[MySettings](
	[MySettings_ID] [int] IDENTITY(1,1) NOT NULL,
	[Organization_Name] [varchar](50) NULL,
	[AreaOfConcern] [varchar](255) NULL,
	[Brand_image_URL] [varchar](255) NULL,
	[Keywords] [varchar](255) NULL,
	[Synonyms] [varchar](255) NULL,
	[NewsInput] [varchar](255) NULL,
	[Region] [varchar](100) NULL,
	[MarketCode] [varchar](10) NULL,
	[LCL] [float] NULL,
	[UCL] [float] NULL,
PRIMARY KEY CLUSTERED 
(
	[MySettings_ID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


Alter table [bpst_news].[entities]
add  [entityType_id] [int] NULL
GO

