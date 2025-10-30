import os
import asyncio
import time
import aiohttp
from twitchio.ext import commands

TWITCH_ACCESS_TOKEN = os.environ.get('TWITCH_ACCESS_TOKEN')
TWITCH_CLIENT_ID = os.environ.get('TWITCH_CLIENT_ID')
TWITCH_CHANNEL_NAME = os.environ.get('TWITCH_CHANNEL_NAME')
LOCAL_API_URL = os.environ.get('LOCAL_API_URL', 'http://localhost:3000')

if not TWITCH_ACCESS_TOKEN or not TWITCH_CHANNEL_NAME or not TWITCH_CLIENT_ID:
    print('Please set TWITCH_ACCESS_TOKEN, TWITCH_CLIENT_ID and TWITCH_CHANNEL_NAME environment variables.')
    print('Example:')
    print('  setx TWITCH_ACCESS_TOKEN "your_token_here"')
    raise SystemExit(1)

# TwitchIO expects the token to be prefixed with "oauth:" when connecting to IRC
if TWITCH_ACCESS_TOKEN.startswith('oauth:'):
    IRC_TOKEN = TWITCH_ACCESS_TOKEN
else:
    IRC_TOKEN = f'oauth:{TWITCH_ACCESS_TOKEN}'

POLL_INTERVAL = int(os.environ.get('REDEMPTION_POLL_INTERVAL', '10'))  # seconds


async def get_user_id(session: aiohttp.ClientSession, username: str):
    url = f'https://api.twitch.tv/helix/users?login={username}'
    headers = {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': f'Bearer {TWITCH_ACCESS_TOKEN}'
    }
    async with session.get(url, headers=headers) as resp:
        if resp.status != 200:
            text = await resp.text()
            print('Failed to fetch user id:', resp.status, text)
            return None
        data = await resp.json()
        if data.get('data'):
            return data['data'][0]['id']
        return None


async def get_user_info(session: aiohttp.ClientSession, username: str):
    url = f'https://api.twitch.tv/helix/users?login={username}'
    headers = {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': f'Bearer {TWITCH_ACCESS_TOKEN}'
    }
    async with session.get(url, headers=headers) as resp:
        if resp.status != 200:
            return None
        return await resp.json()


class Bot(commands.Bot):
    def __init__(self, token: str, client_id: str, channel: str):
        super().__init__(token=token, prefix='!', initial_channels=[channel])
        self.client_id = client_id
        self.channel = channel
        self.broadcaster_id = None
        self._seen_redemptions = set()
        self._session = aiohttp.ClientSession()

    async def event_ready(self):
        print(f'Connected to Twitch as {self.nick}')
        # Get broadcaster id for polling redemptions
        self.broadcaster_id = await get_user_id(self._session, self.channel)
        print('Broadcaster ID:', self.broadcaster_id)
        # Start redemption poller
        if self.broadcaster_id:
            asyncio.create_task(self._poll_redemptions())

    async def event_message(self, message):
        # Ignore messages from the bot itself
        if message.echo:
            return

        author = message.author.name
        content = message.content
        print(f'CHAT | {author}: {content}')

        # Fetch and print user info from Helix (example usage)
        try:
            info = await get_user_info(self._session, author)
            if info and info.get('data'):
                user = info['data'][0]
                print('USER INFO |', user['login'], user.get('id'), user.get('display_name'))
        except Exception as e:
            print('Error fetching user info:', e)

        await self.handle_commands(message)

    async def _poll_redemptions(self):
        """Periodically poll Helix for recent unfulfilled redemptions and print them."""
        # First fetch rewards
        rewards = []
        headers = {'Client-ID': self.client_id, 'Authorization': f'Bearer {TWITCH_ACCESS_TOKEN}'}
        rewards_url = f'https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id={self.broadcaster_id}'
        async with self._session.get(rewards_url, headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                rewards = data.get('data', [])
                print(f'Found {len(rewards)} rewards for broadcaster.')
            else:
                text = await resp.text()
                print('Failed to list rewards:', resp.status, text)

        reward_ids = [r['id'] for r in rewards]

        while True:
            try:
                for rid in reward_ids:
                    url = (f'https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions'
                           f'?broadcaster_id={self.broadcaster_id}&reward_id={rid}&status=UNFULFILLED')
                    async with self._session.get(url, headers=headers) as resp:
                        if resp.status != 200:
                            # maybe no permission or no redemptions
                            # print('Redemptions fetch failed', resp.status)
                            continue
                        data = await resp.json()
                        for redemption in data.get('data', []):
                            rid_unique = redemption.get('id')
                            if rid_unique in self._seen_redemptions:
                                continue
                            self._seen_redemptions.add(rid_unique)
                            user = redemption.get('user_login')
                            reward_title = redemption.get('reward', {}).get('title') if redemption.get('reward') else redemption.get('reward', '')
                            user_input = redemption.get('user_input')
                            print('REDEMPTION |', user, reward_title, user_input)
                            # Forward redemption to local Flask app for handling
                            try:
                                forward_url = f"{LOCAL_API_URL}/api/redemptions"
                                payload = {
                                    'user_login': user,
                                    'reward_title': reward_title,
                                    'user_input': user_input,
                                    'redemption': redemption
                                }
                                async with self._session.post(forward_url, json=payload) as post_resp:
                                    if post_resp.status == 200:
                                        print('Forwarded redemption to local API')
                                    else:
                                        text = await post_resp.text()
                                        print('Failed to forward redemption:', post_resp.status, text)
                            except Exception as e:
                                print('Error forwarding redemption to local API:', e)
                            # TODO: integrate with local app (POST to local Flask API) if desired
                await asyncio.sleep(POLL_INTERVAL)
            except Exception as e:
                print('Error polling redemptions:', e)
                await asyncio.sleep(POLL_INTERVAL)


async def main():
    bot = Bot(token=IRC_TOKEN, client_id=TWITCH_CLIENT_ID, channel=TWITCH_CHANNEL_NAME)
    await bot.start()


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print('Bot stopped by user')
