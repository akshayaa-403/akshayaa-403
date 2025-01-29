# Twitter Sentiment Analysis

This project allows you to fetch recent tweets using the Twitter API, clean the tweet data, and analyze the sentiment (positive, neutral, or negative) of the tweets. It then visualizes the sentiment distribution in a bar chart and saves the data to a CSV file.

## Setup

### Twitter API Authentication
To interact with the Twitter API, you need to obtain a Bearer Token. Follow the steps [here](https://developer.twitter.com/en/docs/authentication/oauth-2-0) to create a Twitter Developer account and get your Bearer Token.

### Insert Bearer Token
Replace the placeholder `"{insert your bearer token}"` with your actual Bearer Token in the code.

## How to Use

### Run the Script
After inserting your Bearer Token, run the script.

### Provide Input
The script will prompt you to enter:
- The topic you want to search tweets for.
- The number of tweets to fetch (up to 100).

### Results
- The script fetches tweets based on the topic you provide.
- It cleans the tweet data (removes URLs, mentions, hashtags, and special characters).
- Sentiment analysis is performed on each tweet.
- The results are saved to a CSV file and displayed as a bar chart showing the sentiment distribution (positive, neutral, negative).

## Code Explanation

### 1. Twitter API Authentication
The script authenticates using the Bearer Token provided to access the Twitter API and fetch recent tweets based on the specified query.

### 2. Fetching Tweets
The `fetch_tweets` function queries Twitter's API to get tweets based on a user-defined query and stores them in a pandas DataFrame.

### 3. Cleaning Tweets
The `clean_tweet` function removes URLs, mentions, hashtags, and special characters from the tweets, making them easier to analyze.

### 4. Sentiment Analysis
The `analyze_sentiment` function uses `TextBlob` to analyze the sentiment of the tweets and classify them as positive, neutral, or negative based on their polarity.

### 5. Visualization
The sentiment counts are visualized in a bar chart with `matplotlib`, showing the number of positive, neutral, and

## Requirements

Before running the script, you need to have the following Python libraries installed:

- `tweepy`: For interacting with the Twitter API
- `pandas`: For handling data
- `re`: For regular expressions
- `textblob`: For sentiment analysis
- `matplotlib`: For plotting the sentiment distribution

You can install the required libraries using `pip`:

```bash
pip install tweepy pandas textblob matplotlib
