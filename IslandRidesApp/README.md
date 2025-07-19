# KeyLo App

A vehicle rental platform for the Bahamas built with React Native and TypeScript.

## Setup

### Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Copy `.env.example` to `.env` and fill in your Firebase configuration values:

```bash
cp .env.example .env
```

3. Update the following environment variables in your `.env` file:

- `EXPO_PUBLIC_FIREBASE_API_KEY` - Your Firebase API key
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain (usually projectId.firebaseapp.com)
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket (usually projectId.appspot.com)
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `EXPO_PUBLIC_FIREBASE_APP_ID` - Your Firebase app ID

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

