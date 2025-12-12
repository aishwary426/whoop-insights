# Content Requirements for All Pages

This document outlines all pages in the application and identifies where content is needed. Each section follows the format: **Page Name**, **Topic**, **Text**.

---

## Privacy Policy Page (`/privacy`)

### Data Collection
**Topic:** What data we collect
**Text:** We only access the data you explicitly provide via the WHOOP export file. This includes your sleep metrics (duration, efficiency, stages), strain scores, recovery percentages, heart rate variability (HRV), resting heart rate, blood oxygen saturation (SpO2), respiratory rate, skin temperature, and any journal entries you've logged in the WHOOP app. This data is used solely to generate personalized insights, forecasts, and recommendations displayed on your dashboard. We do not collect any data from third-party sources or track your usage patterns.

### Data Storage
**Topic:** Where your data is stored
**Text:** Your WHOOP export data is processed and stored locally on your device or server instance. The data is stored in a local SQLite database file (`whoop.db`) that resides on your machine. Machine learning models trained on your data are also stored locally in the `backend/data/models/` directory. Your data never leaves your local environment and is never transmitted to external cloud servers for storage or analysis.

### Data Processing
**Topic:** How we process your data
**Text:** When you upload a WHOOP export ZIP file, we extract and parse the CSV files contained within. The data is then processed through feature engineering pipelines to create derived metrics (such as acute/chronic ratios, sleep debt, consistency scores). Machine learning models are trained on this processed data to generate personalized predictions and insights. All processing occurs locally on your hardware. No external APIs or services are used for data processing.

### Model Training
**Topic:** Personalization and machine learning
**Text:** Any personalization or machine learning training happens on your device. Your unique physiological patterns are learned locally, ensuring your biometric signature never leaves your control. Models are trained using your historical data to predict recovery, optimize workout recommendations, and identify personal thresholds. These models improve over time as you add more data, but all training occurs locally without sharing your data externally.

### Data Security
**Topic:** How we protect your data
**Text:** Since your data resides on your local machine, it is as secure as your own device. We recommend keeping your local environment updated and secure. The application uses standard encryption for database connections and follows best practices for local data storage. However, you are responsible for maintaining the security of your local environment, including keeping your operating system and any server software up to date.

### Data Retention
**Topic:** How long we keep your data
**Text:** Your data is retained indefinitely on your local device until you explicitly delete it. You can delete your account and all associated data at any time through the settings page. When you delete your account, all data files, trained models, and database entries are permanently removed from your local storage.

### Third-Party Services
**Topic:** External services we use
**Text:** We use Supabase for user authentication (email/password and Google OAuth). Supabase only receives your email address and authentication credentials - no WHOOP data is shared with Supabase. The authentication service is separate from your health data, which remains entirely local.

### Children's Privacy
**Topic:** Privacy for users under 18
**Text:** This application is not intended for users under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us to have that information removed.

### Changes to Privacy Policy
**Topic:** Policy updates
**Text:** We may update this privacy policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy periodically to stay informed about how we protect your data.

### Contact
**Topic:** Questions about privacy
**Text:** If you have questions or concerns about this privacy policy or how we handle your data, please contact us through the application settings or support channels.

---

## Terms & Conditions Page (`/terms`)

### Acceptance of Terms
**Topic:** Agreement to terms
**Text:** By accessing and using Whoop-Insights, you accept and agree to be bound by the terms and provisions of this agreement. In addition, when using this service, you shall be subject to any posted guidelines or rules applicable to such services. If you do not agree with any of these terms, you are prohibited from using or accessing this application.

### Service Description
**Topic:** What the service provides
**Text:** Whoop-Insights is an independent analytics platform that processes WHOOP export data to provide personalized insights, recovery forecasts, training recommendations, and performance analytics. The service analyzes your uploaded WHOOP data locally on your device to generate machine learning-powered recommendations and visualizations.

### Not Affiliated with WHOOP
**Topic:** Independent service disclaimer
**Text:** Whoop-Insights is an independent project developed by Aishwary and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WHOOP Inc., or any of its subsidiaries or its affiliates. The official WHOOP website can be found at whoop.com. WHOOP is a registered trademark of WHOOP Inc.

