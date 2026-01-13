import { motion } from "framer-motion";
import { useState } from "react";

const techStack = [
  { 
    name: "OpenAI", 
    description: "GPT-4o & Whisper",
    details: "Powers intelligent script generation, content analysis, and speech-to-text transcription for pitch evaluation.",
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
      </svg>
    )
  },
  { 
    name: "ElevenLabs", 
    description: "Voice AI & TTS",
    details: "Delivers ultra-realistic AI voices for interrogation jurors and high-accuracy speech-to-text transcription.",
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M7 4h3v16H7V4zm7 0h3v16h-3V4z"/>
      </svg>
    )
  },
  { 
    name: "MediaPipe", 
    description: "Face Mesh AI",
    details: "Real-time facial landmark detection for eye contact tracking and body language analysis during practice.",
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm-.001 4.5a3 3 0 110 6 3 3 0 010-6zm0 15a8.949 8.949 0 01-6.364-2.636.75.75 0 011.06-1.061A7.448 7.448 0 0012 18a7.448 7.448 0 005.303-2.197.75.75 0 011.061 1.06A8.949 8.949 0 0111.999 19.5z"/>
      </svg>
    )
  },
  { 
    name: "Supabase", 
    description: "Backend & Auth",
    details: "Secure authentication, real-time database, and edge functions powering the entire backend infrastructure.",
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579v7.509c0 .986 1.255 1.403 1.869.63l9.262-11.653c1.093-1.375.114-3.403-1.645-3.403h-9.583V1.036h.001z"/>
      </svg>
    )
  },
  { 
    name: "Firecrawl", 
    description: "Web Scraping",
    details: "Intelligent web scraping to extract project details from URLs for automatic pitch context generation.",
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    )
  },
  { 
    name: "PostHog", 
    description: "Analytics",
    details: "Product analytics and session replay for understanding user behavior and improving the experience.",
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12 0L0 12h4v12h16V12h4L12 0zm0 4.83L18.17 11H16v9H8v-9H5.83L12 4.83z"/>
      </svg>
    )
  },
  { 
    name: "Stripe", 
    description: "Payments",
    details: "Secure payment processing for premium subscriptions with seamless checkout and billing management.",
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
      </svg>
    )
  },
  { 
    name: "Resend", 
    description: "Email Delivery",
    details: "Reliable email delivery for NPS alerts, weekly analytics digests, and user notifications.",
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 0l8 5 8-5H4zm0 2v10h16V8l-8 5-8-5z"/>
      </svg>
    )
  },
];

const TechCard = ({ tech, index }: { tech: typeof techStack[0]; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      <motion.div
        animate={{
          scale: isHovered ? 1.05 : 1,
          y: isHovered ? -4 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm cursor-pointer min-w-[140px] h-[100px] justify-center transition-colors hover:border-primary/50 hover:bg-card"
      >
        <motion.div
          animate={{
            scale: isHovered ? 1.15 : 1,
            rotate: isHovered ? 5 : 0,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="text-muted-foreground group-hover:text-primary transition-colors duration-300"
        >
          {tech.logo}
        </motion.div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{tech.name}</p>
          <p className="text-xs text-muted-foreground">{tech.description}</p>
        </div>
      </motion.div>

      {/* Hover tooltip with details */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 10,
          scale: isHovered ? 1 : 0.95,
        }}
        transition={{ duration: 0.2 }}
        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 pointer-events-none"
      >
        <div className="bg-popover border border-border rounded-lg shadow-xl p-3 w-64">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-primary">{tech.logo}</div>
            <div>
              <p className="font-semibold text-sm">{tech.name}</p>
              <p className="text-xs text-muted-foreground">{tech.description}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {tech.details}
          </p>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-popover border-l border-t border-border rotate-45" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export const TechStackBanner = () => {
  return (
    <section className="py-16 px-4 border-y border-border/30 overflow-visible">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs text-muted-foreground uppercase tracking-wider mb-8"
          >
            Powered by industry-leading technology
          </motion.p>
          
          {/* 2x4 Grid Layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {techStack.map((tech, index) => (
              <TechCard key={tech.name} tech={tech} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};