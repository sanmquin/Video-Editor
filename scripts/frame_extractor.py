#!/usr/bin/env python3
"""
StudioCut Local Video Frame Extractor (First 4 Seconds)

Extracts 5 screenshots (t = 0.0s, 1.0s, 2.0s, 3.0s, 4.0s) from a local video file
or all videos in a directory to facilitate visual hook analysis for swipe rate and retention.

Usage:
    python scripts/frame_extractor.py --input /path/to/video.mp4 --output /path/to/output_dir
    python scripts/frame_extractor.py --dir /path/to/videos_folder --output /path/to/output_dir
"""

import os
import sys
import argparse
import subprocess

def extract_frames_ffmpeg(video_path, output_dir):
    """
    Extracts frames at t=0, 1, 2, 3, 4 seconds using ffmpeg CLI.
    """
    if not os.path.isfile(video_path):
        print(f"Error: Video file not found: {video_path}")
        return False

    os.makedirs(output_dir, exist_ok=True)
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    timestamps = [0, 1, 2, 3, 4]
    success_count = 0

    print(f"Processing video: {video_path}")
    for ts in timestamps:
        out_filename = f"{video_name}_frame_{ts}s.png"
        out_filepath = os.path.join(output_dir, out_filename)

        # ffmpeg command seeking to ts second
        cmd = [
            "ffmpeg",
            "-y",
            "-ss", str(ts),
            "-i", video_path,
            "-vframes", "1",
            "-q:v", "2",
            out_filepath
        ]

        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res.returncode == 0 and os.path.exists(out_filepath):
                print(f"  [+] Extracted: {out_filename}")
                success_count += 1
            else:
                print(f"  [-] Failed to extract frame at {ts}s: {res.stderr.decode('utf-8', errors='ignore')}")
        except FileNotFoundError:
            print("Error: 'ffmpeg' binary not found. Please install ffmpeg or use OpenCV option.")
            return False

    return success_count == len(timestamps)

def extract_frames_opencv(video_path, output_dir):
    """
    Extracts frames at t=0, 1, 2, 3, 4 seconds using OpenCV Python library if available.
    """
    try:
        import cv2
    except ImportError:
        print("OpenCV (cv2) not installed. Falling back to ffmpeg.")
        return extract_frames_ffmpeg(video_path, output_dir)

    if not os.path.isfile(video_path):
        print(f"Error: Video file not found: {video_path}")
        return False

    os.makedirs(output_dir, exist_ok=True)
    video_name = os.path.splitext(os.path.basename(video_path))[0]

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error opening video stream: {video_path}")
        return False

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    timestamps = [0, 1, 2, 3, 4]

    for ts in timestamps:
        frame_num = int(ts * fps)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
        ret, frame = cap.read()
        if ret:
            out_filename = f"{video_name}_frame_{ts}s.png"
            out_filepath = os.path.join(output_dir, out_filename)
            cv2.imwrite(out_filepath, frame)
            print(f"  [+] Extracted: {out_filename}")
        else:
            print(f"  [-] Failed to read frame at {ts}s")

    cap.release()
    return True

def main():
    parser = argparse.ArgumentParser(description="Extract 5 screenshots (0s-4s) for video hook analysis.")
    parser.add_argument("--input", "-i", type=str, help="Path to a single video file.")
    parser.add_argument("--dir", "-d", type=str, help="Path to a directory containing video files.")
    parser.add_argument("--output", "-o", type=str, default="./extracted_frames", help="Output directory for PNG screenshots.")
    parser.add_argument("--method", choices=["ffmpeg", "opencv"], default="ffmpeg", help="Extraction method to use.")

    args = parser.parse_args()

    if not args.input and not args.dir:
        print("Usage error: Must specify either --input <video_file> or --dir <folder_path>")
        sys.exit(1)

    targets = []
    if args.input:
        targets.append(args.input)
    if args.dir and os.path.isdir(args.dir):
        valid_exts = (".mp4", ".mov", ".webm", ".mkv", ".avi")
        for fname in os.listdir(args.dir):
            if fname.lower().endswith(valid_exts):
                targets.append(os.path.join(args.dir, fname))

    print(f"Found {len(targets)} video(s) to process.")
    for v in targets:
        if args.method == "opencv":
            extract_frames_opencv(v, args.output)
        else:
            extract_frames_ffmpeg(v, args.output)

if __name__ == "__main__":
    main()