### Not Medical Advice
**Topic:** Health information disclaimer
**Text:** The insights and recommendations provided by this application are for informational purposes only and do not constitute medical advice, diagnosis, or treatment. Always consult with a qualified healthcare professional before making any changes to your health or fitness regimen. The application should not be used as a substitute for professional medical advice, diagnosis, or treatment. Never disregard professional medical advice or delay in seeking it because of something you have read or seen in this application.

### Use of Service
**Topic:** Acceptable use
**Text:** You agree to use this application only for lawful purposes. You are responsible for ensuring that your use of the software complies with all applicable laws and regulations. As this is a local-first application, you are responsible for the security and privacy of the data stored on your own device. You agree not to use the service to violate any laws, infringe on any rights, or harm any person or entity.

### User Responsibilities
**Topic:** What you're responsible for
**Text:** You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. You are responsible for ensuring your local environment is secure and properly configured to run the application.

### Data Accuracy
**Topic:** Accuracy of uploaded data
**Text:** You are responsible for ensuring the accuracy and completeness of the WHOOP export data you upload. The application processes data as provided and is not responsible for errors or omissions in the source data. Results and recommendations are based solely on the data you provide.

### No Warranties
**Topic:** Service provided as-is
**Text:** This website is provided "as is" without any representations or warranties, express or implied. Whoop-Insights makes no representations or warranties in relation to this website or the information and materials provided on this website. Without prejudice to the generality of the foregoing paragraph, Whoop-Insights does not warrant that the website will be constantly available, or available at all, or that the information on this website is complete, true, accurate, or non-misleading.

### Limitations of Liability
**Topic:** Liability limitations
**Text:** In no event shall Whoop-Insights, its developers, or contributors be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use or inability to use the service, even if we have been advised of the possibility of such damages.

### Intellectual Property
**Topic:** Ownership of content
**Text:** The service and its original content, features, and functionality are owned by Whoop-Insights and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. Your WHOOP data remains your property, and we claim no ownership rights over your personal health data.

### Termination
**Topic:** Account termination
**Text:** We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the service will immediately cease. You may also terminate your account at any time by deleting it through the settings page.

### Changes to Terms
**Topic:** Terms updates
**Text:** We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.

### Governing Law
**Topic:** Applicable law
**Text:** These Terms shall be interpreted and governed by the laws of the jurisdiction in which the service is operated, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.

---

## Landing Page (`/`)

### Hero Section - Main Value Proposition
**Topic:** Primary headline explanation
**Text:** Whoop-Insights transforms your WHOOP data into actionable intelligence. While WHOOP tracks your metrics, we analyze patterns, predict outcomes, and provide personalized recommendations to optimize your training and recovery. Experience precision in your training and recovery through AI-powered insights that go beyond simple data visualization.

### Hero Section - Key Benefits
**Topic:** What makes us different
**Text:** Upload your WHOOP export and get AI-powered recovery forecasts, personalized training plans, and performance insights. Our machine learning models learn your unique physiology to provide recommendations tailored specifically to you. All processing happens locally on your device, ensuring your data never leaves your control.

### Call to Action - Why Page
**Topic:** Learn more about the value proposition
**Text:** Discover why Whoop-Insights exists and how it complements your WHOOP experience. Learn about our approach to turning raw data into clear decisions and daily actionable insights.

### Call to Action - Login
**Topic:** Get started
**Text:** Sign in to access your personalized dashboard, upload your WHOOP data, and start receiving AI-powered insights and recommendations.

---

## Why Page (`/why`)

### Introduction
**Topic:** The problem we solve
**Text:** WHOOP is great at tracking. Whoop-Insights is built for people who actually want to change. We don't replace the WHOOP app — we sit on top of it and turn raw numbers into clear decisions, daily.

