import { apiService } from './apiService';
import { ChatContext, ConversationResponse, Vehicle, Booking, User } from '../types';

class ConversationService {
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

  /**
   * Handle host + vehicle context (potential renter messaging host about a car)
   */
  private async findOrCreateHostConversation(hostId: number, vehicleId: number): Promise<ConversationResponse> {
    try {
      console.log(`🏠 Finding/creating host conversation: hostId=${hostId}, vehicleId=${vehicleId}`);

      // Optimized: Get specific vehicle instead of all vehicles
      const vehicle = await apiService.get<Vehicle>(`/api/vehicles/${vehicleId}`);
      
      if (!vehicle) {
        throw new Error(`Vehicle with ID ${vehicleId} not found`);
      }

      // Optimized: Get specific host instead of all users
      const host = await apiService.get<User>(`/api/users/${hostId}`);
      
      if (!host) {
        throw new Error(`Host with ID ${hostId} not found`);
      }

      // Create or find conversation with the host
      const conversationResponse = await apiService.post<{ conversationId: number }>('/api/conversations', {
        participantId: hostId
      });

      return {
        conversationId: conversationResponse.conversationId,
        participant: {
          id: host.id,
          firstName: host.firstName,
          lastName: host.lastName
        },
        vehicle: {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year
        }
      };

    } catch (error) {
      console.error('❌ Failed to resolve host conversation:', error);
      throw new Error('Failed to start conversation with host');
    }
  }

  /**
   * Handle booking context (active rental communication)
   */
  private async findOrCreateBookingConversation(bookingId: number): Promise<ConversationResponse> {
    try {
      console.log(`📋 Finding/creating booking conversation: bookingId=${bookingId}`);

      // Optimized: Get specific booking instead of all bookings
      const booking = await apiService.get<Booking>(`/api/bookings/${bookingId}`);
      
      if (!booking) {
        throw new Error(`Booking with ID ${bookingId} not found`);
      }

      // Optimized: Get specific vehicle instead of all vehicles
      const vehicle = await apiService.get<Vehicle>(`/api/vehicles/${booking.vehicleId}`);

      // Add null check for vehicle before accessing ownerId
      if (!vehicle) {
        throw new Error(`Vehicle with ID ${booking.vehicleId} not found for this booking`);
      }

      // Check if vehicle has ownerId property
      if (!vehicle.ownerId) {
        throw new Error('Vehicle owner information is not available for this booking');
      }

      // Optimized: Get specific host instead of all users
      const host = await apiService.get<User>(`/api/users/${vehicle.ownerId}`);
      
      if (!host) {
        throw new Error('Host not found for this booking');
      }

      // Create or find conversation with the host
      const conversationResponse = await apiService.post<{ conversationId: number }>('/api/conversations', {
        participantId: host.id
      });

      return {
        conversationId: conversationResponse.conversationId,
        participant: {
          id: host.id,
          firstName: host.firstName,
          lastName: host.lastName
        },
        vehicle: {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year
        }
      };

    } catch (error) {
      console.error('❌ Failed to resolve booking conversation:', error);
      throw new Error('Failed to start conversation for this booking');
    }
  }

  /**
   * Handle direct participant context (general user-to-user messaging)
   */
  private async findOrCreateDirectConversation(participantId: number): Promise<ConversationResponse> {
    try {
      console.log(`👤 Finding/creating direct conversation: participantId=${participantId}`);

      // Optimized: Get specific user instead of all users
      const participant = await apiService.get<User>(`/api/users/${participantId}`);
      
      if (!participant) {
        throw new Error(`User with ID ${participantId} not found`);
      }

      // Create or find conversation with the participant
      const conversationResponse = await apiService.post<{ conversationId: number }>('/api/conversations', {
        participantId: participantId
      });

      return {
        conversationId: conversationResponse.conversationId,
        participant: {
          id: participant.id,
          firstName: participant.firstName,
          lastName: participant.lastName
        }
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

export default new ConversationService();
