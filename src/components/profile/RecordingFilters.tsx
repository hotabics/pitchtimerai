// Recording Filters Component - Filter and sort the recordings grid

import { useState } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';

export type SortOption = 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc' | 'wpm-desc' | 'wpm-asc';

export interface FilterState {
  search: string;
  track: string | null;
  minScore: number;
  maxScore: number;
  sortBy: SortOption;
}

interface RecordingFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableTracks: string[];
  resultCount: number;
  totalCount: number;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'score-desc', label: 'Highest Score' },
  { value: 'score-asc', label: 'Lowest Score' },
  { value: 'wpm-desc', label: 'Fastest Pace' },
  { value: 'wpm-asc', label: 'Slowest Pace' },
];

const formatTypeName = (type: string) => {
  return type
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const RecordingFilters = ({
  filters,
  onFilterChange,
  availableTracks,
  resultCount,
  totalCount,
}: RecordingFiltersProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFilterCount = [
    filters.track !== null,
    filters.minScore > 0,
    filters.maxScore < 100,
    filters.search.length > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFilterChange({
      search: '',
      track: null,
      minScore: 0,
      maxScore: 100,
      sortBy: filters.sortBy,
    });
  };

  return (
    <div className="space-y-3">
      {/* Main filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search recordings..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Sort dropdown */}
        <Select
          value={filters.sortBy}
          onValueChange={(value: SortOption) => onFilterChange({ ...filters, sortBy: value })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter popover */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                    Clear all
                  </Button>
                )}
              </div>

              {/* Track filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Track Type</label>
                <Select
                  value={filters.track || 'all'}
                  onValueChange={(value) => onFilterChange({ ...filters, track: value === 'all' ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All tracks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tracks</SelectItem>
                    {availableTracks.map((track) => (
                      <SelectItem key={track} value={track}>
                        {formatTypeName(track)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Score range */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Score Range</label>
                  <span className="text-xs text-muted-foreground">
                    {(filters.minScore / 10).toFixed(1)} - {(filters.maxScore / 10).toFixed(1)}
                  </span>
                </div>
                <div className="pt-2">
                  <Slider
                    value={[filters.minScore, filters.maxScore]}
                    onValueChange={([min, max]) => onFilterChange({ ...filters, minScore: min, maxScore: max })}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filters & result count */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          {filters.track && (
            <Badge variant="secondary" className="gap-1">
              {formatTypeName(filters.track)}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => onFilterChange({ ...filters, track: null })}
              />
            </Badge>
          )}
          {(filters.minScore > 0 || filters.maxScore < 100) && (
            <Badge variant="secondary" className="gap-1">
              Score: {(filters.minScore / 10).toFixed(1)} - {(filters.maxScore / 10).toFixed(1)}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => onFilterChange({ ...filters, minScore: 0, maxScore: 100 })}
              />
            </Badge>
          )}
        </div>
        <span className="text-muted-foreground">
          {resultCount === totalCount ? (
            `${totalCount} recordings`
          ) : (
            `${resultCount} of ${totalCount} recordings`
          )}
        </span>
      </div>
    </div>
  );
};
