SELECT Count(*) AS ExistingObjectCount
FROM
    INFORMATION_SCHEMA.TABLES
WHERE
    table_schema = 'pbist_twitter' AND
    table_name IN ('configuration', 'date', 'tweets_processed', 'tweets_normalized', 'hashtag_slicer', 'mention_slicer', 'entity_graph', 'authorhashtag_graph', 
                   'authormention_graph', 'entities', 'entities2', 'twitter_query');