import { motion } from "framer-motion";
import { Briefcase, MapPin, Clock, Users, Zap, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface JobListing {
  id: string;
  title: string;
  department: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract";
  description: string;
}

const jobListings: JobListing[] = [
  {
    id: "1",
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote (EU/US)",
    type: "Full-time",
    description: "Build and scale our AI-powered pitch coaching platform. Work with React, TypeScript, and cutting-edge AI models.",
  },
  {
    id: "2",
    title: "AI/ML Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Develop and improve our speech analysis, body language detection, and pitch evaluation algorithms.",
  },
  {
    id: "3",
    title: "Product Designer",
    department: "Design",
    location: "Remote (EU)",
    type: "Full-time",
    description: "Shape the future of pitch practice. Design intuitive experiences that help users become confident presenters.",
  },
  {
    id: "4",
    title: "Content Marketing Lead",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    description: "Create compelling content about public speaking, pitching, and startup storytelling. Grow our community.",
  },
];

const perks = [
  { icon: MapPin, title: "Remote-First", description: "Work from anywhere in the world" },
  { icon: Clock, title: "Flexible Hours", description: "Results matter, not when you work" },
  { icon: Users, title: "Small Team", description: "High impact, low bureaucracy" },
  { icon: Zap, title: "Latest Tech", description: "AI, React, TypeScript, and more" },
  { icon: Heart, title: "Health & Wellness", description: "Comprehensive benefits package" },
  { icon: Briefcase, title: "Equity", description: "Own a piece of what you build" },
];

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-16"
        >
          {/* Hero */}
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="mb-4">We're Hiring!</Badge>
            <h1 className="text-4xl md:text-5xl font-bold">Join Our Mission</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Help millions of founders, students, and innovators deliver pitches that change the world.
            </p>
          </div>

          {/* Perks Grid */}
          <section>
            <h2 className="text-2xl font-bold text-center mb-8">Why Work With Us</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {perks.map((perk, index) => (
                <motion.div
                  key={perk.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-xl bg-muted/50 border border-border text-center"
                >
                  <perk.icon className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">{perk.title}</h3>
                  <p className="text-sm text-muted-foreground">{perk.description}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Open Positions */}
          <section>
            <h2 className="text-2xl font-bold text-center mb-8">Open Positions</h2>
            <div className="space-y-4">
              {jobListings.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {job.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {job.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                            <Badge variant="outline">{job.type}</Badge>
                          </CardDescription>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{job.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center space-y-6 py-12 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10">
            <h2 className="text-2xl font-bold">Don't See Your Role?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're always looking for talented people. Send us your resume and tell us how you'd like to contribute.
            </p>
            <Button size="lg" asChild>
              <a href="mailto:careers@pitchperfect.app">
                Get in Touch
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default Careers;
