# coding=utf-8

import pyodbc
import twitter
import sys
import pdb
import time
import datetime
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk import tokenize
import time
import math
import string
import re
import os
import json

nltk.download('punkt')
nltk.download('vader_lexicon')

# read the queue message and write to stdout
input = open(os.environ['req']).read()
#message  ="Python script processed queue message '{0}'".format(input)
#print(message)

### Testing the Function with diffrent tweets
#foo = '{"TweetText":"RT @GameOfThrones: 2 days. #GameofThroneshttps://t.co/7slYhtamj2","TweetId":"4578893783","CreatedAt":"Fri Jun 17 20:58:35 +0000 2016","RetweetCount":4341,"TweetedBy":"FerreiraLupe","MediaUrls":[],"TweetLanguageCode":"en","TweetInReplyToUserId":"","Favorited":false,"UserMentions":[{"Id":4578893780,"FullName":"Game Of Thrones","UserName":"GameOfThrones"}],"OriginalTweet":{"TweetText":"2 days. #GameofThroneshttps://t.co/7slYhtamj2","TweetId":"743814101848072193","CreatedAt":"Fri Jun 17 14:34:35 +0000 2016","RetweetCount":4341,"TweetedBy":"GameOfThrones","MediaUrls":[],"TweetLanguageCode":"en","TweetInReplyToUserId":"","Favorited":false,"UserMentions":[],"UserDetails":{"FullName":"Game Of Thrones","Location":"HBO","Id":180463340,"UserName":"GameOfThrones","FollowersCount":3585669,"Description":"Tweet what is yours. #GameofThrones Season 6 premieres 4.24.16.","StatusesCount":56300,"FriendsCount":41473,"FavouritesCount":5202,"ProfileImageUrl":"https://pbs.twimg.com/profile_images/702545332475981824/Mg7TpOaw_normal.jpg"}},"UserDetails":{"FullName":"LUPE °","Location":"Paraguay","Id":57978911,"UserName":"FerreiraLupe","FollowersCount":769,"Description":"Snap:ferreiralupe - exa 2013","StatusesCount":10551,"FriendsCount":750,"FavouritesCount":249,"ProfileImageUrl":"https://pbs.twimg.com/profile_images/707056425399410688/YqxqNhaU_normal.jpg"}}'
#foo = '{"TweetText":"#news Bank of England could cut rates further, MPC member McCafferty says https://t.co/7fNPS9ZVYV #til_now #CNBC","TweetId":"762811693235712001","CreatedAt":"Tue Aug 09 00:44:14 +0000 2016","RetweetCount":0,"TweetedBy":"til_now","MediaUrls":[],"TweetLanguageCode":"en","TweetInReplyToUserId":"","Favorited":false,"UserMentions":[],"OriginalTweet":null,"UserDetails":{"FullName":"Latest Top News","Location":"","Id":210727757,"UserName":"til_now","FollowersCount":1151,"Description":"Latest Top News Worldwide from Many Authentic Sources.","StatusesCount":2562307,"FriendsCount":0,"FavouritesCount":0,"ProfileImageUrl":"https://pbs.twimg.com/profile_images/1157097206/artician_bigger_bigger_normal.png"}}'
#outbound = '{"TweetText":"tes test","TweetId":"762903960734740481","CreatedAt":"Tue Aug 09 06:50:52 +0000 2016","RetweetCount":0,"TweetedBy":"soltemptest","MediaUrls":[],"TweetLanguageCode":"et","TweetInReplyToUserId":"","Favorited":false,"UserMentions":[],"OriginalTweet":null,"UserDetails":{"FullName":"Test Test","Location":"","Id":227829587,"UserName":"soltemptest","FollowersCount":0,"Description":"","StatusesCount":3,"FriendsCount":1,"FavouritesCount":0,"ProfileImageUrl":"https://abs.twimg.com/sticky/default_profile_images/default_profile_1_normal.png"}}'
#inboundreply = '{"TweetText":"@soltemptest test","TweetId":"762902665407758336","CreatedAt":"Tue Aug 09 06:45:44 +0000 2016","RetweetCount":0,"TweetedBy":"mohaali45","MediaUrls":[],"TweetLanguageCode":"en","TweetInReplyToUserId":"762898558211141633","Favorited":false,"UserMentions":[{"Id":762898558211141600,"FullName":"Test Test","UserName":"soltemptest"}],"OriginalTweet":null,"UserDetails":{"FullName":"Mohammad Ali","Location":"Redmond, WA","Id":3285893316,"UserName":"mohaali45","FollowersCount":8,"Description":"Program Manager for C+E Business Applications platform intelligence and Power BI","StatusesCount":26,"FriendsCount":45,"FavouritesCount":18,"ProfileImageUrl":"https://pbs.twimg.com/profile_images/670524640477908992/ZLmyAa2B_normal.jpg"}}'
#outboundreply = '{"TweetText":"@mohaali45 further test","TweetId":"762902823923163136","CreatedAt":"Tue Aug 09 06:46:21 +0000 2016","RetweetCount":0,"TweetedBy":"soltemptest","MediaUrls":[],"TweetLanguageCode":"en","TweetInReplyToUserId":"3285893316","Favorited":false,"UserMentions":[{"Id":3285893316,"FullName":"Mohammad Ali","UserName":"mohaali45"}],"OriginalTweet":null,"UserDetails":{"FullName":"Test Test","Location":"","Id":762898558211141600,"UserName":"soltemptest","FollowersCount":0,"Description":"","StatusesCount":2,"FriendsCount":1,"FavouritesCount":0,"ProfileImageUrl":"https://abs.twimg.com/sticky/default_profile_images/default_profile_1_normal.png"}}'
#inboundreplyRT = '{"TweetText":"RT @mohaali45: @soltemptest test","TweetId":"762909595551490048","CreatedAt":"Tue Aug 09 07:13:16 +0000 2016","RetweetCount":1,"TweetedBy":"JustynaLucznik","MediaUrls":[],"TweetLanguageCode":"en","TweetInReplyToUserId":"","Favorited":false,"UserMentions":[{"Id":3285893316,"FullName":"Mohammad Ali","UserName":"mohaali45"},{"Id":762898558211141600,"FullName":"Test Test","UserName":"soltemptest"}],"OriginalTweet":{"TweetText":"@soltemptest test","TweetId":"762902665407758336","CreatedAt":"Tue Aug 09 06:45:44 +0000 2016","RetweetCount":1,"TweetedBy":"mohaali45","MediaUrls":[],"TweetLanguageCode":"en","TweetInReplyToUserId":"762898558211141633","Favorited":false,"UserMentions":[{"Id":762898558211141600,"FullName":"Test Test","UserName":"soltemptest"}],"UserDetails":{"FullName":"Mohammad Ali","Location":"Redmond, WA","Id":3285893316,"UserName":"mohaali45","FollowersCount":8,"Description":"Program Manager for C+E Business Applications platform intelligence and Power BI","StatusesCount":27,"FriendsCount":45,"FavouritesCount":18,"ProfileImageUrl":"https://pbs.twimg.com/profile_images/670524640477908992/ZLmyAa2B_normal.jpg"}},"UserDetails":{"FullName":"Justyna Lucznik","Location":"Redmond, WA","Id":794575879,"UserName":"JustynaLucznik","FollowersCount":155,"Description":"Program Manager on the Microsoft Power BI team. Passionate about statistics, ML and data visualization.","StatusesCount":55,"FriendsCount":89,"FavouritesCount":75,"ProfileImageUrl":"https://pbs.twimg.com/profile_images/720428264976592900/HaoXXR-b_normal.jpg"}}'
#hasthag = '{"TweetText":"#soltemptest","TweetId":"762910670949982208","CreatedAt":"Tue Aug 09 07:17:32 +0000 2016","RetweetCount":0,"TweetedBy":"mohaali45","MediaUrls":[],"TweetLanguageCode":"und","TweetInReplyToUserId":"","Favorited":false,"UserMentions":[],"OriginalTweet":null,"UserDetails":{"FullName":"Mohammad Ali","Location":"Redmond, WA","Id":3285893316,"UserName":"mohaali45","FollowersCount":8,"Description":"Program Manager for C+E Business Applications platform intelligence and Power BI","StatusesCount":26,"FriendsCount":45,"FavouritesCount":18,"ProfileImageUrl":"https://pbs.twimg.com/profile_images/670524640477908992/ZLmyAa2B_normal.jpg"}}'

