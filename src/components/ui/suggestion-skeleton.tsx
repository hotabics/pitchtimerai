import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export const SuggestionSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex items-start gap-3 p-3 rounded-lg border border-border"
      >
        <Skeleton className="w-4 h-4 rounded mt-0.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </motion.div>
    ))}
  </div>
);
