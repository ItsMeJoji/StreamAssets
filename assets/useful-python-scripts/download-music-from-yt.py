import os
from pytube import Playlist, YouTube
import ffmpeg

# Set output directory
OUTPUT_DIR = "downloads"

# Ensure the output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def download_audio(video_url, output_path):
    try:
        yt = YouTube(video_url)
        print(f"Downloading: {yt.title}...")

        # Get the highest quality audio stream
        audio_stream = yt.streams.filter(only_audio=True).first()
        audio_file = audio_stream.download(output_path=output_path)

        # Convert to MP3
        mp3_filename = os.path.join(output_path, f"{yt.title}.mp3")
        ffmpeg.input(audio_file).output(mp3_filename, format="mp3").run(overwrite_output=True)

        # Remove original downloaded file
        os.remove(audio_file)

        print(f"Saved: {mp3_filename}\n")
    except Exception as e:
        print(f"Error downloading {video_url}: {e}")

def download_playlist_audio(playlist_url):
    try:
        playlist = Playlist(playlist_url)
        print(f"Found {len(playlist.video_urls)} videos in playlist.")

        for video_url in playlist.video_urls:
            download_audio(video_url, OUTPUT_DIR)
    except Exception as e:
        print(f"Error processing playlist: {e}")

if __name__ == "__main__":
    playlist_url = input("Enter YouTube playlist URL: ")
    download_playlist_audio(playlist_url)
