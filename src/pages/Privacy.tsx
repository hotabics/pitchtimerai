import { motion } from "framer-motion";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-lg dark:prose-invert max-w-none"
        >
          <h1>Privacy Policy</h1>
          <p className="lead">Last updated: January 9, 2026</p>

          <h2>1. Information We Collect</h2>
          <h3>Information You Provide</h3>
          <ul>
            <li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
            <li><strong>Payment Information:</strong> Processed securely through Stripe; we do not store card details</li>
            <li><strong>Content:</strong> Scripts, recordings, and presentations you create using the Service</li>
          </ul>

          <h3>Information Collected Automatically</h3>
          <ul>
            <li><strong>Usage Data:</strong> Features used, session duration, and interaction patterns</li>
            <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
            <li><strong>Camera/Microphone Data:</strong> Processed locally for AI analysis; recordings stored only with your consent</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve the Service</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, and support messages</li>
            <li>Analyze usage patterns to improve user experience</li>
            <li>Detect, investigate, and prevent fraudulent transactions</li>
          </ul>

          <h2>3. AI Processing</h2>
          <p>
            Our Service uses AI models to analyze your pitch delivery. This includes:
          </p>
          <ul>
            <li><strong>Speech Analysis:</strong> Transcription, filler word detection, pacing analysis</li>
            <li><strong>Visual Analysis:</strong> Eye contact tracking, facial expressions, body language (processed locally via MediaPipe)</li>
            <li><strong>Content Generation:</strong> AI-generated scripts and suggestions based on your inputs</li>
          </ul>
          <p>
            Video recordings are processed for analysis and deleted after 30 days unless you choose to save them.
          </p>

          <h2>4. Data Sharing</h2>
          <p>We do not sell your personal information. We may share data with:</p>
          <ul>
            <li><strong>Service Providers:</strong> Third parties that help us operate the Service (hosting, analytics, payment processing)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
          </ul>

          <h2>5. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including 
            encryption in transit and at rest, secure authentication, and regular security audits.
          </p>

          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and receive a copy of your personal data</li>
            <li>Correct inaccurate personal data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to processing of your personal data</li>
            <li>Data portability (receive your data in a structured format)</li>
          </ul>

          <h2>7. Cookies</h2>
          <p>
            We use essential cookies to maintain your session and preferences. Analytics cookies 
            help us understand how you use the Service. You can manage cookie preferences in your 
            browser settings.
          </p>

          <h2>8. Children's Privacy</h2>
          <p>
            The Service is not intended for children under 13. We do not knowingly collect 
            personal information from children under 13. If you believe we have collected such 
            information, please contact us.
          </p>

          <h2>9. International Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. 
            We ensure appropriate safeguards are in place for such transfers.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any 
            material changes by posting the new policy on this page and updating the "Last updated" date.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            For questions about this Privacy Policy, please contact us at privacy@pitchperfect.app.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Privacy;
