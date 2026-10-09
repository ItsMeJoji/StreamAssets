import os
import json
import subprocess
from datetime import datetime
import requests

# --- CONFIGURATION ---
TWITCH_CLIENT_ID = "[CLIENT_ID]"
TWITCH_CLIENT_SECRET = "[CLIENT_SECRET]"
TARGET_CHANNEL = "itsmejoji"
OUTPUT_DIR = "Highlights"  # Keeps clips isolated in their own folder

# Local file used to persist the access + refresh token between runs
TOKEN_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "twitch_tokens.json")

# Fallback seed tokens — update these once, then the script auto-rotates from here on
_SEED_ACCESS_TOKEN  = "01zxawgc59zn0qt06773onz0v8b9j5"
_SEED_REFRESH_TOKEN = "oukyzsgmrq5sjjdm6e52a1nc5z752lcmm0e8ft37oo9nvq42ad"


def _load_tokens():
    """Returns (access_token, refresh_token) from the local cache, or falls back to seeds."""
    if os.path.exists(TOKEN_FILE):
        try:
            with open(TOKEN_FILE, "r") as f:
                data = json.load(f)
            return data["access_token"], data["refresh_token"]
        except Exception:
            pass
    return _SEED_ACCESS_TOKEN, _SEED_REFRESH_TOKEN


def _save_tokens(access_token, refresh_token):
    """Persists a fresh access + refresh token pair to the local cache file."""
    with open(TOKEN_FILE, "w") as f:
        json.dump({"access_token": access_token, "refresh_token": refresh_token}, f, indent=2)


# Boot-time token load
_access_token, _refresh_token = _load_tokens()

# Set up a persistent requests session with required Twitch headers
session = requests.Session()
session.headers.update({
    "Client-ID": TWITCH_CLIENT_ID,
    "Authorization": f"Bearer {_access_token}"
})


def refresh_token():
    """Refreshes the Twitch OAuth token using the official Twitch token endpoint.
    Uses client_id + client_secret + refresh_token (no third-party service needed).
    Saves the new access + refresh token pair locally so the chain never breaks."""
    global _access_token, _refresh_token

    print("Refreshing Twitch OAuth token...")
    try:
        response = requests.post(
            "https://id.twitch.tv/oauth2/token",
            data={
                "grant_type":    "refresh_token",
                "refresh_token": _refresh_token,
                "client_id":     TWITCH_CLIENT_ID,
                "client_secret": TWITCH_CLIENT_SECRET,
            },
            timeout=15
        )
        response.raise_for_status()
        data = response.json()

        new_access  = data["access_token"]
        new_refresh = data["refresh_token"]

        # Rotate both tokens in memory and on disk
        _access_token  = new_access
        _refresh_token = new_refresh
        _save_tokens(new_access, new_refresh)
        session.headers.update({"Authorization": f"Bearer {new_access}"})
        print("Token refreshed and saved successfully.")

    except Exception as e:
        print(f"Warning: Token refresh failed: {e}")
        print("Continuing with cached token — it may still be valid.")


def get_latest_vod_and_markers(channel_name):
    """Fetches the most recent VOD and its associated stream markers using standard requests."""
    print(f"Fetching data for channel: {channel_name}...")
    
    # 1. Get the User ID from the channel name
    user_res = session.get(f"https://api.twitch.tv/helix/users?login={channel_name}")
    user_res.raise_for_status()
    user_data = user_res.json().get("data")
    if not user_data:
        print("Error: Channel not found.")
        return None, []
    user_id = user_data[0]["id"]

    # 2. Get the most recent video (VOD)
    video_res = session.get(f"https://api.twitch.tv/helix/videos?user_id={user_id}&first=1&type=archive")
    video_res.raise_for_status()
    video_data = video_res.json().get("data")
    if not video_data:
        print("No recent VODs found for this channel.")
        return None, []
    
    latest_vod = video_data[0]
    vod_id = latest_vod["id"]
    created_date = latest_vod["created_at"][:10] 

    # 3. Fetch stream markers for this explicit VOD
    marker_res = session.get(f"https://api.twitch.tv/helix/streams/markers?video_id={vod_id}")
    marker_res.raise_for_status()
    marker_payload = marker_res.json().get("data")
    
    markers = []
    if marker_payload and len(marker_payload) > 0 and "videos" in marker_payload[0]:
        markers = marker_payload[0]["videos"][0].get("markers", [])
        
    return {"id": vod_id, "date": created_date, "url": latest_vod["url"]}, markers


def format_seconds_to_hms(seconds):
    """Converts raw numerical seconds into standard HH:MM:SS format for ffmpeg."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def extract_highlight_segment(vod_url, start_seconds, duration_seconds, output_filename):
    """Uses yt-dlp to pass a streaming payload chunk directly to ffmpeg."""
    import sys  # Ensure sys is available inside the function scope
    start_time = format_seconds_to_hms(start_seconds)
    duration_time = format_seconds_to_hms(duration_seconds)
    
    print(f"Processing: {output_filename}.mp4")
    print(f" -> Slice bounds: Starts at {start_time}, running for {duration_time}")

    command = [sys.executable, "-m", "yt_dlp", "-g", vod_url]
    
    try:
        stream_urls = subprocess.check_output(command).decode("utf-8").splitlines()
        if not stream_urls:
            print("Failed to fetch stream URLs.")
            return
        
        video_url = stream_urls[0]
        
        ffmpeg_command = [
            "ffmpeg",
            "-ss", start_time,
            "-i", video_url,
            "-t", duration_time,
            "-c:v", "copy",
            "-c:a", "copy",
            "-y",
            f"{output_filename}.mp4"
        ]
        
        subprocess.run(ffmpeg_command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"Successfully saved {output_filename}.mp4\n")
        
    except Exception as e:
        print(f"Failed rendering segment {output_filename}: {e}")


def main():
    # Refresh the OAuth token before making any API calls
    refresh_token()

    # Make sure output directory exists
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    try:
        vod, markers = get_latest_vod_and_markers(TARGET_CHANNEL)
    except Exception as e:
        print(f"Twitch API Connection Failed: {e}")
        print("Please verify your Client ID and OAuth Token are valid and active.")
        return
    
    if not vod:
        return
        
    print(f"Target VOD Identified: ID {vod['id']} from {vod['date']}")
    print(f"Total stream markers found: {len(markers)}")
    
    if not markers:
        print("No markers available to create highlights from. Exiting.")
        return

    for idx, marker in enumerate(markers, 1):
        marker_point = marker["position_seconds"]
        start_seconds = marker_point - 300
        
        if start_seconds < 0:
            start_seconds = 0
            duration_seconds = marker_point + 60
        else:
            duration_seconds = 360  # 5 mins before + 1 min after

        # Paths are cleanly handled inside the dedicated folder now
        output_name = os.path.join(OUTPUT_DIR, f"{vod['date']}_marker_{idx}")
        
        extract_highlight_segment(
            vod_url=vod["url"], 
            start_seconds=start_seconds, 
            duration_seconds=duration_seconds, 
            output_filename=output_name
        )
        
    print("All stream markers processed completely!")

if __name__ == "__main__":
    main()