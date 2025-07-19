import { VehicleRecommendation, SearchFilters, Island } from '../types';
import { searchIntelligenceService, TripPurpose, RecommendationScore } from './searchIntelligenceService';
import { vehicleService } from './vehicleService';

export interface EnhancedVehicleRecommendation extends VehicleRecommendation {
  recommendationScore: number;
  recommendationReasons: string[];
  tripPurposeMatch: number;
  isPersonalized: boolean;
  isTrending: boolean;
  isCollaborativeMatch: boolean;
}

export interface RecommendationContext {
  tripPurpose: TripPurpose;
  userPreferences: any;
  searchHistory: unknown[];
  collaborativeMatches: string[];
  island: Island;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: 'weekday' | 'weekend';
}

class RecommendationEngine {
  async generateEnhancedRecommendations(
    filters: SearchFilters,
    vehicles: VehicleRecommendation[],
    context?: Partial<RecommendationContext>
  ): Promise<EnhancedVehicleRecommendation[]> {
    try {
      // Build recommendation context
      const fullContext = await this.buildRecommendationContext(filters, context);
      
      // Generate base recommendations using search intelligence
      const baseRecommendations = await searchIntelligenceService.generateRecommendations(
        filters,
        vehicles,
        fullContext.tripPurpose,
        fullContext.userPreferences
      );

      // Apply contextual boosting
      const contextualRecommendations = this.applyContextualBoosting(
        baseRecommendations,
        vehicles,
        fullContext
      );

      // Apply collaborative filtering boost
      const collaborativeRecommendations = this.applyCollaborativeFiltering(
        contextualRecommendations,
        vehicles,
        fullContext.collaborativeMatches
      );

      // Apply trending boost
      const trendingRecommendations = this.applyTrendingBoost(
        collaborativeRecommendations,
        vehicles,
        fullContext
      );

      // Convert to enhanced recommendations
      const enhancedRecommendations = this.createEnhancedRecommendations(
        trendingRecommendations,
        vehicles,
        fullContext
      );

      // Sort by final score and return
      return enhancedRecommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
    } catch (error) {
      console.error('Failed to generate enhanced recommendations:', error);
      // Fallback to basic recommendations
      return vehicles.map(vehicle => ({
        ...vehicle,
        recommendationScore: vehicle.vehicle.rating || 0,
        recommendationReasons: ['Highly rated'],
        tripPurposeMatch: 0,
        isPersonalized: false,
        isTrending: false,
        isCollaborativeMatch: false
      }));
    }
  }

  private async buildRecommendationContext(
    filters: SearchFilters,
    partialContext?: Partial<RecommendationContext>
  ): Promise<RecommendationContext> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Detect trip purpose
    const searchHistory = await searchIntelligenceService.getSearchHistory();
    const tripPurpose = await searchIntelligenceService.detectTripPurpose(filters, searchHistory);
    
    // Get user preferences
    const userPreferences = await searchIntelligenceService.getUserPreferences();
    
    // Get collaborative matches
    const collaborativeMatches = await searchIntelligenceService.generateCollaborativeRecommendations(
      filters,
      filters.island as Island
    );

