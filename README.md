<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally and deploy it to Netlify.

View your app in AI Studio: https://ai.studio/apps/drive/1LBFa6jwBGkQwE3UOww-eU2HrYquH9xZD

## Run Locally

**Prerequisites:** Node.js and Netlify CLI

1.  **Install Netlify CLI:** If you haven't already, install the Netlify command-line tool globally. This is a one-time setup.
    `npm install netlify-cli -g`

2.  **Install dependencies:**
    `npm install`

3.  **Create Environment File:** Create a file named `.env` in the root of your project and add your Gemini API key. Netlify Dev will automatically use this key.
    `API_KEY=your_api_key_here`

4.  **Run the app:**
    `npm run dev`
    
    This command now uses Netlify Dev to start a local server that correctly runs both your frontend application and the backend function, perfectly simulating the production environment.

## Deploy to Netlify

This project is configured for easy deployment on Netlify.

1.  **Push to a Git repository:** Push your project code to a GitHub, GitLab, or Bitbucket repository.
2.  **Create a new site on Netlify:** Log in to your Netlify account and select "Add new site" -> "Import an existing project".
3.  **Connect to your Git provider:** Choose your Git provider and select the repository for this project.
4.  **Configure build settings:** Netlify will automatically detect the build settings from the `netlify.toml` file included in this project.
    *   **Build command:** `npm run build`
    *   **Publish directory:** `dist`
5.  **Add Environment Variable:** This is the most important step for securing your API key.
    *   In your site's settings on Netlify, go to "Site configuration" > "Build & deploy" > "Environment".
    *   Click "Edit variables" and add a new variable:
        *   **Key:** `API_KEY`
        *   **Value:** Paste your Gemini API key here.
6.  **Deploy site:** Click "Deploy site". Netlify will start building and deploying your application.