tweet = input.replace('\n', ' ')
tweet = json.loads(tweet)



cnxn = pyodbc.connect('DRIVER={SQL SERVER};' + os.environ["SQLAZURECONNSTR_SQLCONN"])

cursor = cnxn.cursor()  # connecting to sql server - instantiating a connection to the database

cursor.execute("select value FROM pbist_twitter.configuration where name = 'twitterHandle'")
handleNames = cursor.fetchall()
if handleNames[0][0] != None:
    handleNames = handleNames[0][0].split(',')

cursor.execute("select value FROM pbist_twitter.configuration where name = 'twitterHandleId'")
handleId =  cursor.fetchall()
if handleId[0][0] != None:
    handleId = handleId[0][0].split(',')

hashFollowers = {}
hashFollowers = dict(zip(handleId, handleNames))

if 'TweetLanguageCode' in tweet:
    if tweet['TweetLanguageCode'] == 'en':
        tweetid = tweet['TweetId']
    # Find the average sentiment for the tweet as a whole
    lines_list = tokenize.sent_tokenize(
        tweet['TweetText'])  # takes tweet text and takes out individual words and separates them into an array
    sid = SentimentIntensityAnalyzer()  # instantiates the class that will do sentiment analysis
    composite = 0  # initiates initial starting score
    for line in lines_list:
        ss = sid.polarity_scores(line)  # give you the sentiment for a line
        composite += float(ss['compound'])  # adds up all the sentiments

        # for now, just average the scores together
        sentiment = composite / len(lines_list)  # finds average sentiment
        sentimentBin = math.floor(sentiment * 10) / 10.0  # discretiez score
        if sentiment > 0:
            sentimentPosNeg = 'Positive'
        elif sentiment < 0:
            sentimentPosNeg = 'Negative'
        else:
            sentimentPosNeg = 'Neutral'
            msftaccount = ''  # only applicable if following accounts - checking tweet - whether it was sent to account, from account , etc.
        directiontweet = ''
        # store normalized masterid - the tweets store the info of the normalized forms
        # Calculate the direction of the tweet - first if block is for RT, else statement is for raw tweets
        msftaccount = 'unknown'
        if tweet['OriginalTweet'] is not None:  # if retweet then go into this block
            directiontweet = 'RTText'
            for key,val in hashFollowers.items():
                if '#' + val.lower() in tweet['TweetText'].lower():
                    msftaccount = hashFollowers[key]
                    directiontweet = 'RThashtag'
            if str(tweet['UserDetails']['Id']) in hashFollowers:
                # direct RT out from core account
                msftaccount = hashFollowers[str(tweet['UserDetails']['Id'])]  # is ID of tweet from core account - then we know it's outbound
                directiontweet = 'outboundRT'
            elif tweet['OriginalTweet']['TweetInReplyToUserId'] in hashFollowers:  # someone responding - inbound
                msftaccount = hashFollowers[tweet['OriginalTweet']['TweetInReplyToUserId']]
                directiontweet = 'inboundReplyRT'
            elif str(tweet['OriginalTweet']['UserDetails']['Id']) in hashFollowers:
                msftaccount = hashFollowers[str(tweet['OriginalTweet']['UserDetails']['Id'])]
                directiontweet = 'RTofoutbound'
            else:
                # if 'entities' in tweet['OriginalTweet']:
                if 'UserMentions' in tweet['OriginalTweet']:
                    for uid in tweet['OriginalTweet']['UserMentions']:
                        if str(uid['Id']) in hashFollowers:
                            msftaccount = hashFollowers[str(uid['Id'])]
                            directiontweet = 'inboundRT'
                        

            # This is a retweet
            masterid = tweet['OriginalTweet']['TweetId']  # needs to stay!! Master ID of tweet - if you have a retweet, it will reference some other tweet, 2 ids will be present - master id is always original tweet, we only want to analyze it once
            # check if the tweet already is registered
            cnt = cursor.execute('select count(1) from pbist_twitter.tweets_normalized where masterid = ?', masterid).fetchone()[0]  # checking if master id already exists - if doesn't puts it in + annotations
            if cnt == 0:
                cursor.execute(
                    "insert into pbist_twitter.tweets_normalized (masterid, tweet, twitterhandle, sentiment, lang, sentimentBin, sentimentPosNeg, accounttag) values (?,?,?,?,?,?,?,?)",
                    masterid, tweet['OriginalTweet']['TweetText'], tweet['OriginalTweet']['UserDetails']['UserName'],
                    sentiment, tweet['OriginalTweet']['TweetLanguageCode'], sentimentBin, sentimentPosNeg,
                    msftaccount)  # insterting everything into normalized tables (about base tweets not retweets)
        else:
            # this is not a retweet
            directiontweet = 'Text'
            for key,val in hashFollowers.items():
                if '#' + val.lower() in tweet['TweetText'].lower():
                    msftaccount = hashFollowers[key]
                    directiontweet = 'hashtag'
            if str(tweet['UserDetails']['Id']) in hashFollowers:
                msftaccount = hashFollowers[str(tweet['UserDetails']['Id'])]
                directiontweet = 'outbound'
                if 'TweetInReplyToUserId' in tweet:
                    if tweet['TweetInReplyToUserId'] != '':
                        directiontweet = 'outboundReply'
            elif tweet['TweetInReplyToUserId'] in hashFollowers:
                msftaccount = hashFollowers[tweet['TweetInReplyToUserId']]
                directiontweet = 'inboundReply'
            else:
                if tweet['UserMentions'] != []:
                    for uid in tweet['UserMentions']:
                        if str(uid['Id']) in hashFollowers:
                            msftaccount = hashFollowers[str(uid['Id'])]
                            directiontweet = 'inbound'

            masterid = tweet['TweetId']
            cnt = cursor.execute('select count(1) from pbist_twitter.tweets_normalized where masterid = ?', masterid).fetchone()[0]  # checking if master id already exists - if doesn't puts it in + annotations
            if cnt == 0:
                cursor.execute(
                    "insert into pbist_twitter.tweets_normalized (masterid, tweet, twitterhandle, sentiment, lang, sentimentBin, sentimentPosNeg, accounttag) values (?,?,?,?,?,?,?,?)",
                    masterid, tweet['TweetText'], tweet['UserDetails']['UserName'], sentiment, tweet['TweetLanguageCode'],
                    sentimentBin, sentimentPosNeg, msftaccount)
        if msftaccount == 'unknown':
            logErr = open('err.log', 'a')
            logErr.write(str(tweet) + '\n')
            logErr.close()
    firsturl = None  # Dahsbord grabbing a no. of urls - image profile, url associated with tweet, could be list of images, only grab first one
    ts = time.mktime(datetime.datetime.strptime(tweet['CreatedAt'], '%a %b %d %H:%M:%S +0000 %Y').timetuple())
    timestamp = datetime.datetime.fromtimestamp(ts)
    hourofdate = datetime.datetime(timestamp.year, timestamp.month, timestamp.day, timestamp.hour)
    minuteofdate = datetime.datetime(timestamp.year, timestamp.month, timestamp.day, timestamp.hour, timestamp.minute)

    username = ''
    usrfollowercnt = 0
    usrfavoritedcnt = 0
    usrfriendcnt = 0
    usrtotaltweets = 0
    if 'UserDetails' in tweet:
        profileimg = tweet['UserDetails']['ProfileImageUrl']  # pulling things out of json
        username = tweet['UserDetails']['UserName']
        usrfollowercnt = tweet['UserDetails']['FollowersCount']
        usrfavoritedcnt = tweet['UserDetails']['FavouritesCount']
        usrfriendcnt = tweet['UserDetails']['FriendsCount']
        usrtotaltweets = tweet['UserDetails']['StatusesCount']