### From Data to Action
**Topic:** Actionable insights vs. passive tracking
**Text:** The WHOOP app shows recovery scores, HRV, and trends. But it rarely answers "What should I do differently today?". Whoop-Insights turns every data point into actionable advice in plain language, helping you make informed decisions about your training and recovery.

### Personal Strategy
**Topic:** Individual optimization
**Text:** Most apps stop at summaries. We identify the top reasons your recovery drops, the habits ruining your sleep, and how to adjust your lifestyle on any given day. WHOOP is the monitor; we are the strategist.

### Holistic View
**Topic:** Integrated life factors
**Text:** Your body isn't just HRV. We bring together workouts, sleep, food, caffeine, steps, stress, and travel. Instead of isolated charts, see how your entire life affects your body in one unified view.

### Interactive Coach
**Topic:** Question-answering system
**Text:** The WHOOP app doesn't answer "Why am I tired on Tuesdays?". Whoop-Insights acts like a data analyst sitting on top of your data. Ask questions, get explanations, and see patterns you'd miss.

### Forward-Looking Predictions
**Topic:** Forecasting and early warnings
**Text:** Most health apps are backward-looking. We add recovery forecasts ("If you sleep X hours → expect Y% recovery") and early warning signals before you burn out. It's about what's likely to happen next.

### Goal-Oriented
**Topic:** Personalized goals
**Text:** Whether chasing fat loss, muscle gain, or peak performance, Whoop-Insights adapts insights, nudges, and weekly breakdowns to your specific goal, not just generic numbers.

### Clear Communication
**Topic:** Storytelling over noise
**Text:** Most dashboards overwhelm. We focus on clarity with weekly report cards, "Top 5 reasons your recovery dipped", and plain-language breakdowns. You're not just tracking your life – you're understanding it.

### Advanced Analytics
**Topic:** Deep dive capabilities
**Text:** For the 0.1% who want to go deeper. Unlock strain vs steps correlations, sleep debt vs performance, and stress vs HRV over time. Custom views built for serious optimization.

### Premium Design
**Topic:** User experience
**Text:** Designed to feel as good as it works. Interactive, magnetic visuals. A cosmic, responsive background. A dashboard that feels like NASA mission control for your body. If you look at it every day, it should feel premium.

---

## Login Page (`/login`)

### Welcome Message
**Topic:** Sign in instructions
**Text:** Welcome back! Sign in to access your AI training insights and personalized dashboard. Enter your email and password to continue, or use Google OAuth for quick access.

### Remember Me
**Topic:** Session persistence
**Text:** Check "Remember me" to stay signed in on this device. This will keep you logged in for 30 days unless you manually sign out.

### Forgot Password
**Topic:** Password recovery
**Text:** If you've forgotten your password, click "Forgot password?" to receive a reset link via email. The link will allow you to set a new password securely.

### Google Sign-In
**Topic:** OAuth authentication
**Text:** Continue with Google to sign in using your Google account. This is a quick and secure way to access your account without creating a separate password.

### Sign Up Link
**Topic:** New user registration
**Text:** Don't have an account? Sign up free to start uploading your WHOOP data and receiving personalized insights. Registration takes less than a minute.

---

## Signup Page (`/signup`)

### Account Creation
**Topic:** Getting started
**Text:** Create your account to start your journey to smarter training and faster recovery. Fill in your details below to get started with AI-powered insights.

### Full Name Field
**Topic:** Name requirement
**Text:** Enter your full name as you'd like it to appear in the application. This helps personalize your dashboard experience.

### Email Field
**Topic:** Email requirement
**Text:** Use a valid email address for account verification and password recovery. We'll never share your email with third parties.

### Password Requirements
**Topic:** Password security
**Text:** Your password must be at least 6 characters long. For better security, use a mix of letters, numbers, and special characters. Make sure to confirm your password matches.

### Google Sign-Up
**Topic:** OAuth registration
**Text:** Continue with Google to create an account using your Google credentials. This is the fastest way to get started.

### Existing Account
**Topic:** Already registered
**Text:** Already have an account? Sign in to access your dashboard and insights.

---

## Forgot Password Page (`/forgot-password`)

