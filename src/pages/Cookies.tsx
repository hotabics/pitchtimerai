import { motion } from "framer-motion";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-lg dark:prose-invert max-w-none"
        >
          <h1>Cookie Policy</h1>
          <p className="lead">Last updated: January 9, 2026</p>

          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are stored on your device (computer, tablet, or mobile) 
            when you visit a website. They help websites remember your preferences and improve your 
            browsing experience.
          </p>

          <h2>2. How We Use Cookies</h2>
          <p>PitchPerfect uses cookies for the following purposes:</p>

          <h3>Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable core 
            functionality such as:
          </p>
          <ul>
            <li><strong>Authentication:</strong> Keeping you signed in during your session</li>
            <li><strong>Security:</strong> Protecting against cross-site request forgery</li>
            <li><strong>Preferences:</strong> Remembering your theme (light/dark mode) settings</li>
            <li><strong>Session State:</strong> Maintaining your progress through the pitch wizard</li>
          </ul>

          <h3>Analytics Cookies</h3>
          <p>
            These cookies help us understand how visitors interact with our website. We use this 
            information to improve our service. Analytics cookies collect:
          </p>
          <ul>
            <li>Pages visited and time spent on each page</li>
            <li>Features used (e.g., AI Coach, script generation)</li>
            <li>Error reports and performance metrics</li>
            <li>Device and browser information (anonymized)</li>
          </ul>

          <h3>Functional Cookies</h3>
          <p>
            These cookies enable enhanced functionality and personalization:
          </p>
          <ul>
            <li><strong>What's New Modal:</strong> Tracking which version updates you've seen</li>
            <li><strong>User Preferences:</strong> Remembering your plan status and settings</li>
            <li><strong>Local Storage:</strong> Saving draft scripts and practice session data</li>
          </ul>

          <h2>3. Third-Party Cookies</h2>
          <p>We may use cookies from the following third-party services:</p>
          <ul>
            <li><strong>Stripe:</strong> For secure payment processing</li>
            <li><strong>PostHog:</strong> For product analytics (if enabled)</li>
            <li><strong>Google:</strong> For OAuth authentication (if you sign in with Google)</li>
          </ul>

          <h2>4. Cookie Duration</h2>
          <table>
            <thead>
              <tr>
                <th>Cookie Type</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Session Cookies</td>
                <td>Deleted when you close your browser</td>
              </tr>
              <tr>
                <td>Persistent Cookies</td>
                <td>Up to 1 year (e.g., theme preferences)</td>
              </tr>
              <tr>
                <td>Authentication Cookies</td>
                <td>Up to 30 days (or until you log out)</td>
              </tr>
            </tbody>
          </table>

          <h2>5. Managing Cookies</h2>
          <p>
            You can control and manage cookies in several ways:
          </p>
          <h3>Browser Settings</h3>
          <p>
            Most browsers allow you to refuse or delete cookies through their settings. 
            Here are links to cookie management for popular browsers:
          </p>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
            <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
          </ul>

          <h3>Impact of Disabling Cookies</h3>
          <p>
            Please note that disabling cookies may affect the functionality of PitchPerfect:
          </p>
          <ul>
            <li>You may not be able to stay signed in</li>
            <li>Your preferences may not be saved between sessions</li>
            <li>Some features may not work as expected</li>
          </ul>

          <h2>6. Local Storage</h2>
          <p>
            In addition to cookies, we use browser local storage to store:
          </p>
          <ul>
            <li>Theme preferences (light/dark mode)</li>
            <li>User plan status for the current session</li>
            <li>Draft content and wizard progress</li>
            <li>API keys you choose to store locally (encrypted)</li>
          </ul>
          <p>
            You can clear local storage through your browser's developer tools or by clearing 
            site data in your browser settings.
          </p>

          <h2>7. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in our practices 
            or for operational, legal, or regulatory reasons. We will notify you of any material 
            changes by posting the updated policy on this page.
          </p>

          <h2>8. Contact Us</h2>
          <p>
            If you have questions about our use of cookies, please contact us at privacy@pitchperfect.app.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Cookies;