#    if 'entities' in tweet:
    if tweet['MediaUrls'] != []:
        #if len(tweet['MediaUrls']) > 0:
        # just grab the first one for right now
        firsturl = tweet['MediaUrls'][0] # first url getting populated - 0 index of entitites media
    if firsturl is not None:
        imageurl = firsturl
    else:
        imageurl = None
    favorited = 0
    if 'Favorited' in tweet:
        if tweet['Favorited']:
            favorited = 1
    retweet = 'False'
    if 'OriginalTweet' in tweet:
        retweet = 'True'
    cursor.execute(
        "insert into pbist_twitter.tweets_processed (tweetid, masterid, image_url, dateorig, authorimage_url, username, hourofdate, minuteofdate, direction, favorited, retweet, user_followers, user_friends, user_favorites, user_totaltweets) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        tweet['TweetId'], masterid, imageurl, timestamp, profileimg, username, hourofdate, minuteofdate, directiontweet,
        favorited, retweet, usrfollowercnt, usrfriendcnt, usrfavoritedcnt,
        usrtotaltweets)  # Tweets processed table - every tweet
    # split out the hashtags from the text
    if '#' in tweet['TweetText']:
        for part in tweet['TweetText'].split('#')[1:]:
            if len(part.strip()) > 0:
                # part = part.translate(string.maketrans("",""), string.punctuation)
                cursor.execute('insert into pbist_twitter.hashtag_slicer (tweetid, facet) values (?,?)', tweet['TweetId'],
                               part.split()[0])
        if '@' in tweet['TweetText']:
            for part in tweet['TweetText'].split('@')[1:]:
                if len(part.strip()) > 0:
                    # part = part.translate(None, string.punctuation)
                    cursor.execute('insert into pbist_twitter.mention_slicer (tweetid, facet) values (?,?)', tweet['TweetId'],
                                   part.split()[0])
                # build out the author hashtag / author mention graphs
    if '#' in tweet['TweetText']:  # building out graph projections
        for part in tweet['TweetText'].split('#')[1:]:
            if len(part.strip()) > 0 and len(username.strip()) > 0:
                # part = part.translate(None, string.punctuation)
                cursor.execute(
                    'insert into pbist_twitter.authorhashtag_graph (tweetid, author, authorColor, hashtag, hashtagColor) values (?,?,?,?,?)',
                    tweet['TweetId'], username, '#01B8AA', part.split()[0], '#374649')
    if '@' in tweet['TweetText']:
        for part in tweet['TweetText'].split('@')[1:]:
            if len(part.strip()) > 0 and len(username.strip()) > 0:
                # part = part.translate(None, string.punctuation)
                cursor.execute(
                    'insert into pbist_twitter.authormention_graph (tweetid, author, authorColor, mention, mentionColor) values (?,?,?,?,?)',
                    tweet['TweetId'], username, '#01B8AA', part.split()[0], '#01B8AA')
    cnxn.commit()  # saves
else:
    print('foreign language')



#print(sys.version)
#print(os.getcwd())
