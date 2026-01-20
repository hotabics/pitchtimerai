import { Skeleton } from "@/components/ui/skeleton";

// Skeleton for PathComparisonDemo section (~400px height)
export const PathComparisonSkeleton = () => (
  <section className="py-16 md:py-24 px-4" aria-hidden="true">
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-6 w-96 mx-auto" />
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  </section>
);

// Skeleton for ComparisonSection (~500px height)
export const ComparisonSkeleton = () => (
  <section className="py-16 md:py-24 px-4 bg-muted/30" aria-hidden="true">
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <Skeleton className="h-10 w-80 mx-auto" />
        <Skeleton className="h-6 w-[28rem] mx-auto" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  </section>
);

// Skeleton for AICoachSpotlight section (~900px height)
export const AICoachSkeleton = () => (
  <section className="py-16 md:py-24 px-4" aria-hidden="true">
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <Skeleton className="h-8 w-32 mx-auto rounded-full" />
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-6 w-[32rem] mx-auto" />
      </div>
      <Skeleton className="h-[500px] rounded-2xl" />
      <div className="grid md:grid-cols-3 gap-6">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  </section>
);

// Skeleton for TechStackBanner (~300px height)
export const TechStackSkeleton = () => (
  <section className="py-12 md:py-16 px-4 bg-muted/30" aria-hidden="true">
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <Skeleton className="h-6 w-48 mx-auto" />
      </div>
      <div className="flex justify-center gap-8 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-24 rounded-lg" />
        ))}
      </div>
    </div>
  </section>
);

// Skeleton for BentoGrid section (~400px height)
export const BentoGridSkeleton = () => (
  <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-transparent to-muted/30" aria-hidden="true">
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <Skeleton className="h-10 w-56 mx-auto" />
        <Skeleton className="h-6 w-80 mx-auto" />
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl md:col-span-2" />
        <Skeleton className="h-48 rounded-xl md:col-span-2" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  </section>
);

// Combined skeleton for all lazy sections
// Heights are precisely calculated to match actual content and prevent CLS
export const LandingSectionsSkeleton = () => (
  <div style={{ minHeight: '2800px' }}>
    <PathComparisonSkeleton />
    <ComparisonSkeleton />
    <AICoachSkeleton />
    <TechStackSkeleton />
    <BentoGridSkeleton />
  </div>
);
