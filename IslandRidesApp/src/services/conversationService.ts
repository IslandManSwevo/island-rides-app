import { apiService } from './apiService';
import { ChatContext, ConversationResponse, Vehicle, Booking, User } from '../types';

class ConversationService {
  private static instance: ConversationService;

  // Private constructor to prevent direct instantiation
  private constructor() {}

  // Public method to get the singleton instance
  public static getInstance(): ConversationService {
    if (!ConversationService.instance) {
      ConversationService.instance = new ConversationService();
    }
    return ConversationService.instance;
  }
  /**
   * Resolve chat context to a conversation ID and participant info
   */
  async resolveConversation(context: ChatContext): Promise<ConversationResponse> {
    console.log('🔍 Resolving conversation context:', context);

    if (context.hostId && context.vehicleId) {
      return this.findOrCreateHostConversation(context.hostId, context.vehicleId);
    } else if (context.bookingId) {
      return this.findOrCreateBookingConversation(context.bookingId);
    } else if (context.participantId) {
      return this.findOrCreateDirectConversation(context.participantId);
    } else {
      throw new Error('Invalid chat context: must provide hostId+vehicleId, bookingId, or participantId');
    }
  }

  private async createConversationByParticipant(participantId: number): Promise<number> {
    const response = await apiService.post<{ conversationId: number }>('/api/conversations', {
      participantId,
    });
    return response.conversationId;
  }

  private async fetchEntity<T>(endpoint: string, entityType: string, id: number): Promise<T> {
    const entity = await apiService.get<T>(`${endpoint}/${id}`);
    if (!entity) {
      throw new Error(`${entityType} with ID ${id} not found`);
    }
    return entity;
  }

  private async findOrCreateHostConversation(hostId: number, vehicleId: number): Promise<ConversationResponse> {
    try {
      const vehicle = await this.fetchEntity<Vehicle>('/api/vehicles', 'Vehicle', vehicleId);
      const host = await this.fetchEntity<User>('/api/users', 'Host', hostId);
      const conversationId = await this.createConversationByParticipant(hostId);

      return {
        conversationId,
        participant: { id: host.id, firstName: host.firstName, lastName: host.lastName },
        vehicle: { id: vehicle.id, make: vehicle.make, model: vehicle.model, year: vehicle.year },
      };
    } catch (error) {
      console.error('❌ Failed to resolve host conversation:', error);
      throw new Error('Failed to start conversation with host');
    }
  }

  private async findOrCreateBookingConversation(bookingId: number): Promise<ConversationResponse> {
    try {
      const booking = await this.fetchEntity<Booking>('/api/bookings', 'Booking', bookingId);
      const vehicle = await this.fetchEntity<Vehicle>('/api/vehicles', 'Vehicle', booking.vehicleId);
      if (!vehicle.ownerId) {
        throw new Error('Vehicle owner information is not available for this booking');
      }
      const host = await this.fetchEntity<User>('/api/users', 'Host', vehicle.ownerId);
      const conversationId = await this.createConversationByParticipant(host.id);

      return {
        conversationId,
        participant: { id: host.id, firstName: host.firstName, lastName: host.lastName },
        vehicle: { id: vehicle.id, make: vehicle.make, model: vehicle.model, year: vehicle.year },
      };
    } catch (error) {
      console.error('❌ Failed to resolve booking conversation:', error);
      throw new Error('Failed to start conversation for this booking');
    }
  }

  private async findOrCreateDirectConversation(participantId: number): Promise<ConversationResponse> {
    try {
      const participant = await this.fetchEntity<User>('/api/users', 'User', participantId);
      const conversationId = await this.createConversationByParticipant(participantId);

      return {
        conversationId,
        participant: { id: participant.id, firstName: participant.firstName, lastName: participant.lastName },
      };
    } catch (error) {
      console.error('❌ Failed to resolve direct conversation:', error);
      throw new Error('Failed to start conversation with user');
    }
  }

  /**
   * Get conversation title based on context
   */
  getConversationTitle(context: ChatContext, participant: { firstName: string; lastName: string }, vehicle?: { make: string; model: string; year: number }): string {
    if (context.hostId && context.vehicleId && vehicle) {
      return `Chat with ${participant.firstName} about ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    } else if (context.bookingId && vehicle) {
      return `Booking Chat - ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    } else {
      return `Chat with ${participant.firstName} ${participant.lastName}`;
    }
  }
}

export const conversationService = ConversationService.getInstance();
