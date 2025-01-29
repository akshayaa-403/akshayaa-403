import tweepy
import pandas as pd
import re
from textblob import TextBlob
import matplotlib.pyplot as plt

# Step 1: Twitter API Authentication
BEARER_TOKEN = "{insert your bearer token}"  # Replace with your actual Bearer Token
client = tweepy.Client(bearer_token=BEARER_TOKEN)

# Step 2: Fetch Tweets
def fetch_tweets(query, count=100):
    tweets = client.search_recent_tweets(query=query, max_results=min(count, 100), tweet_fields=['created_at', 'text', 'author_id'])
    tweet_data = [[tweet.text, tweet.author_id, tweet.created_at] for tweet in tweets.data] if tweets.data else []
    return pd.DataFrame(tweet_data, columns=['Text', 'User', 'Timestamp'])

# Step 3: Clean Tweets
def clean_tweet(tweet):
    tweet = re.sub(r'http\S+', '', tweet)  # Remove URLs
    tweet = re.sub(r'@[A-Za-z0-9_]+', '', tweet)  # Remove mentions
    tweet = re.sub(r'#[A-Za-z0-9_]+', '', tweet)  # Remove hashtags
    tweet = re.sub(r'[^A-Za-z0-9 ]', '', tweet)  # Remove special characters
    tweet = tweet.lower().strip()  # Convert to lowercase
    return tweet

# Step 4: Analyze Sentiment
def analyze_sentiment(tweet):
    analysis = TextBlob(tweet)
    if analysis.sentiment.polarity > 0:
        return 'Positive'
    elif analysis.sentiment.polarity == 0:
        return 'Neutral'
    else:
        return 'Negative'

# Step 5: Main Execution
if __name__ == "__main__":
    query = input("Enter the topic to search tweets for: ")
    count = int(input("Enter the number of tweets to fetch (up to 100): "))

    print("Fetching tweets...")
    df = fetch_tweets(query, count)

    if df.empty:
        print("No tweets found. Please try another query.")
    else:
        print("Cleaning tweets...")
        df['Cleaned_Text'] = df['Text'].apply(clean_tweet)

        print("Analyzing sentiment...")
        df['Sentiment'] = df['Cleaned_Text'].apply(analyze_sentiment)

        # Save the data to a CSV file
        df.to_csv(f'{query}_tweets.csv', index=False)
        print(f"Data saved to {query}_tweets.csv")

        # Plot Sentiment Distribution
        sentiment_counts = df['Sentiment'].value_counts()
        plt.figure(figsize=(8, 6))
        sentiment_counts.plot(kind='bar', color=['green', 'blue', 'red'])
        plt.title(f"Sentiment Analysis for '{query}'", fontsize=14)
        plt.xlabel("Sentiment", fontsize=12)
        plt.ylabel("Number of Tweets", fontsize=12)
        plt.xticks(rotation=0)
        plt.show()