### Password Reset Instructions
**Topic:** How to reset your password
**Text:** Enter your email address below and we'll send you a password reset link. Check your inbox (and spam folder) for an email from us. Click the link in the email to set a new password.

### Email Verification
**Topic:** Email requirements
**Text:** Make sure you enter the email address associated with your account. If you don't receive an email within a few minutes, check your spam folder or try again.

### Return to Login
**Topic:** Remembered password
**Text:** Remember your password? Return to the sign in page to log in to your account.

---

## Reset Password Page (`/reset-password`)

### Set New Password
**Topic:** Password reset form
**Text:** Enter your new password below. Make sure it's at least 6 characters long and something you'll remember. You'll need to confirm the password to ensure it's entered correctly.

### Password Requirements
**Topic:** Security guidelines
**Text:** Your new password must be at least 6 characters. For better security, use a combination of uppercase and lowercase letters, numbers, and special characters.

### Invalid Link
**Topic:** Expired reset link
**Text:** This password reset link is invalid or has expired. Password reset links are valid for 1 hour. Please request a new reset link from the forgot password page.

### Success Message
**Topic:** Password updated
**Text:** Your password has been successfully reset. You'll be redirected to the login page where you can sign in with your new password.

---

## Dashboard Page (`/dashboard`)

### Welcome Section
**Topic:** Personalized greeting
**Text:** Welcome back! Your dashboard provides a comprehensive view of your training and recovery metrics. Scroll down to explore your insights, forecasts, and recommendations.

### Today's Overview
**Topic:** Current metrics explanation
**Text:** Today's Overview shows your current recovery score, yesterday's strain, today's HRV, and last night's sleep. These metrics form the foundation for your daily recommendations.

### Recovery Score
**Topic:** What recovery means
**Text:** Your recovery score (0-100%) indicates how ready your body is for training. Green (67%+) means you're ready for high-intensity work. Yellow (34-66%) suggests moderate activity. Red (<34%) indicates you need rest and recovery.

### Strain Score
**Topic:** Training load explanation
**Text:** Strain measures the cardiovascular load of your activities. Higher strain requires more recovery time. The score is based on your heart rate zones and activity duration.

### HRV (Heart Rate Variability)
**Topic:** HRV significance
**Text:** HRV measures the variation in time between heartbeats. Higher HRV generally indicates better recovery and readiness. It's one of the most sensitive indicators of your body's stress and recovery state.

### Sleep Hours
**Topic:** Sleep importance
**Text:** Sleep duration is critical for recovery. The dashboard shows your sleep from the previous night. Consistent, quality sleep is essential for optimal performance and recovery.

### AI Coach Section
**Topic:** Personalized recommendations
**Text:** Your personalized daily briefing analyzes your recovery, sleep, and strain to recommend the perfect plan for today. The AI Coach considers your unique patterns and goals to provide actionable advice.

### Today's Recommendation
**Topic:** Daily action plan
**Text:** Based on your current recovery state, we recommend specific workout types, optimal timing, and calorie targets. These recommendations adapt to your personal patterns and improve as you add more data.

### Tomorrow's Forecast
**Topic:** Recovery prediction
**Text:** Our machine learning model predicts tomorrow's recovery based on your planned activities, current strain, and sleep patterns. Use this forecast to plan your training schedule.

### Recovery Trends
**Topic:** Historical patterns
**Text:** Visualize your recovery baseline over the last 30 days. Spot patterns and adjust your lifestyle. Look for trends that indicate improving or declining recovery patterns.

### Performance Metrics
**Topic:** Strain and sleep visualization
**Text:** Track your strain and sleep patterns over time. Identify correlations between training load and recovery. Use these insights to optimize your training schedule.

### AI Personalization Insights
**Topic:** Machine learning recommendations
**Text:** Machine learning insights tailored to your unique physiology. These recommendations improve as you add more data. Each insight is based on patterns learned from your historical data.

### Recovery Velocity
**Topic:** Recovery timeline prediction
**Text:** Predicts how many days it will take to recover from your current recovery state to a target level (67%). This helps you plan training schedules and rest periods more effectively.

