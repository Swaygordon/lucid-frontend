// src/lib/chatService.js
// Centralized chat service for all conversation and message operations

import { supabase } from './supabaseClient';

/**
 * Get or create a conversation for a booking.
 * Only works if the booking exists and user is a participant.
 */
export const getOrCreateConversation = async (bookingId, clientId, providerId) => {
  try {
    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding conversation:', findError);
    }

    if (existing) return existing;

    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({
        booking_id: bookingId,
        client_id: clientId,
        provider_id: providerId,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating conversation:', createError);
      return null;
    }

    return newConv;
  } catch (error) {
    console.error('getOrCreateConversation error:', error);
    return null;
  }
};

/**
 * Fetch all conversations for a user (as client or provider).
 * Includes the other participant's profile and last message.
 *
 * Avatar/name resolution order (for the OTHER user):
 *   1. client_profiles or provider_profiles (whichever matches their role)
 *   2. profiles (base)
 *   3. email
 *   4. 'User'
 */
export const getUserConversations = async (userId) => {
  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        booking:bookings(id, service_type, status, service_date, service_time, description)
      `)
      .or(`client_id.eq.${userId},provider_id.eq.${userId}`)
      .eq('is_archived', false)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    if (!conversations || conversations.length === 0) return [];

    // Gather other participant IDs
    const otherIds = conversations.map(c =>
      c.client_id === userId ? c.provider_id : c.client_id
    );

    // ---- Fetch base profiles ----
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, other_name, email, avatar_url, role, city, state, country')
      .in('id', otherIds);

    if (profileErr) {
      console.error('Error fetching profiles:', profileErr);
    }

    // ---- Fetch role-specific profiles ----
    const { data: providerProfiles } = await supabase
      .from('provider_profiles')
      .select('user_id, first_name, last_name, other_name, avatar_url, occupation')
      .in('user_id', otherIds);

    const { data: clientProfiles } = await supabase
      .from('client_profiles')
      .select('user_id, first_name, last_name, other_name, avatar_url, location')
      .in('user_id', otherIds);

    // ---- Merge maps ----
    // Priority: role-specific table wins for display fields
    const profileMap = {};

    (profiles || []).forEach(p => {
      profileMap[p.id] = {
        id:         p.id,
        first_name: p.first_name,
        last_name:  p.last_name,
        other_name: p.other_name,
        email:      p.email,
        avatar_url: p.avatar_url,
        role:       p.role,
        location:   [p.city, p.state, p.country].filter(Boolean).join(', ') || null,
      };
    });

    (providerProfiles || []).forEach(p => {
      profileMap[p.user_id] = {
        ...(profileMap[p.user_id] || {}),
        first_name: p.first_name || profileMap[p.user_id]?.first_name,
        last_name:  p.last_name  || profileMap[p.user_id]?.last_name,
        other_name: p.other_name || profileMap[p.user_id]?.other_name,
        avatar_url: p.avatar_url || profileMap[p.user_id]?.avatar_url,
        occupation: p.occupation,
      };
    });

    (clientProfiles || []).forEach(p => {
      profileMap[p.user_id] = {
        ...(profileMap[p.user_id] || {}),
        first_name: p.first_name || profileMap[p.user_id]?.first_name,
        last_name:  p.last_name  || profileMap[p.user_id]?.last_name,
        other_name: p.other_name || profileMap[p.user_id]?.other_name,
        avatar_url: p.avatar_url || profileMap[p.user_id]?.avatar_url,
        location:   p.location   || profileMap[p.user_id]?.location,
      };
    });

    // ---- Fetch last message + unread count ----
    const conversationIds = conversations.map(c => c.id);
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    const lastMessageMap = {};
    const unreadMap = {};
    (messages || []).forEach(m => {
      if (!lastMessageMap[m.conversation_id]) {
        lastMessageMap[m.conversation_id] = m;
      }
      if (m.receiver_id === userId && !m.is_read) {
        unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] || 0) + 1;
      }
    });

    // ---- Build enriched conversation objects ----
    return conversations.map(c => {
      const otherId = c.client_id === userId ? c.provider_id : c.client_id;
      const profile = profileMap[otherId] || {};

      // Build a display name with all fallbacks
      const fullName =
        [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() ||
        profile.other_name ||
        profile.email ||
        'User';

      return {
        ...c,
        otherUser: {
          id:         otherId,
          name:       fullName,
          firstName:  profile.first_name,
          lastName:   profile.last_name,
          avatar:     profile.avatar_url,
          occupation: profile.occupation,
          role:       profile.role,
          email:      profile.email,
          location:   profile.location,
        },
        lastMessage:  lastMessageMap[c.id] || null,
        unreadCount:  unreadMap[c.id] || 0,
      };
    });
  } catch (error) {
    console.error('getUserConversations error:', error);
    return [];
  }
};

/**
 * Get messages for a conversation.
 */
export const getConversationMessages = async (conversationId, limit = 100) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return data || [];
};

/**
 * Send a message.
 */
export const sendMessage = async ({ conversationId, senderId, receiverId, message, messageType = 'text', attachmentUrl = null }) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      message,
      message_type: messageType,
      attachment_url: attachmentUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }
  return data;
};

/**
 * Mark all messages in a conversation as read for a user.
 */
export const markConversationRead = async (conversationId, userId) => {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('receiver_id', userId)
    .eq('is_read', false);

  if (error) console.error('Error marking conversation read:', error);
};

/**
 * Get total unread message count for a user (for navbar badge).
 */
export const getUnreadMessageCount = async (userId) => {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
  return count || 0;
};

/**
 * Subscribe to new messages for a user in real-time.
 * Returns an unsubscribe function.
 */
export const subscribeToMessages = (userId, onNewMessage) => {
  const channel = supabase
    .channel(`messages:${userId}:${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => {
        onNewMessage(payload.new);
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`[realtime] messages channel status: ${status}`);
      }
    });

  return () => supabase.removeChannel(channel);
};

/**
 * Check if a user can chat about a booking.
 */
export const canChatForBooking = async (bookingId, userId) => {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, client_id, provider_id, status')
    .eq('id', bookingId)
    .single();

  if (error || !booking) return { allowed: false, reason: 'Booking not found' };

  const isClient = booking.client_id === userId;
  const isProvider = booking.provider_id === userId;

  if (!isClient && !isProvider) {
    return { allowed: false, reason: 'You are not part of this booking' };
  }

  const allowedStatuses = ['accepted', 'in_progress', 'completed'];
  if (!allowedStatuses.includes(booking.status)) {
    return { allowed: false, reason: 'Chat becomes available once the booking is accepted' };
  }

  const conversation = await getOrCreateConversation(
    bookingId,
    booking.client_id,
    booking.provider_id
  );

  return { allowed: true, conversation, booking };
};