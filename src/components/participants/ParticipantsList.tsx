
'use client';

import { useEffect, useState, useMemo } from 'react';
import { getAllUserProfiles } from '@/lib/firebaseService';
import type { UserProfile, ActivityStatus } from '@/types';
import ParticipantListItem from './ParticipantListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SlidersHorizontal, Search, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type SortOption = 'stepsDesc' | 'stepsAsc' | 'nameAsc' | 'nameDesc';

export default function ParticipantsList() {
  const [allParticipants, setAllParticipants] = useState<UserProfile[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activityFilter, setActivityFilter] = useState<ActivityStatus | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('stepsDesc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const profiles = await getAllUserProfiles();
        setAllParticipants(profiles);
        setFilteredParticipants(profiles); // Initialize with all
      } catch (err) {
        console.error("Failed to fetch participants:", err);
        setError("Could not load participant data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    let processedList = [...allParticipants];

    // Filter by activity status
    if (activityFilter !== 'all') {
      processedList = processedList.filter(p => p.activityStatus === activityFilter);
    }

    // Filter by search term (display name)
    if (searchTerm.trim() !== '') {
      processedList = processedList.filter(p =>
        p.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    switch (sortOption) {
      case 'stepsDesc':
        processedList.sort((a, b) => (b.currentSteps || 0) - (a.currentSteps || 0));
        break;
      case 'stepsAsc':
        processedList.sort((a, b) => (a.currentSteps || 0) - (b.currentSteps || 0));
        break;
      case 'nameAsc':
        processedList.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
        break;
      case 'nameDesc':
        processedList.sort((a, b) => (b.displayName || '').localeCompare(a.displayName || ''));
        break;
    }
    setFilteredParticipants(processedList);
  }, [allParticipants, activityFilter, sortOption, searchTerm]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="mb-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </Card>
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="shadow-md overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-grow">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                 <Skeleton className="h-6 w-1/4" />
              </div>
               <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-16 w-full" />)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-center">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label htmlFor="searchTerm" className="text-sm font-medium text-muted-foreground flex items-center">
                <Search className="mr-2 h-4 w-4" /> Name
              </label>
              <Input
                id="searchTerm"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="activityFilter" className="text-sm font-medium text-muted-foreground flex items-center">
                <SlidersHorizontal className="mr-2 h-4 w-4" /> Activity Level
              </label>
              <Select value={activityFilter} onValueChange={(value) => setActivityFilter(value as ActivityStatus | 'all')}>
                <SelectTrigger id="activityFilter">
                  <SelectValue placeholder="Filter by activity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activity Levels</SelectItem>
                  <SelectItem value="Sedentary">Sedentary</SelectItem>
                  <SelectItem value="Moderately Active">Moderately Active</SelectItem>
                  <SelectItem value="Very Active">Very Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sortOption" className="text-sm font-medium text-muted-foreground flex items-center">
                <ArrowUpDown className="mr-2 h-4 w-4" /> Sort By
              </label>
              <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <SelectTrigger id="sortOption">
                  <SelectValue placeholder="Sort participants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stepsDesc">Steps (High to Low)</SelectItem>
                  <SelectItem value="stepsAsc">Steps (Low to High)</SelectItem>
                  <SelectItem value="nameAsc">Name (A-Z)</SelectItem>
                  <SelectItem value="nameDesc">Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredParticipants.length > 0 ? (
        <div className="space-y-4">
          {filteredParticipants
            .filter(participant => !!participant && typeof participant.uid === 'string') 
            .map(participant => (
              <ParticipantListItem key={participant.uid} participant={participant} />
            ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          No participants match your current filters.
        </p>
      )}
    </div>
  );
}