### Strain Tolerance
**Topic:** Personal strain threshold
**Text:** Identifies your safe strain threshold - the maximum strain you can handle before recovery significantly drops. Exceeding this threshold increases your risk of burnout and overtraining.

### No Data State
**Topic:** Getting started
**Text:** No data yet? Upload your WHOOP export to unlock AI-powered insights and personalized training plans. The upload process takes just a few minutes and will train personalized models on your data.

---

## Upload Page (`/upload`)

### Upload Instructions
**Topic:** How to upload data
**Text:** Drop your WHOOP ZIP file here or click to browse. We'll unpack, parse, and sync your data with your dashboard instantly. The file should be a ZIP file exported from the WHOOP app.

### File Requirements
**Topic:** Accepted file format
**Text:** Please upload a .zip file exported from WHOOP. The file should be under 4.5MB. If your export is larger, contact support or try exporting a shorter time period.

### Processing Information
**Topic:** What happens during upload
**Text:** During upload, we extract your data, parse CSV files, engineer features, and train personalized machine learning models. This process typically takes 1-2 minutes. Please keep the page open until processing is complete.

### Privacy Assurance
**Topic:** Data security
**Text:** Your data is processed locally and never shared with external services. All analysis happens on your device or server instance. Your biometric data remains private and under your control.

### Export Instructions
**Topic:** How to get WHOOP export
**Text:** To export your data from WHOOP: (1) Open the WHOOP mobile app, (2) Go to Settings → Privacy → Export Data, (3) Request export and wait for email, (4) Download the ZIP file from email, (5) Upload it here!

### Upload Success
**Topic:** After upload
**Text:** Once upload and processing are complete, you'll be redirected to your dashboard where you can explore your insights, forecasts, and recommendations. All models are trained and ready to use.

### Upload Error
**Topic:** Troubleshooting
**Text:** If upload fails, check that your file is a valid WHOOP export ZIP file and under 4.5MB. Ensure you have a stable internet connection. If problems persist, try exporting a shorter time period or contact support.

---

## Settings Page (`/settings`)

### Settings Overview
**Topic:** Account management
**Text:** Manage notifications, privacy, and account preferences. Customize your experience and control how your data is used and displayed.

### Notification Preferences
**Topic:** Alert settings
**Text:** Control email and push alerts for your insights and recommendations. Choose when and how you want to be notified about important updates, recovery forecasts, and personalized insights. (Feature coming soon)

### Privacy & Data
**Topic:** Data management
**Text:** Manage downloads, model storage, and data removal. Your data is processed locally and never shared. You can download your data, view stored models, and delete your account and all associated data at any time. (Granular controls coming soon)

### Account Information
**Topic:** Profile details
**Text:** View and update your account information, including your name and email address. Manage your authentication methods and security settings.

### Data Export
**Topic:** Download your data
**Text:** Export all your data, including raw metrics, processed features, and trained models. This allows you to maintain a backup or transfer your data to another system. (Feature coming soon)

### Account Deletion
**Topic:** Remove account
**Text:** Permanently delete your account and all associated data. This action cannot be undone. All your data, models, and insights will be permanently removed from local storage. (Feature coming soon)

---

## Advanced Analytics Page (`/advanced-analytics`)

### Analytics Overview
**Topic:** Deep dive capabilities
**Text:** Deep dive into your biometric trends and correlations. Advanced Analytics provides professional-level insights for serious optimization. Explore relationships between metrics, identify patterns, and understand how different factors influence your performance.

### Metric Selection
**Topic:** Choosing metrics to analyze
**Text:** Select multiple metrics to compare and analyze. Available metrics include recovery, strain, sleep, HRV, resting heart rate, SpO2, respiratory rate, skin temperature, and calories. Compare any combination to identify correlations and patterns.

### Date Range Filter
**Topic:** Time period selection
**Text:** Filter your data by time period: Last 7 days, Last 30 days, Last 3 months, Last 6 months, or Last year. Adjust the range to focus on specific time periods or view long-term trends.

