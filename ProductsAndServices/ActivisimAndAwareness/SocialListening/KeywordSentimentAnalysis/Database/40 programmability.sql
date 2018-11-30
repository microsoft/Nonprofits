GO

alter PROCEDURE [bpst_news].[sp_write_document]
	-- Document parameters
	@docid NCHAR(64),
	@text NVARCHAR(max) NULL,
	@textLength INT NULL,
	@cleanedText NVARCHAR(max) NULL,
	@cleanedTextLength int NULL,
	@title NVARCHAR(2000) NULL,
	@sourceUrl NVARCHAR(2000) NULL,
	@sourceDomain NVARCHAR(1000) NULL,
	@category NVARCHAR(150) NULL,
	@imageUrl NVARCHAR(max) = NULL,
	@imageWidth INT = NULL,
	@imageHeight INT = NULL,
	@abstract NVARCHAR(4000) NULL,

	-- Published Timestamp
	@publishedTimestamp datetime,
	@publishedMonthPrecision datetime,
	@publishedWeekPrecision datetime,
	@publishedDayPrecision datetime,
	@publishedHourPrecision datetime,
	@publishedMinutePrecision datetime,

	-- Ingest Timestamp

	@ingestTimestamp NVARCHAR(100),

	@ingestMonthPrecision datetime,
	@ingestWeekPrecision datetime,
	@ingestDayPrecision datetime,
	@ingestHourPrecision datetime,
	@ingestMinutePrecision datetime,

	-- Sentiment
	@sentimentScore float,

	-- Key Phrases
	@keyPhraseJson NVARCHAR(max),

	-- User Defined Entities
	@userDefinedEntities NVARCHAR(max)
AS
BEGIN

	DECLARE @tmp DATETIME
     SET @tmp = GETDATE()

	 Set @ingestTimestamp  = @tmp;


	set @ingestMonthPrecision = @tmp;
	Set @ingestWeekPrecision = @tmp;
	Set @ingestDayPrecision = @tmp;
	Set @ingestHourPrecision = @tmp;
	Set @ingestMinutePrecision = @tmp;
	DECLARE @list varchar(8000)
	DECLARE @pos INT
	DECLARE @len INT
	DECLARE @value varchar(8000)
	

	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	-- Set XACT_ABORT to roll back any open transactions for most errors
	SET XACT_ABORT, NOCOUNT ON

	BEGIN TRANSACTION

	BEGIN TRY
		DELETE FROM [bpst_news].[documents] WHERE id = @docid;

		INSERT INTO [bpst_news].[documents] 
		( id, text, textLength,	cleanedText, cleanedTextLength, abstract, title, sourceUrl, sourceDomain, category, imageUrl, imageWidth, imageHeight )
		VALUES
		( @docid, @text, @textLength, @cleanedText, @cleanedTextLength, @abstract, @title, @sourceUrl, @sourceDomain, @category, @imageUrl, @imageWidth, @imageHeight );

		DELETE FROM [bpst_news].[documentpublishedtimes] WHERE id = @docid;
		INSERT INTO [bpst_news].[documentpublishedtimes]
		( id, "timestamp", monthPrecision, weekPrecision, dayPrecision, hourPrecision, minutePrecision )
		VALUES
		( @docId, @publishedTimestamp, @publishedMonthPrecision, @publishedWeekPrecision, @publishedDayPrecision, @publishedHourPrecision, @publishedMinutePrecision );

		DELETE FROM [bpst_news].[documentingestedtimes] WHERE id = @docid;
		INSERT INTO [bpst_news].[documentingestedtimes]
		( id, "timestamp", monthPrecision, weekPrecision, dayPrecision, hourPrecision, minutePrecision )
		VALUES
		( @docId, CONVERT(DATETIME, left(@ingestTimestamp,23)), @ingestMonthPrecision, @ingestWeekPrecision, @ingestDayPrecision, @ingestHourPrecision, @ingestMinutePrecision );

		
		Declare @LCL float;
		Declare @UCL float;

		SELECT @LCL = LCL, @UCL = UCL,@list = Keywords from [bpst_news].MySettings order by MySettings_ID Asc;
		
		if(@sentimentScore >= @LCL and @sentimentScore <= @UCL)
		BEGIN
		  DELETE FROM [bpst_news].[documentsentimentscores] WHERE id = @docid;
		  INSERT INTO [bpst_news].[documentsentimentscores] (id, score) VALUES ( @docid, @sentimentScore );
		END

		DELETE FROM [bpst_news].[documentkeyphrases] WHERE documentId = @docid;

		INSERT INTO [bpst_news].[documentkeyphrases] (documentId, phrase)
		SELECT @docid AS documentId, value AS phrase
		FROM OPENJSON(@keyPhraseJson);


		set @pos = 0
		set @len = 0
		SET @list = @list + ',';
		WHILE CHARINDEX(',', @list, @pos+1)>0
		BEGIN
			set @len = CHARINDEX(',', @list, @pos+1) - @pos
			set @value = SUBSTRING(@list, @pos, @len)
            
			   
			if CHARINDEX(@value,@title) > 0
			BEGIN
				DELETE FROM [bpst_news].[documentsearchterms] WHERE documentId = @docid;
				insert into  [bpst_news].[documentsearchterms](documentId,searchterms) 
				select @docid,@value;
			END
			--DO YOUR MAGIC HERE

		   set @pos = CHARINDEX(',', @list, @pos+@len) +1
		END


		DELETE FROM [bpst_news].[userdefinedentities] WHERE documentId = @docid;
		INSERT INTO [bpst_news].[userdefinedentities] (documentId, entityType, entityValue, offset, offsetDocumentPercentage, [length])
		SELECT @docid AS documentId, *
		FROM OPENJSON(@userDefinedEntities)
		WITH (
			entityType nvarchar(30) '$.type',
		    entityValue nvarchar(max) '$.value',
			offset int '$.position',
			offsetDocumentPercentage float '$.positionDocumentPercentage',
			[length] int '$.lengthInText'
		)

		COMMIT TRANSACTION;
	END TRY
	BEGIN CATCH
		IF @@trancount > 0 ROLLBACK TRANSACTION
		DECLARE @msg nvarchar(2048) = error_message()
		RAISERROR (@msg, 16, 1)
	END CATCH
