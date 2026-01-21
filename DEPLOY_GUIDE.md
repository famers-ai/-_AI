# 🚀 Smart Farm AI Deployment Guide

This guide describes how to deploy your local Smart Farm AI app to the web for free, so farmers can access it via a generic URL.

## 1. Prepare for Cloud
Streamlit Cloud needs to know what libraries to install. We already created `requirements.txt`.

Ensure your project structure is pushed to a **GitHub Repository**.
1. Create a GitHub account (if you don't have one).
2. Create a 'New Repository'.
3. Upload all your files (`app.py`, `requirements.txt`, `src/`) to this repository.

## 2. Deploy to Streamlit Cloud (Free)
1. Go to [share.streamlit.io](https://share.streamlit.io/).
2. Login with your GitHub account.
3. Click **"New app"**.
4. Select your GitHub repository (`smartfarm_ai`).
5. Set "Main file path" to `app.py`.
6. Click **"Deploy"**.

Wait about 2-3 minutes. You will get a unique URL (e.g., `https://smart-farm-hero.streamlit.app`).

## 3. Manage API Keys (Securely)
**Do not** upload your `.env` file to GitHub (it's insecure).
Instead, in the Streamlit Cloud dashboard:
1. Go to your App's **Settings** (⋮ menu).
2. Click **"Secrets"**.
3. Paste your API key there like this:
   ```toml
   GEMINI_API_KEY = "your_secret_key_here"
   ```
4. Update `ai_engine.py` / `data_handler.py` to read from `st.secrets` instead of `os.getenv` if deployment is detected (Streamlit handles transparently often, but explicit `st.secrets` is safer).

## 4. Delivery to Farmers (The "Magic" Step)
Send the URL via KakaoTalk/SMS. Instruct them to:
1. **Open the link**.
2. **Add to Home Screen**:
   - **iPhone**: Share Button (Box with arrow) -> "Add to Home Screen".
   - **Android**: Menu (3 dots) -> "Add to Home Screen".
   
Now it looks and acts exactly like an installed app on their phone!
