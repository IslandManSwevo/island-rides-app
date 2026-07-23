import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, DisplayText, SectionLabel } from '../components/ui';
import { keyloApi, ApiVerificationItem } from '../services/keyloApi';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';

/**
 * Admin insurance review queue — the human check that keeps fake/absent
 * insurance out of live listings (design/02, enforced insurance). Admin-only;
 * reachable from Profile when the signed-in user has the admin role.
 */
export const AdminReviewScreen: React.FC<{ navigation: any }> = () => {
  const [queue, setQueue] = useState<ApiVerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await apiService.getToken();
      if (!token) return;
      const res = await keyloApi.adminVerifications(token);
      setQueue(res.queue);
    } catch {
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (item: ApiVerificationItem, decision: 'approve' | 'reject') => {
    setActing(item.vehicleId);
    try {
      const token = await apiService.getToken();
      if (!token) return;
      await keyloApi.adminReviewInsurance(
        item.vehicleId,
        decision,
        decision === 'reject' ? 'Please re-upload a clear, valid proof of insurance.' : undefined,
        token
      );
      notificationService.success(decision === 'approve' ? 'Approved — the car is live.' : 'Rejected — host notified.');
      setQueue((q) => q.filter((v) => v.vehicleId !== item.vehicleId));
    } catch {
      notificationService.error('Could not record that decision — try again.');
    } finally {
      setActing(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['top']}>
      <FlatList
        data={queue}
        keyExtractor={(v) => v.vehicleId}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#FF5A3C" />}
        contentContainerClassName="px-gutter pb-8"
        ListHeaderComponent={
          <View className="pb-3 pt-2">
            <DisplayText size="headline">Insurance review</DisplayText>
            <SectionLabel className="mt-3">{`${queue.length} awaiting review`}</SectionLabel>
          </View>
        }
        renderItem={({ item }) => (
          <Card className="mb-3.5 p-card-pad">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <DisplayText size="title">
                  {item.make} {item.model} {item.year}
                </DisplayText>
                <Text className="mt-0.5 font-ui text-meta text-stone dark:text-night-muted">
                  {item.hostName} · {item.hostEmail}
                </Text>
              </View>
              {item.insurance?.status === 'rejected' && <Badge label="Resubmitted" tone="gold" />}
            </View>

            {item.insurance ? (
              <Pressable
                onPress={() => Linking.openURL(item.insurance!.url).catch(() => undefined)}
                className="mt-3 flex-row items-center gap-2 rounded-field border border-sand p-3 dark:border-night-line"
              >
                <Ionicons name="document-text-outline" size={20} color="#0E7C7B" />
                <Text className="flex-1 font-ui-semibold text-meta text-teal">View insurance document</Text>
                <Ionicons name="open-outline" size={16} color="#8C8578" />
              </Pressable>
            ) : (
              <Text className="mt-3 font-ui text-meta text-danger">No document attached</Text>
            )}

            <View className="mt-3 flex-row gap-2">
              <Button
                label="Approve"
                className="flex-1 p-2.5"
                loading={acting === item.vehicleId}
                onPress={() => decide(item, 'approve')}
              />
              <Button
                label="Reject"
                variant="ghost"
                className="flex-1 p-2.5"
                disabled={acting === item.vehicleId}
                onPress={() => decide(item, 'reject')}
              />
            </View>
          </Card>
        )}
        ListEmptyComponent={
          loading ? null : (
            <Card className="items-center p-8">
              <Ionicons name="shield-checkmark-outline" size={28} color="#0E7C7B" />
              <Text className="mt-2 font-display text-title text-ink dark:text-night-text">Queue is clear</Text>
              <Text className="mt-1 text-center font-ui text-body text-stone dark:text-night-muted">
                No listings are waiting on insurance review.
              </Text>
            </Card>
          )
        }
      />
    </SafeAreaView>
  );
};

export default AdminReviewScreen;
