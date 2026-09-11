# Sayeed Courses

A standalone course-learning web app for GitHub Pages. Video is hosted on **YouTube Unlisted** and played **inside the app** using the YouTube IFrame Player API.

## Included
- Premium responsive course dashboard
- Courses → Chapters → Parts
- Professional in-app YouTube player shell
- Admin panel for courses and lessons
- Firebase Auth + Firestore support
- Demo/localStorage mode so the UI works before Firebase setup
- Supplied Sayeed image used as the project logo

## 1. Put it on GitHub Pages
Upload the entire folder to a GitHub repository and enable GitHub Pages.

## 2. Firebase production setup
Edit `assets/js/config.js` and paste your Firebase Web App config. Set `adminEmail` to your real admin email.

Enable:
- Authentication → Email/Password
- Firestore Database

Then replace `YOUR_ADMIN_EMAIL@example.com` in `firestore.rules` with the exact admin email and deploy those rules.

## 3. Add lessons
Open `admin.html`, sign in, create a course, then add lessons.

For a YouTube link you can paste any of:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

The app stores only the YouTube video ID and lesson metadata, so your app does **not** store or stream the actual video file.

## 4. Demo mode
Before Firebase is configured, the app uses localStorage. This is useful for testing the design and flow. Do not use demo mode as your real multi-device database.

## Important YouTube note
The video is played inside the Sayeed Courses page, but the underlying player is YouTube. Some YouTube branding/player behavior cannot be completely removed because that is controlled by YouTube.
