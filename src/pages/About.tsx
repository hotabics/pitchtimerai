import { motion } from "framer-motion";
import { Users, Target, Sparkles, Heart } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Hero */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">About PitchPerfect</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're on a mission to help founders, students, and innovators deliver pitches that win.
            </p>
          </div>

          {/* Story */}
          <section className="prose prose-lg dark:prose-invert max-w-none">
            <h2 className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Our Story
            </h2>
            <p>
              PitchPerfect was born out of frustration. We watched brilliant ideas fail to get funded, 
              not because they weren't good enough, but because the pitch fell flat. Too many "ums," 
              not enough eye contact, a confusing structure—small things that add up to a lost opportunity.
            </p>
            <p>
              We built PitchPerfect to change that. Using AI-powered analysis, real-time feedback, 
              and proven pitch frameworks, we help you practice until your delivery matches the 
              brilliance of your idea.
            </p>
          </section>

          {/* Values */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              What We Believe
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: Target,
                  title: "Practice Makes Perfect",
                  description: "The best presenters aren't born—they're made through deliberate practice and feedback."
                },
                {
                  icon: Users,
                  title: "Everyone Deserves a Voice",
                  description: "Great ideas can come from anywhere. We level the playing field with accessible tools."
                },
                {
                  icon: Sparkles,
                  title: "AI as a Coach, Not a Crutch",
                  description: "Our AI enhances your natural style rather than replacing your authentic voice."
                },
                {
                  icon: Heart,
                  title: "Community First",
                  description: "We're building more than a tool—we're building a community of confident presenters."
                }
              ].map((value) => (
                <div key={value.title} className="p-6 rounded-xl bg-muted/50 border border-border">
                  <value.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Team */}
          <section className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Built with ❤️</h2>
            <p className="text-muted-foreground">
              PitchPerfect is crafted by a small team passionate about public speaking, 
              AI, and helping people succeed. We're always listening—reach out anytime.
            </p>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default About;
