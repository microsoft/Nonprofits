-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

-- CREATE AN EXTERNAL FILE FORMAT
-- FIELD_TERMINATOR: Marks the end of each field (column) in a delimited text file
-- STRING_DELIMITER: Specifies the field terminator for data of type string in the text-delimited file.
-- DATE_FORMAT: Specifies a custom format for all date and time data that might appear in a delimited text file.
-- USE_TYPE_DEFAULT: Store missing values as default for datatype.
CREATE EXTERNAL FILE FORMAT [ExternalFileFormatCSV] WITH 
(  
	FORMAT_TYPE = DELIMITEDTEXT,
    FORMAT_OPTIONS
    ( 
        FIELD_TERMINATOR = ',',
        STRING_DELIMITER = '"',
        FIRST_ROW = 2,
        DATE_FORMAT = '',
        ENCODING = 'UTF8',
        USE_TYPE_DEFAULT = False
    )
)