    return {
      tripPurpose,
      userPreferences,
      searchHistory,
      collaborativeMatches,
      island: filters.island as Island,
      timeOfDay: this.getTimeOfDay(hour),
      dayOfWeek: dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : 'weekday',
      ...partialContext
    };
  }

  private getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  private applyContextualBoosting(
    recommendations: RecommendationScore[],
    vehicles: VehicleRecommendation[],
    context: RecommendationContext
  ): RecommendationScore[] {
    return recommendations.map(rec => {
      const vehicle = vehicles.find(v => v.vehicle.id.toString() === rec.vehicleId.toString());
      if (!vehicle) return rec;

      let boost = 0;
      const newReasons = [...rec.reasons];

      // Time-based boosting
      if (context.timeOfDay === 'morning' || context.timeOfDay === 'afternoon') {
        if (context.tripPurpose.type === 'business') {
          boost += 0.1;
          newReasons.push('Great for business hours');
        }
      }

      // Weekend vs weekday boosting
      if (context.dayOfWeek === 'weekend') {
        if (['leisure', 'family', 'adventure'].includes(context.tripPurpose.type)) {
          boost += 0.15;
          newReasons.push('Perfect for weekend activities');
        }
      } else {
        if (context.tripPurpose.type === 'business') {
          boost += 0.1;
          newReasons.push('Ideal for business travel');
        }
      }

      // Island-specific boosting
      if (context.island === 'Nassau') {
        if (['sedan', 'luxury'].includes(vehicle.vehicle.vehicleType || '')) {
          boost += 0.1;
          newReasons.push('Great for Nassau city driving');
        }
      } else if (context.island === 'Exuma') {
        if (['suv', 'jeep'].includes(vehicle.vehicle.vehicleType || '')) {
          boost += 0.15;
          newReasons.push('Perfect for Exuma adventures');
        }
      }

      // Experience level boosting
      if (!context.userPreferences.hasBookings) {
        if (vehicle.vehicle.verificationStatus === 'verified') {
          boost += 0.2;
          newReasons.push('Verified for first-time renters');
        }
      }

      return {
        ...rec,
        score: Math.min(rec.score + boost, 1.0),
        reasons: newReasons.slice(0, 3)
      };
    });
  }

  private applyCollaborativeFiltering(
    recommendations: RecommendationScore[],
    vehicles: VehicleRecommendation[],
    collaborativeMatches: string[]
  ): RecommendationScore[] {
    return recommendations.map(rec => {
      if (collaborativeMatches.includes(rec.vehicleId.toString())) {
        return {
          ...rec,
          score: Math.min(rec.score + 0.15, 1.0),
          reasons: [...rec.reasons.slice(0, 2), 'Popular with similar renters']
        };
      }
      return rec;
    });
  }

  private applyTrendingBoost(
    recommendations: RecommendationScore[],
    vehicles: VehicleRecommendation[],
    context: RecommendationContext
  ): RecommendationScore[] {
    // Simple trending logic based on recent bookings
    const recentBookingThreshold = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    return recommendations.map(rec => {
      const vehicle = vehicles.find(v => v.vehicle.id.toString() === rec.vehicleId.toString());
      if (!vehicle) return rec;

      // Check if vehicle has recent bookings (in real app, this would come from API)
      const hasRecentBookings = (vehicle.vehicle.lastBookingDate && 
        new Date(vehicle.vehicle.lastBookingDate).getTime() > recentBookingThreshold) ||
        ((vehicle.vehicle.totalBookings || 0) > 10);

      if (hasRecentBookings) {
        return {
          ...rec,
          score: Math.min(rec.score + 0.1, 1.0),
          reasons: [...rec.reasons.slice(0, 2), 'Trending choice']
        };
      }
      return rec;
    });
  }

  private createEnhancedRecommendations(
    recommendations: RecommendationScore[],
    vehicles: VehicleRecommendation[],
    context: RecommendationContext
  ): EnhancedVehicleRecommendation[] {
    return recommendations.map(rec => {
      const vehicle = vehicles.find(v => v.vehicle.id.toString() === rec.vehicleId.toString());
      if (!vehicle) {
        // Create fallback recommendation
        return {
          id: rec.vehicleId.toString(),
          vehicle: { id: rec.vehicleId } as any,
          type: 'unknown',
          island: context.island || 'Nassau',
          pricePerDay: 0,
          scoreBreakdown: {
            collaborativeFiltering: 0,
            vehiclePopularity: 0,
            vehicleRating: 0,
            hostPopularity: 0
          },
          recommendationScore: rec.score,
          recommendationReasons: rec.reasons,
          tripPurposeMatch: rec.tripPurposeMatch,
          isPersonalized: false,
          isTrending: false,
          isCollaborativeMatch: false
        };
      }

      return {
        ...vehicle,
        recommendationScore: rec.score,
        recommendationReasons: rec.reasons,
        tripPurposeMatch: rec.tripPurposeMatch,
        isPersonalized: rec.userPreferenceMatch > 0.3,
        isTrending: rec.reasons.includes('Trending choice'),
        isCollaborativeMatch: context.collaborativeMatches.includes(rec.vehicleId.toString())
      };
    });
  }

  async explainRecommendation(vehicleId: string, context: RecommendationContext): Promise<string[]> {
    const explanations: string[] = [];
    
    // Trip purpose explanation
    if (context.tripPurpose.confidence > 0.5) {
      explanations.push(
        `This vehicle matches your ${context.tripPurpose.type} trip purpose (${Math.round(context.tripPurpose.confidence * 100)}% confidence)`
      );
    }

    // Personalization explanation
    if (context.userPreferences.preferredVehicleTypes?.length > 0) {
      explanations.push('Based on your previous vehicle preferences');
    }

    // Collaborative explanation
    if (context.collaborativeMatches.includes(vehicleId)) {
      explanations.push('Popular choice among renters with similar preferences');
    }

    // Time-based explanation
    if (context.timeOfDay === 'morning' && context.tripPurpose.type === 'business') {
      explanations.push('Great for morning business travel');
    }

    return explanations.slice(0, 3);
  }

  async trackRecommendationInteraction(
    vehicleId: string,
    action: 'view' | 'click' | 'book' | 'favorite',
    context: RecommendationContext
  ): Promise<void> {
    try {
      // In a real implementation, this would send analytics data
      // For now, we'll just update user preferences if it's a booking
      if (action === 'book') {
        await searchIntelligenceService.updateUserPreferences(
          {
            vehicleTypes: [context.tripPurpose.type],
            island: context.island
          } as SearchFilters,
          true
        );
      }
    } catch (error) {
      console.error('Failed to track recommendation interaction:', error);
    }
  }

  async getRecommendationInsights(
    recommendations: EnhancedVehicleRecommendation[]
  ): Promise<{
    totalRecommendations: number;
    personalizedCount: number;
    trendingCount: number;
    collaborativeCount: number;
    averageScore: number;
    topReasons: string[];
  }> {
    const personalizedCount = recommendations.filter(r => r.isPersonalized).length;
    const trendingCount = recommendations.filter(r => r.isTrending).length;
    const collaborativeCount = recommendations.filter(r => r.isCollaborativeMatch).length;
    const averageScore = recommendations.reduce((sum, r) => sum + r.recommendationScore, 0) / recommendations.length;
    
    const allReasons = recommendations.flatMap(r => r.recommendationReasons);
    const reasonCounts = allReasons.reduce((acc: {[key: string]: number}, reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});
    
    const topReasons = Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([reason]) => reason);

    return {
      totalRecommendations: recommendations.length,
      personalizedCount,
      trendingCount,
      collaborativeCount,
      averageScore,
      topReasons
    };
  }
}

export const recommendationEngine = new RecommendationEngine();