### Comparative Statistics
**Topic:** Period comparisons
**Text:** Compare current period performance against previous periods. See how your metrics have changed over time and identify trends in your training and recovery patterns.

### Correlation Analysis
**Topic:** Metric relationships
**Text:** Scatter plots show correlations between different metrics. Identify which factors most strongly influence your recovery and performance. Strong correlations can reveal actionable insights.

### Distribution Analysis
**Topic:** Value distributions
**Text:** Histograms show the distribution of your metric values. Understand the range and frequency of your measurements. Identify outliers and understand the typical range for each metric.

### Chart Interpretation
**Topic:** Reading the charts
**Text:** The main chart displays all selected metrics over time. Use this to identify trends, patterns, and relationships. Hover over data points for detailed values. Zoom and pan to explore specific time periods.

### No Data State
**Topic:** Getting started with analytics
**Text:** No data available for the selected range. Upload your WHOOP data or adjust the date range to view analytics. You need at least 7 days of data for meaningful analysis.

---

## Calorie GPS Page (`/calorie-gps`)

### Calorie GPS Overview
**Topic:** Workout optimization tool
**Text:** Minimal, neon-clear optimizer tuned to your recovery state. Calorie GPS predicts the most efficient workout type and duration to burn your target calories based on your current recovery. The tool optimizes for time efficiency while preventing overtraining.

### Recovery Slider
**Topic:** Setting your recovery level
**Text:** Adjust your recovery score (0-100%) to reflect your current state. Green zone (67%+) means you're ready for high-intensity work. Yellow zone (34-66%) suggests moderate activity. Red zone (<34%) indicates you need lighter, longer activities.

### Target Calories
**Topic:** Setting calorie goals
**Text:** Set your target calorie burn for the workout. The tool will calculate the most efficient workout type and duration to reach this goal based on your recovery state. Adjust the slider to see how different calorie targets affect workout recommendations.

### Optimal Workout
**Topic:** Recommended workout
**Text:** The optimal workout is the most time-efficient way to burn your target calories given your current recovery state. Higher recovery enables more intense, time-efficient workouts. Lower recovery suggests longer, lower-intensity activities.

### Workout Efficiency
**Topic:** Calories per minute
**Text:** Efficiency shows how many calories you'll burn per minute for each workout type. Higher efficiency means you'll reach your calorie goal faster. Efficiency varies based on your recovery state and the workout type.

### Time Required
**Topic:** Workout duration
**Text:** The time needed to burn your target calories varies by workout type and your recovery state. Higher recovery allows for shorter, more intense workouts. Lower recovery requires longer, gentler activities.

### Alternative Options
**Topic:** Other workout choices
**Text:** Explore alternative workout types if the optimal choice doesn't fit your schedule or preferences. Each option shows the time required and efficiency compared to your baseline.

### ML Personalization
**Topic:** Personalized predictions
**Text:** When synced with your data, Calorie GPS uses machine learning models trained on your historical patterns. This provides more accurate predictions tailored to your unique physiology and performance history.

### Recovery Drivers
**Topic:** Factors affecting recovery
**Text:** See which habits and factors most strongly influence your recovery. Journal insights show how behaviors like alcohol, stress, or travel impact your next-day recovery. Use this to optimize your lifestyle for better performance.

### How It Works
**Topic:** Algorithm explanation
**Text:** Our ML model analyzes your recovery state and predicts the most efficient workout type for burning target calories. Higher recovery enables more intense, time-efficient workouts. Lower recovery suggests longer, lower-intensity activities to avoid overtraining while still hitting your calorie goals.

---

## Model Metrics Page (`/model-metrics`)

### Model Metrics Overview
**Topic:** Understanding your models
**Text:** View performance metrics and parameters for all your personalized ML models. Each model is trained on your data to provide specific insights and predictions. Understanding model performance helps you interpret recommendations and predictions.

### Model Performance
**Topic:** R² Score and Accuracy
**Text:** R² Score (for regression models) shows how well the model fits your data. Scores above 0.8 indicate excellent performance. Accuracy (for classification models) shows the percentage of correct predictions. Higher scores mean more reliable recommendations.

