import { motion } from "framer-motion";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-lg dark:prose-invert max-w-none"
        >
          <h1>Terms of Service</h1>
          <p className="lead">Last updated: January 9, 2026</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using PitchPerfect ("the Service"), you accept and agree to be bound by 
            the terms and provision of this agreement. If you do not agree to abide by these terms, 
            please do not use this service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            PitchPerfect provides AI-powered pitch practice and feedback tools, including but not 
            limited to script generation, video recording analysis, speech-to-text transcription, 
            and presentation creation features.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            To access certain features, you may be required to create an account. You are responsible 
            for maintaining the confidentiality of your account credentials and for all activities 
            that occur under your account.
          </p>

          <h2>4. User Content</h2>
          <p>
            You retain ownership of all content you submit, post, or display through the Service. 
            By submitting content, you grant PitchPerfect a worldwide, non-exclusive license to use, 
            reproduce, and process your content solely for the purpose of providing the Service.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose</li>
            <li>Upload content that infringes on intellectual property rights</li>
            <li>Attempt to gain unauthorized access to any portion of the Service</li>
            <li>Use automated systems to access the Service without permission</li>
            <li>Interfere with or disrupt the integrity of the Service</li>
          </ul>

          <h2>6. Payment Terms</h2>
          <p>
            Certain features require payment. All fees are non-refundable unless otherwise stated. 
            The 48h Hackathon Pass expires exactly 48 hours after purchase. Subscription plans 
            renew automatically unless cancelled.
          </p>

          <h2>7. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by 
            PitchPerfect and are protected by international copyright, trademark, and other 
            intellectual property laws.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            PitchPerfect shall not be liable for any indirect, incidental, special, consequential, 
            or punitive damages resulting from your use of the Service. Our total liability shall 
            not exceed the amount you paid us in the past twelve months.
          </p>

          <h2>9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of any 
            material changes via email or through the Service. Continued use after changes 
            constitutes acceptance of the new terms.
          </p>

          <h2>10. Contact</h2>
          <p>
            For questions about these Terms of Service, please contact us at legal@pitchperfect.app.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Terms;
