import AsyncStorage from '@react-native-async-storage/async-storage';
import { VehicleRecommendation, Island, SearchFilters } from '../types';

export interface MapInteraction {
  id: string;
  type: 'vehicle_click' | 'cluster_click' | 'map_drag' | 'zoom_in' | 'zoom_out' | 'filter_change';
  timestamp: Date;
  vehicleId?: string;
  clusterId?: string;
  island: Island;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  zoomLevel?: number;
  filters?: SearchFilters;
  sessionId: string;
}

export interface MapSession {
  id: string;
  island: Island;
  startTime: Date;
  endTime?: Date;
  totalInteractions: number;
  vehiclesViewed: string[];
  searchFilters?: any;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface MapAnalytics {
  popularVehicles: Array<{
    vehicleId: string;
    clickCount: number;
    conversionRate: number;
  }>;
  hotspots: Array<{
    latitude: number;
    longitude: number;
    interactionCount: number;
    radius: number;
  }>;
  clusteringMetrics: {
    averageClusterSize: number;
    totalClusters: number;
    clusterClickthrough: number;
  };
  userBehavior: {
    averageSessionDuration: number;
    averageVehiclesViewed: number;
    mostUsedZoomLevel: number;
    preferredIsland: Island;
  };
}

class MapAnalyticsService {
  private readonly STORAGE_KEYS = {
    INTERACTIONS: 'mapInteractions',
    SESSIONS: 'mapSessions',
    CURRENT_SESSION: 'currentMapSession'
  };

  private currentSessionId: string | null = null;

  async startSession(island: Island, filters?: SearchFilters, userLocation?: { latitude: number; longitude: number }): Promise<string> {
    try {
      const sessionId = this.generateId();
      const session: MapSession = {
        id: sessionId,
        island,
        startTime: new Date(),
        totalInteractions: 0,
        vehiclesViewed: [],
        searchFilters: filters,
        userLocation
      };

      await AsyncStorage.setItem(this.STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
      this.currentSessionId = sessionId;

      return sessionId;
    } catch (error) {
      console.error('Failed to start map session:', error);
      return this.generateId();
    }
  }

  async endSession(): Promise<void> {
    try {
      const currentSessionData = await AsyncStorage.getItem(this.STORAGE_KEYS.CURRENT_SESSION);
      if (!currentSessionData) return;

      const session: MapSession = JSON.parse(currentSessionData);
      session.endTime = new Date();

      // Save to sessions history
      const existingSessions = await this.getSessions();
      const updatedSessions = [...existingSessions, session];
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.SESSIONS, JSON.stringify(updatedSessions));
      await AsyncStorage.removeItem(this.STORAGE_KEYS.CURRENT_SESSION);
      
      this.currentSessionId = null;
    } catch (error) {
      console.error('Failed to end map session:', error);
    }
  }

  async trackInteraction(interaction: Omit<MapInteraction, 'id' | 'timestamp' | 'sessionId'>): Promise<void> {
    try {
      const sessionId = this.currentSessionId || await this.getCurrentSessionId();
      
      const fullInteraction: MapInteraction = {
        ...interaction,
        id: this.generateId(),
        timestamp: new Date(),
        sessionId
      };

      // Save interaction
      const existingInteractions = await this.getInteractions();
      const updatedInteractions = [...existingInteractions, fullInteraction];
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.INTERACTIONS, JSON.stringify(updatedInteractions));

      // Update current session
      await this.updateCurrentSession(fullInteraction);
    } catch (error) {
      console.error('Failed to track map interaction:', error);
    }
  }

  async trackVehicleClick(vehicleId: string, vehicle: VehicleRecommendation): Promise<void> {
    await this.trackInteraction({
      type: 'vehicle_click',
      vehicleId,
      island: (vehicle.vehicle.island as Island) || 'Nassau',
      coordinates: {
        latitude: vehicle.vehicle.latitude || 0,
        longitude: vehicle.vehicle.longitude || 0
      }
    });
  }

  async trackClusterClick(clusterId: string, vehicles: VehicleRecommendation[], island: Island): Promise<void> {
    const centerLat = vehicles.reduce((sum, v) => sum + (v.vehicle.latitude || 0), 0) / vehicles.length;
    const centerLng = vehicles.reduce((sum, v) => sum + (v.vehicle.longitude || 0), 0) / vehicles.length;

    await this.trackInteraction({
      type: 'cluster_click',
      clusterId,
      island,
      coordinates: {
        latitude: centerLat,
        longitude: centerLng
      }
    });
  }

