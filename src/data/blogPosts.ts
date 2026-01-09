// Mock CMS data for blog posts

export type BlogCategory = 'Hackathon' | 'Startup' | 'Public Speaking' | 'Technology';

export interface BlogPost {
  id: string;
  title: string;
  category: BlogCategory;
  image: string;
  readTime: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar: string;
  };
  publishedAt: string;
  tableOfContents: { id: string; title: string }[];
}

export const CATEGORY_COLORS: Record<BlogCategory, string> = {
  'Hackathon': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Startup': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'Public Speaking': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Technology': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'why-good-code-loses-to-bad-pitches',
    title: 'Why Good Code Loses to Bad Pitches',
    category: 'Hackathon',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=600&fit=crop',
    readTime: '5 min read',
    excerpt: 'You spent 36 hours building something incredible. But in the final 3 minutes, a team with a worse product walked away with the prize. Here\'s why presentation matters more than code.',
    author: {
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    },
    publishedAt: '2024-01-15',
    tableOfContents: [
      { id: 'the-harsh-reality', title: 'The Harsh Reality' },
      { id: 'what-judges-actually-see', title: 'What Judges Actually See' },
      { id: 'the-pitch-framework', title: 'The Pitch Framework' },
      { id: 'practice-makes-perfect', title: 'Practice Makes Perfect' },
    ],
    content: `
## The Harsh Reality {#the-harsh-reality}

Every hackathon has the same story: a brilliant team builds an incredible technical solution, complete with clean architecture, proper testing, and innovative features. But when demo time comes, they fumble through a confusing explanation while the audience checks their phones.

Meanwhile, another team with a half-working MVP delivers a captivating story that has judges nodding along. Guess who wins?

**The truth is brutal: hackathon judges have limited time and even more limited attention.** They're evaluating 20+ projects in a single afternoon. Your beautiful codebase is invisible to them—all they see is your 3-minute pitch.

## What Judges Actually See {#what-judges-actually-see}

Understanding the judge's perspective changes everything:

- **First 30 seconds:** They decide if your project is interesting
- **Middle section:** They're looking for clarity, not complexity
- **Final moments:** They want to feel excited about the potential

Judges aren't reading your GitHub commits. They're watching your body language, listening to your voice modulation, and feeling your energy. A confident presenter with a simple demo beats a nervous genius with groundbreaking tech.

> "I've judged over 50 hackathons. The winning teams aren't always the best coders—they're the best communicators." — Sarah Kim, Google Developer Advocate

## The Pitch Framework {#the-pitch-framework}

Here's the structure that wins hackathons:

1. **Hook (15 seconds):** Start with a surprising statistic or relatable pain point
2. **Problem (30 seconds):** Make the audience feel the frustration
3. **Solution (45 seconds):** Show, don't tell. Demo the magic moment
4. **How It Works (30 seconds):** Brief technical credibility without jargon
5. **Impact (30 seconds):** Paint a picture of the future
6. **Call to Action (15 seconds):** End with energy and clarity

Notice that technical details get less than 20% of your time. That's intentional.

## Practice Makes Perfect {#practice-makes-perfect}

The teams that win consistently aren't naturally gifted presenters—they practice obsessively. They rehearse their timing, anticipate questions, and refine their narrative.

Tools like AI-powered pitch coaches can give you real-time feedback on your pacing, filler words, and eye contact. The difference between your first run-through and your tenth is night and day.

**Your code deserves to be seen. Make sure your pitch does it justice.**
    `,
  },
  {
    id: 'investors-listen-with-eyes-body-language',
    title: 'Investors Listen With Their Eyes: Body Language Secrets',
    category: 'Startup',
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=600&fit=crop',
    readTime: '6 min read',
    excerpt: 'Before you say a word, investors have already formed an opinion. Learn the non-verbal cues that signal confidence, competence, and trustworthiness.',
    author: {
      name: 'Maria Santos',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
    publishedAt: '2024-01-10',
    tableOfContents: [
      { id: 'the-7-38-55-rule', title: 'The 7-38-55 Rule' },
      { id: 'power-poses-that-work', title: 'Power Poses That Work' },
      { id: 'eye-contact-mastery', title: 'Eye Contact Mastery' },
      { id: 'hands-tell-the-story', title: 'Hands Tell the Story' },
    ],
    content: `
## The 7-38-55 Rule {#the-7-38-55-rule}

Professor Albert Mehrabian's famous study revealed something counterintuitive: when it comes to communicating feelings and attitudes, only 7% of the message comes from words. The rest? 38% from tone of voice, and a whopping 55% from body language.

For founders pitching to investors, this means your slide deck is the smallest part of the equation. **Your presence in the room matters more than your projections.**

Investors are pattern-matching machines. They've seen hundreds of pitches, and they're unconsciously scanning for signals of confidence, competence, and trustworthiness. Your body is constantly broadcasting these signals—the question is whether you're in control of the transmission.

## Power Poses That Work {#power-poses-that-work}

Social psychologist Amy Cuddy's research on "power posing" has been debated, but the core insight remains valuable: how you hold your body affects how others perceive you and how you feel about yourself.

**Before your pitch:**
- Stand in a private space with arms raised in a V shape
- Take up space—don't shrink
- Breathe deeply from your diaphragm

**During your pitch:**
- Plant your feet shoulder-width apart
- Keep your shoulders back and chest open
- Avoid self-soothing gestures (touching face, crossing arms)

The goal isn't to look aggressive—it's to look grounded and confident. Think of the body language of people you trust: they're typically still, open, and taking up appropriate space.

## Eye Contact Mastery {#eye-contact-mastery}

Eye contact is the single most powerful tool in your non-verbal arsenal. It signals:
- Confidence (you're not afraid to be seen)
- Honesty (you're not hiding anything)
- Connection (you care about the listener)

The challenge in pitch settings is managing eye contact with multiple investors. Here's the technique:

1. **Complete a thought** while looking at one person (3-5 seconds)
2. **Transition your gaze** during a natural pause
3. **Never dart your eyes** or scan the room nervously

Practice this with friends: can you maintain comfortable eye contact while delivering complex information? It takes training, but it's learnable.

## Hands Tell the Story {#hands-tell-the-story}

Your hands are incredibly expressive—use them intentionally:

✅ **Do:** Use open palm gestures when sharing vision
✅ **Do:** Use precise hand movements when explaining data
✅ **Do:** Keep hands visible at all times

❌ **Don't:** Hide hands in pockets (signals insecurity)
❌ **Don't:** Point at people (feels aggressive)
❌ **Don't:** Fidget with objects (distracting)

The best founders look like they're having a passionate conversation, not delivering a memorized script. Your hands should emphasize your words, not distract from them.

**Master these non-verbal skills, and you'll find investors leaning in before you even get to your financials.**
    `,
  },
  {
    id: 'introverts-guide-to-stage-presence',
    title: "The Introvert's Guide to Stage Presence",
    category: 'Public Speaking',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=600&fit=crop',
    readTime: '7 min read',
    excerpt: "Being quiet doesn't mean being invisible. Discover how introverts can leverage their unique strengths to command any room—without pretending to be someone else.",
    author: {
      name: 'James Wong',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
    publishedAt: '2024-01-05',
    tableOfContents: [
      { id: 'introversion-is-not-weakness', title: 'Introversion Is Not Weakness' },
      { id: 'the-preparation-advantage', title: 'The Preparation Advantage' },
      { id: 'energy-management', title: 'Energy Management' },
      { id: 'authentic-presence', title: 'Authentic Presence' },
    ],
    content: `
## Introversion Is Not Weakness {#introversion-is-not-weakness}

Let's start by destroying a myth: introversion has nothing to do with public speaking ability. Some of history's most compelling speakers—from Abraham Lincoln to Rosa Parks—were introverts.

Introversion simply means you recharge through solitude rather than social interaction. It says nothing about your ability to communicate, persuade, or inspire.

In fact, introverts often have natural advantages:
- **Deep preparation:** We think before we speak
- **Authenticity:** We don't perform—we share
- **Listening skills:** We understand our audience
- **Written communication:** We can craft compelling narratives

The challenge isn't changing who you are—it's learning to present authentically in high-energy environments.

## The Preparation Advantage {#the-preparation-advantage}

Extroverts often wing it. Introverts prepare obsessively. Guess which approach leads to better outcomes?

**Your preparation should include:**

1. **Script development:** Write out your key points (but don't memorize word-for-word)
2. **Anticipate questions:** Prepare for the Q&A—this is where introverts shine
3. **Environment familiarity:** Visit the venue beforehand if possible
4. **Technical rehearsal:** Know your slides and demos cold

The more prepared you are, the less energy you'll spend on anxiety. Preparation is your superpower—lean into it.

> "I never felt comfortable improvising on stage. But I realized I didn't have to. My preparation made me appear spontaneous because I had answers ready for everything." — Susan Cain, author of "Quiet"

## Energy Management {#energy-management}

Public speaking is energetically expensive for introverts. Plan accordingly:

**Before the presentation:**
- Protect quiet time in the hours leading up
- Avoid small talk and networking—save your energy
- Find a private space for final preparation

**During the presentation:**
- Pace yourself—you don't need to match extrovert energy
- Take strategic pauses (they add gravitas)
- Focus on one friendly face when you need grounding

**After the presentation:**
- Schedule recovery time
- Limit post-event socializing
- Reflect and journal about what worked

Understanding your energy patterns isn't weakness—it's strategic self-awareness.

## Authentic Presence {#authentic-presence}

The goal isn't to become an extrovert on stage. The goal is to be a compelling version of yourself.

**What authentic introvert presence looks like:**
- Thoughtful pauses instead of constant talking
- Deep eye contact with individuals rather than scanning
- Intensity over volume
- Substance over showmanship

Some of the most memorable presentations aren't the loudest—they're the most genuine. Your audience can sense when someone is being real versus performing.

**The secret? Stop trying to be someone else. Start presenting as the best version of who you already are.**
    `,
  },
  {
    id: 'how-we-analyze-charisma-with-ai',
    title: 'Under the Hood: How We Analyze Charisma with AI',
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop',
    readTime: '8 min read',
    excerpt: "Charisma feels magical, but it's actually measurable. Dive into the computer vision and NLP techniques that power modern presentation coaching.",
    author: {
      name: 'Dr. Priya Sharma',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop',
    },
    publishedAt: '2024-01-01',
    tableOfContents: [
      { id: 'breaking-down-charisma', title: 'Breaking Down Charisma' },
      { id: 'computer-vision-signals', title: 'Computer Vision Signals' },
      { id: 'voice-analysis', title: 'Voice Analysis' },
      { id: 'the-feedback-loop', title: 'The Feedback Loop' },
    ],
    content: `
## Breaking Down Charisma {#breaking-down-charisma}

"Charisma" sounds like an innate gift—you either have it or you don't. But decades of research in psychology and communication have identified specific, trainable behaviors that create the perception of charisma:

1. **Presence:** The ability to make others feel seen and heard
2. **Power:** Signals of confidence and competence
3. **Warmth:** Genuine interest and emotional connection

Each of these dimensions can be measured through observable behaviors. And if something can be measured, it can be improved through feedback.

Modern AI coaching tools use computer vision and natural language processing to quantify these behaviors in real-time, giving speakers objective feedback that was previously only available through expensive human coaches.

## Computer Vision Signals {#computer-vision-signals}

When you record a practice session, AI can analyze:

**Facial Expressions:**
- Smile frequency and authenticity (Duchenne vs. social smiles)
- Eyebrow movements (indicates engagement and emphasis)
- Head nodding patterns (signals confidence and agreement)

**Eye Contact:**
- Gaze direction and consistency
- Blink rate (elevated rates can signal anxiety)
- Camera awareness in virtual presentations

**Body Language:**
- Posture analysis (open vs. closed positions)
- Gesture frequency and type
- Movement patterns (purposeful vs. nervous)

Using libraries like MediaPipe and TensorFlow.js, these signals can be extracted from standard webcam video at 30+ frames per second. The key is correlating these signals with audience perception studies.

## Voice Analysis {#voice-analysis}

The audio track is equally rich with information:

**Speech Patterns:**
- Words per minute (optimal range: 130-150 WPM)
- Pause frequency and duration
- Filler word detection ("um", "uh", "like", "you know")

**Vocal Qualities:**
- Pitch variation (monotone vs. dynamic)
- Volume modulation
- Speech clarity and articulation

**Sentiment Analysis:**
- Emotional tone detection
- Confidence markers in language choices
- Hedging words that undermine authority

Modern speech-to-text APIs achieve near-human accuracy, enabling real-time transcription that can be analyzed for patterns invisible to the speaker themselves.

## The Feedback Loop {#the-feedback-loop}

The magic happens when these signals are combined and translated into actionable feedback:

\`\`\`
Input: Video/Audio Recording
↓
Processing: Multi-modal feature extraction
↓
Analysis: Pattern matching against "charisma" benchmarks
↓
Output: Specific, actionable recommendations
\`\`\`

For example, if the AI detects:
- Low eye contact (< 50% camera gaze)
- High filler word count (> 5 per minute)
- Monotone pitch variation

It can generate feedback like:
> "Try looking at the camera when making key points. You used 'um' 12 times—try pausing silently instead. Add vocal emphasis when stating your main thesis."

**This creates a rapid iteration loop that accelerates skill development far beyond traditional practice methods.**

The goal isn't to create robotic, AI-optimized speakers. It's to surface blind spots and give speakers the awareness they need to develop their own authentic, compelling style.
    `,
  },
];

export const getBlogPost = (id: string): BlogPost | undefined => {
  return BLOG_POSTS.find(post => post.id === id);
};

export const getPostsByCategory = (category: BlogCategory | 'All'): BlogPost[] => {
  if (category === 'All') return BLOG_POSTS;
  return BLOG_POSTS.filter(post => post.category === category);
};
