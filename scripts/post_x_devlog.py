#!/usr/bin/env python3
"""
SoulBonker 3D - X / Twitter Devlog Publisher
Publie automatiquement des devlogs, threads et mises à jour avec captures d'écran sur X.
"""

import os
import sys
import argparse
import tweepy

def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    config = {}
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    config[k.strip()] = v.strip().strip('"').strip("'")
    return config

def get_twitter_clients(config):
    api_key = config.get('X_API_KEY')
    api_secret = config.get('X_API_SECRET')
    access_token = config.get('X_ACCESS_TOKEN')
    access_token_secret = config.get('X_ACCESS_TOKEN_SECRET')
    bearer_token = config.get('X_BEARER_TOKEN')

    # v2 Client for posting tweets
    client = tweepy.Client(
        bearer_token=bearer_token,
        consumer_key=api_key,
        consumer_secret=api_secret,
        access_token=access_token if access_token else None,
        access_token_secret=access_token_secret if access_token_secret else None
    )

    # v1.1 API for media upload
    auth = None
    api_v1 = None
    if api_key and api_secret and access_token and access_token_secret:
        auth = tweepy.OAuth1UserHandler(api_key, api_secret, access_token, access_token_secret)
        api_v1 = tweepy.API(auth)

    return client, api_v1

def post_single_tweet(text, image_path=None):
    config = load_env()
    client, api_v1 = get_twitter_clients(config)

    media_ids = []
    if image_path and api_v1:
        if os.path.exists(image_path):
            print(f"Uploading media: {image_path}...")
            media = api_v1.media_upload(filename=image_path)
            media_ids.append(media.media_id)
        else:
            print(f"⚠️ Image not found: {image_path}")

    print(f"Posting tweet ({len(text)} chars)...")
    try:
        response = client.create_tweet(text=text, media_ids=media_ids if media_ids else None)
        tweet_id = response.data['id']
        print(f"✅ Tweet posted successfully! ID: {tweet_id}")
        print(f"🔗 URL: https://twitter.com/user/status/{tweet_id}")
        return tweet_id
    except Exception as e:
        print(f"❌ Error posting tweet: {e}")
        return None

def post_thread(tweets_with_media):
    """
    tweets_with_media: list of tuples/dicts: [{'text': '...', 'image': 'path' or None}]
    """
    config = load_env()
    client, api_v1 = get_twitter_clients(config)

    last_tweet_id = None
    for idx, item in enumerate(tweets_with_media):
        text = item.get('text', '')
        image_path = item.get('image')

        media_ids = []
        if image_path and api_v1 and os.path.exists(image_path):
            print(f"[{idx+1}/{len(tweets_with_media)}] Uploading image: {image_path}...")
            try:
                media = api_v1.media_upload(filename=image_path)
                media_ids.append(media.media_id)
            except Exception as e:
                print(f"⚠️ Error uploading media: {e}")

        print(f"[{idx+1}/{len(tweets_with_media)}] Posting tweet...")
        try:
            if last_tweet_id:
                resp = client.create_tweet(text=text, in_reply_to_tweet_id=last_tweet_id, media_ids=media_ids if media_ids else None)
            else:
                resp = client.create_tweet(text=text, media_ids=media_ids if media_ids else None)
            last_tweet_id = resp.data['id']
            print(f"  ✓ Success! Tweet ID: {last_tweet_id}")
        except Exception as e:
            print(f"❌ Error on step {idx+1}: {e}")
            break

    return last_tweet_id

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="SoulBonker 3D Devlog Publisher")
    parser.add_argument('--tweet', type=str, help="Tweet text to post")
    parser.add_argument('--image', type=str, help="Image file path to attach")
    args = parser.parse_args()

    if args.tweet:
        post_single_tweet(args.tweet, args.image)
    else:
        print("Usage: python3 scripts/post_x_devlog.py --tweet 'Hello world' [--image path/to/image.png]")