  async trackMapDrag(newCoordinates: { latitude: number; longitude: number }, island: Island): Promise<void> {
    await this.trackInteraction({
      type: 'map_drag',
      island,
      coordinates: newCoordinates
    });
  }

  async trackZoomChange(zoomLevel: number, island: Island, coordinates: { latitude: number; longitude: number }): Promise<void> {
    await this.trackInteraction({
      type: zoomLevel > 10 ? 'zoom_in' : 'zoom_out',
      island,
      coordinates,
      zoomLevel
    });
  }

  async trackFilterChange(filters: any, island: Island): Promise<void> {
    await this.trackInteraction({
      type: 'filter_change',
      island,
      filters
    });
  }

  async getAnalytics(island?: Island, timeRange?: { start: Date; end: Date }): Promise<MapAnalytics> {
    try {
      const [interactions, sessions] = await Promise.all([
        this.getInteractions(),
        this.getSessions()
      ]);

      // Filter by island and time range if provided
      const filteredInteractions = interactions.filter(interaction => {
        const matchesIsland = !island || interaction.island === island;
        const matchesTime = !timeRange || (
          interaction.timestamp >= timeRange.start && 
          interaction.timestamp <= timeRange.end
        );
        return matchesIsland && matchesTime;
      });

      const filteredSessions = sessions.filter(session => {
        const matchesIsland = !island || session.island === island;
        const matchesTime = !timeRange || (
          session.startTime >= timeRange.start && 
          (session.endTime ? session.endTime <= timeRange.end : true)
        );
        return matchesIsland && matchesTime;
      });

      return {
        popularVehicles: this.calculatePopularVehicles(filteredInteractions),
        hotspots: this.calculateHotspots(filteredInteractions),
        clusteringMetrics: this.calculateClusteringMetrics(filteredInteractions),
        userBehavior: this.calculateUserBehavior(filteredSessions, filteredInteractions)
      };
    } catch (error) {
      console.error('Failed to get map analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  private async getCurrentSessionId(): Promise<string> {
    try {
      const currentSessionData = await AsyncStorage.getItem(this.STORAGE_KEYS.CURRENT_SESSION);
      if (currentSessionData) {
        const session = JSON.parse(currentSessionData);
        return session.id;
      }
    } catch (error) {
      console.error('Failed to get current session ID:', error);
    }
    return this.generateId();
  }

  private async updateCurrentSession(interaction: MapInteraction): Promise<void> {
    try {
      const currentSessionData = await AsyncStorage.getItem(this.STORAGE_KEYS.CURRENT_SESSION);
      if (!currentSessionData) return;

      const session: MapSession = JSON.parse(currentSessionData);
      session.totalInteractions++;

      if (interaction.vehicleId && !session.vehiclesViewed.includes(interaction.vehicleId)) {
        session.vehiclesViewed.push(interaction.vehicleId);
      }

      await AsyncStorage.setItem(this.STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to update current session:', error);
    }
  }

  private async getInteractions(): Promise<MapInteraction[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.INTERACTIONS);
      if (!data) return [];
      
      return JSON.parse(data).map((interaction: any) => ({
        ...interaction,
        timestamp: new Date(interaction.timestamp)
      }));
    } catch (error) {
      console.error('Failed to get interactions:', error);
      return [];
    }
  }

  private async getSessions(): Promise<MapSession[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.SESSIONS);
      if (!data) return [];
      
      return JSON.parse(data).map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined
      }));
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  }

  private calculatePopularVehicles(interactions: MapInteraction[]): MapAnalytics['popularVehicles'] {
    const vehicleClicks = interactions.filter(i => i.type === 'vehicle_click' && i.vehicleId);
    const vehicleStats: { [key: string]: { clicks: number; sessions: Set<string> } } = {};

    vehicleClicks.forEach(interaction => {
      const vehicleId = interaction.vehicleId!;
      if (!vehicleStats[vehicleId]) {
        vehicleStats[vehicleId] = { clicks: 0, sessions: new Set() };
      }
      vehicleStats[vehicleId].clicks++;
      vehicleStats[vehicleId].sessions.add(interaction.sessionId);
    });

    return Object.entries(vehicleStats)
      .map(([vehicleId, stats]) => ({
        vehicleId,
        clickCount: stats.clicks,
        conversionRate: stats.sessions.size / stats.clicks // Simplified conversion rate
      }))
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 10);
  }

  private calculateHotspots(interactions: MapInteraction[]): MapAnalytics['hotspots'] {
    const coordinateInteractions = interactions.filter(i => i.coordinates);
    const gridSize = 0.01; // Roughly 1km grid
    const grid: { [key: string]: { count: number; lat: number; lng: number } } = {};

    coordinateInteractions.forEach(interaction => {
      const lat = Math.round(interaction.coordinates!.latitude / gridSize) * gridSize;
      const lng = Math.round(interaction.coordinates!.longitude / gridSize) * gridSize;
      const key = `${lat},${lng}`;

      if (!grid[key]) {
        grid[key] = { count: 0, lat, lng };
      }
      grid[key].count++;
    });

    return Object.values(grid)
      .filter(cell => cell.count > 1) // Only hotspots with multiple interactions
      .map(cell => ({
        latitude: cell.lat,
        longitude: cell.lng,
        interactionCount: cell.count,
        radius: Math.min(cell.count * 50, 500) // Scale radius based on interaction count
      }))
      .sort((a, b) => b.interactionCount - a.interactionCount)
      .slice(0, 20);
  }

  private calculateClusteringMetrics(interactions: MapInteraction[]): MapAnalytics['clusteringMetrics'] {
    const clusterClicks = interactions.filter(i => i.type === 'cluster_click');
    const totalClusters = new Set(clusterClicks.map(i => i.clusterId)).size;
    const clusterClickthrough = clusterClicks.length;

    return {
      averageClusterSize: totalClusters > 0 ? clusterClickthrough / totalClusters : 0,
      totalClusters,
      clusterClickthrough
    };
  }

  private calculateUserBehavior(sessions: MapSession[], interactions: MapInteraction[]): MapAnalytics['userBehavior'] {
    const completedSessions = sessions.filter(s => s.endTime);
    const avgSessionDuration = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + (s.endTime!.getTime() - s.startTime.getTime()), 0) / completedSessions.length
      : 0;

    const avgVehiclesViewed = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.vehiclesViewed.length, 0) / sessions.length
      : 0;

    const zoomInteractions = interactions.filter(i => i.zoomLevel);
    const avgZoomLevel = zoomInteractions.length > 0
      ? zoomInteractions.reduce((sum, i) => sum + i.zoomLevel!, 0) / zoomInteractions.length
      : 10;

    const islandCounts = sessions.reduce((counts: { [key: string]: number }, session) => {
      counts[session.island] = (counts[session.island] || 0) + 1;
      return counts;
    }, {});

    const preferredIsland = Object.entries(islandCounts).reduce((max, [island, count]) => 
      count > max.count ? { island: island as Island, count } : max, 
      { island: 'Nassau' as Island, count: 0 }
    ).island;

    return {
      averageSessionDuration: avgSessionDuration / 1000 / 60, // Convert to minutes
      averageVehiclesViewed: avgVehiclesViewed,
      mostUsedZoomLevel: avgZoomLevel,
      preferredIsland
    };
  }

  private getEmptyAnalytics(): MapAnalytics {
    return {
      popularVehicles: [],
      hotspots: [],
      clusteringMetrics: {
        averageClusterSize: 0,
        totalClusters: 0,
        clusterClickthrough: 0
      },
      userBehavior: {
        averageSessionDuration: 0,
        averageVehiclesViewed: 0,
        mostUsedZoomLevel: 10,
        preferredIsland: 'Nassau'
      }
    };
  }

  async clearAnalytics(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.STORAGE_KEYS.INTERACTIONS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.SESSIONS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.CURRENT_SESSION)
      ]);
      this.currentSessionId = null;
    } catch (error) {
      console.error('Failed to clear map analytics:', error);
    }
  }

  async getSessionSummary(): Promise<{
    totalSessions: number;
    totalInteractions: number;
    averageSessionDuration: number;
    topIslands: Array<{ island: Island; count: number }>;
  }> {
    try {
      const [sessions, interactions] = await Promise.all([
        this.getSessions(),
        this.getInteractions()
      ]);

      const completedSessions = sessions.filter(s => s.endTime);
      const avgDuration = completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.endTime!.getTime() - s.startTime.getTime()), 0) / completedSessions.length / 1000 / 60
        : 0;

      const islandCounts = sessions.reduce((counts: { [key: string]: number }, session) => {
        counts[session.island] = (counts[session.island] || 0) + 1;
        return counts;
      }, {});

      const topIslands = Object.entries(islandCounts)
        .map(([island, count]) => ({ island: island as Island, count }))
        .sort((a, b) => b.count - a.count);

      return {
        totalSessions: sessions.length,
        totalInteractions: interactions.length,
        averageSessionDuration: avgDuration,
        topIslands
      };
    } catch (error) {
      console.error('Failed to get session summary:', error);
      return {
        totalSessions: 0,
        totalInteractions: 0,
        averageSessionDuration: 0,
        topIslands: []
      };
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const mapAnalyticsService = new MapAnalyticsService();