END;
GO




create procedure [bpst_news].[spClearExistingData]
AS
BEGIN
	TRUNCATE TABLE bpst_news.documents;
	TRUNCATE TABLE bpst_news.documentpublishedtimes;
	TRUNCATE TABLE bpst_news.documentkeyphrases;
	TRUNCATE TABLE bpst_news.documentingestedtimes;
	TRUNCATE TABLE bpst_news.documentsearchterms;
	TRUNCATE TABLE bpst_news.documentsentimentscores;
	TRUNCATE TABLE bpst_news.documenttopicimages;
	TRUNCATE TABLE bpst_news.documenttopics;
	TRUNCATE TABLE bpst_news.entities;
	TRUNCATE TABLE bpst_news.topickeyphrases;

    TRUNCATE TABLE bpst_news.stg_entities;
    TRUNCATE TABLE bpst_news.stg_documenttopics;
    TRUNCATE TABLE bpst_news.stg_documenttopicimages;
    TRUNCATE TABLE bpst_news.stg_documentcompressedentities;
END
GO

CREATE PROC [bpst_news].[sp_KeywordsUpdate] AS
  DECLARE @Keyword VARCHAR(255)  
  SELECT @Keyword = COALESCE(@Keyword + ', ', '') + Keyword FROM bpst_news.Keywords
UPDATE bpst_news.MySettings SET Keywords = @Keyword;
GO

CREATE PROC [bpst_news].[sp_SynonymsUpdate] AS
  DECLARE @Synonym VARCHAR(255)  
  SELECT @Synonym = COALESCE(@Synonym + ', ', '') + Syn_Description FROM bpst_news.Synonyms
UPDATE bpst_news.MySettings SET Synonyms = @Synonym;
GO