### Mean Absolute Error (MAE)
**Topic:** Prediction accuracy
**Text:** MAE measures the average difference between predicted and actual values. Lower MAE means more accurate predictions. This metric helps you understand the typical error range for model predictions.

### Sample Size
**Topic:** Training data amount
**Text:** Sample size shows how many data points were used to train the model. Larger sample sizes generally lead to more reliable models. Models need sufficient data to learn your patterns accurately.

### Feature Importance
**Topic:** What factors matter most
**Text:** Feature importance shows which input factors most strongly influence the model's predictions. Higher importance means that factor has a stronger impact on the output. Use this to understand what drives your personalized recommendations.

### Model Purpose
**Topic:** What each model does
**Text:** Each model serves a specific purpose: Calorie GPS optimizes workout efficiency, Recovery Velocity predicts recovery timelines, Strain Tolerance identifies safe thresholds, and others provide specialized insights. Understanding each model's purpose helps you interpret its recommendations.

### Model Usage
**Topic:** Where models are used
**Text:** Models are integrated throughout the application. Recovery Forecast powers tomorrow's predictions, Calorie GPS drives workout recommendations, and Personalization Insights use multiple models to provide comprehensive recommendations.

### Performance Notes
**Topic:** Interpreting model quality
**Text:** Excellent performance (R² ≥ 0.8) means predictions are highly reliable. Good performance (R² ≥ 0.6) means predictions are generally reliable but may vary. Moderate performance (R² ≥ 0.4) means use predictions as guides rather than absolutes. Lower scores indicate the model is still learning your patterns.

### No Models State
**Topic:** Getting started
**Text:** No models trained yet? Upload your WHOOP data to train personalized ML models. Model metrics will appear here once training is complete. You need sufficient data (typically 14-30 days) for reliable model training.

---

## General Content Needs

### Error Pages
**Topic:** Error handling messages
**Text:** User-friendly error messages should explain what went wrong and how to resolve it. Include helpful guidance for common errors like network issues, authentication failures, and data processing problems.

### Loading States
**Topic:** Progress indicators
**Text:** Clear loading messages that explain what's happening during data processing, model training, and API calls. Users should understand the progress and expected wait times.

### Empty States
**Topic:** No data messages
**Text:** Helpful messages when no data is available, explaining how to get started, what data is needed, and what users can expect once data is uploaded.

### Tooltips and Help Text
**Topic:** Contextual help
**Text:** Tooltips and help text throughout the application explaining metrics, features, and recommendations. Users should be able to understand what each metric means and how to interpret insights.

### Onboarding
**Topic:** First-time user guidance
**Text:** Step-by-step guidance for new users explaining how to upload data, interpret insights, and use key features. This could be a guided tour or progressive disclosure of features.

### FAQ Section
**Topic:** Common questions
**Text:** Frequently asked questions covering data privacy, model accuracy, interpretation of metrics, troubleshooting upload issues, and understanding recommendations.

---

## Content Update Schedule

### Regular Updates
**Topic:** Keeping content current
**Text:** Review and update content quarterly to reflect new features, improved models, and user feedback. Keep privacy policy and terms updated as the service evolves.

### Feature Announcements
**Topic:** New feature communication
**Text:** When new features are added, update relevant pages with explanations of what's new, how to use it, and what benefits it provides.

### Model Updates
**Topic:** Model improvement communication
**Text:** When models are improved or new models are added, update the Model Metrics page and relevant feature pages to explain the changes and improvements.

---

## Notes for Content Writers

1. **Tone:** Professional yet approachable, technical but accessible
2. **Length:** Keep explanations concise but complete
3. **Formatting:** Use clear headings, bullet points, and short paragraphs
4. **Examples:** Include concrete examples where helpful
5. **Actionability:** Focus on what users can do with the information
6. **Consistency:** Use consistent terminology across all pages
7. **Accessibility:** Write for users with varying technical knowledge levels























