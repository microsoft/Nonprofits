
-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

-- CREATE AN EXTERNAL FILE FORMAT
CREATE EXTERNAL FILE FORMAT [ExternalFileFormatParquet] WITH 
(  
	FORMAT_TYPE = PARQUET,
	DATA_COMPRESSION = 'org.apache.hadoop.io.compress.SnappyCodec'
)