import { google } from "googleapis";

export default function handler(req, res) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI // debe ser .../api/gmail
  );

  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.labels"
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",   // para que Google nos dé refresh_token
    prompt: "consent",        // fuerza a que salga el consentimiento (necesario para refresh_token)
    scope: scopes
  });

  res.status(200).json({ url });
}
