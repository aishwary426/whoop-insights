# 🚂 Railway PostgreSQL Setup Guide

To fix the issue where your data disappears after every deployment, we need to add a persistent database to your Railway project.

## Step 1: Add PostgreSQL Service

1.  Go to your [Railway Dashboard](https://railway.app/dashboard).
2.  Open your `whoop-insights` project.
3.  Click the **"New"** button (or "Create" / "+").
4.  Select **"Database"**.
5.  Choose **"PostgreSQL"**.
6.  Wait a moment for the database to be provisioned.

## Step 2: Connect Database to Your App

1.  Click on the new **PostgreSQL** card in your project view.
2.  Go to the **"Variables"** tab (or "Connect").
3.  Find the `DATABASE_URL` variable. It will look something like:
    `postgresql://postgres:password@roundhouse.proxy.rlwy.net:12345/railway`
4.  **Copy** this value.

## Step 3: Update Your App Variables

1.  Click on your **`whoop-insights` application** card (your main app).
2.  Go to the **"Variables"** tab.
3.  Click **"New Variable"**.
4.  **Name:** `DATABASE_URL`
5.  **Value:** Paste the URL you copied in Step 2.
6.  Click **"Add"**.

## Step 4: Redeploy

1.  Railway usually triggers a redeploy automatically when variables change.
2.  If not, go to the **"Deployments"** tab and click **"Redeploy"**.

## Verification

Once the deployment finishes:

1.  Open your deployed website.
2.  You will be asked to "Upload Data" one last time (because this is a fresh, empty database).
3.  Upload your zip file or connect Whoop.
4.  **Test Persistence:** Go back to Railway and click "Restart" on your app, or trigger a new deployment.
5.  Refresh your website. **You should NOT be asked to upload data again.**

> [!NOTE]
> PostgreSQL is a robust, production-ready database. Your data is now safe on a separate volume and won't be deleted when the application container restarts.
