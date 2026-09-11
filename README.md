# Sayeed Courses

A professional course-first video learning web app for GitHub Pages.

## Structure
- Home: only Courses are shown.
- Course: opens into numbered Modules (1, 2, 3, ...).
- Module: launches the YouTube video inside the app with an embedded player.
- Admin: create courses and add modules using YouTube links.
- Storage: course/module metadata is stored in localStorage in this starter. Video files remain on YouTube.

## Demo admin
Open `admin.html`.

This starter uses local/demo storage for simplicity. The current demo admin panel is client-side and is not a secure production authentication system. For a live production deployment, connect the same data model to Firebase/Firestore and use Firebase Authentication.

## GitHub Pages
Upload the project contents to a repository and enable GitHub Pages from repository settings.

## Data model
```text
Course
  id
  name
  subtitle
  description
  cover
  modules[]
      id
      number
      title
      description
      url
```

## YouTube
Use normal YouTube links or Unlisted YouTube links. The app extracts the video ID and renders a YouTube embed inside the course screen.

## Branding
The supplied image is used as `assets/img/logo.png`.
