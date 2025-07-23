import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { SearchFilters } from '../../types';
import { 
  SavedSearch, 
  SearchAlert, 
  NotificationPreferences,
  searchNotificationService 
} from '../../services/searchNotificationService';

interface SavedSearchComponentProps {
  visible: boolean;
  onClose: () => void;
  onLoadSearch: (filters: SearchFilters) => void;
  currentFilters?: SearchFilters;
}

export const SavedSearchComponent: React.FC<SavedSearchComponentProps> = React.memo(({
  visible,
  onClose,
  onLoadSearch,
  currentFilters
}) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchAlerts, setSearchAlerts] = useState<SearchAlert[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState<'immediate' | 'daily' | 'weekly'>('daily');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'searches' | 'alerts'>('searches');
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [searches, alerts, prefs] = await Promise.all([
        searchNotificationService.getSavedSearches(),
        searchNotificationService.getSearchAlerts(),
        searchNotificationService.getNotificationPreferences()
      ]);
      
      setSavedSearches(searches);
      setSearchAlerts(alerts);
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, loadData]);

  const handleSaveCurrentSearch = useCallback(async () => {
    if (!currentFilters || !searchName.trim()) return;

    try {
      setLoading(true);
      await searchNotificationService.saveSavedSearch({
        name: searchName.trim(),
        filters: currentFilters,
        isActive: true,
        notificationEnabled,
        notificationFrequency,
        lastChecked: new Date(),
        lastNotified: null,
        matchCount: 0
      });

      setSearchName('');
      setShowSaveDialog(false);
      await loadData();
    } catch (error) {
      console.error('Failed to save search:', error);
      Alert.alert('Error', 'Failed to save search. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentFilters, searchName, notificationEnabled, notificationFrequency, loadData]);

  const handleDeleteSearch = useCallback(async (searchId: string) => {
    Alert.alert(
      'Delete Saved Search',
      'Are you sure you want to delete this saved search?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await searchNotificationService.deleteSavedSearch(searchId);
              await loadData();
            } catch (error) {
              console.error('Failed to delete search:', error);
              Alert.alert('Error', 'Failed to delete search. Please try again.');
            }
          }
        }
      ]
    );
  }, [loadData]);

  const handleToggleActive = useCallback(async (searchId: string) => {
    try {
      await searchNotificationService.toggleSearchActive(searchId);
      await loadData();
    } catch (error) {
      console.error('Failed to toggle search active state:', error);
    }
  }, [loadData]);

  const handleShareSearch = useCallback(async (searchId: string) => {
    try {
      const shareUrl = await searchNotificationService.shareSavedSearch(searchId);
      // In a real app, this would use React Native's Share API
      Alert.alert('Share Search', `Share this link: ${shareUrl}`);
    } catch (error) {
      console.error('Failed to share search:', error);
      Alert.alert('Error', 'Failed to share search. Please try again.');
    }
  }, []);

  const handleLoadSearch = useCallback((search: SavedSearch) => {
    onLoadSearch(search.filters);
    onClose();
  }, [onLoadSearch, onClose]);

  const handleMarkAlertAsRead = useCallback(async (alertId: string) => {
    try {
      await searchNotificationService.markAlertAsRead(alertId);
      await loadData();
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  }, [loadData]);

  const handleDeleteAlert = useCallback(async (alertId: string) => {
    try {
      await searchNotificationService.deleteAlert(alertId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  }, [loadData]);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    try {
      await searchNotificationService.updateNotificationPreferences(updates);
      const updatedPrefs = await searchNotificationService.getNotificationPreferences();
      setPreferences(updatedPrefs);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  }, []);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getFilterSummary = useCallback((filters: SearchFilters) => {
    const parts = [];
    if (filters.island) parts.push(filters.island);
    if (filters.vehicleTypes.length > 0) parts.push(filters.vehicleTypes.join(', '));
    if (filters.priceRange) parts.push(`$${filters.priceRange[0]}-$${filters.priceRange[1]}`);
    return parts.join(' • ');
  }, []);

  const renderSavedSearchItem = useCallback(({ item }: { item: SavedSearch }) => (
    <View style={styles.searchItem}>
      <View style={styles.searchHeader}>
        <View style={styles.searchTitleContainer}>
          <Text style={styles.searchTitle}>{item.name}</Text>
          <Text style={styles.searchSummary}>{getFilterSummary(item.filters)}</Text>
        </View>
        <View style={styles.searchActions}>
          <TouchableOpacity
            style={[styles.actionButton, item.isActive && styles.activeButton]}
            onPress={() => handleToggleActive(item.id)}
          >
            <Ionicons 
              name={item.isActive ? 'notifications' : 'notifications-off'} 
              size={16} 
              color={item.isActive ? colors.white : colors.lightGrey} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShareSearch(item.id)}
          >
            <Ionicons name="share" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteSearch(item.id)}
          >
            <Ionicons name="trash" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Matches</Text>
          <Text style={styles.statValue}>{item.matchCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Last checked</Text>
          <Text style={styles.statValue}>{formatDate(item.lastChecked)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Frequency</Text>
          <Text style={styles.statValue}>{item.notificationFrequency}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.loadButton}
        onPress={() => handleLoadSearch(item)}
      >
        <Ionicons name="search" size={16} color={colors.primary} />
        <Text style={styles.loadButtonText}>Load Search</Text>
      </TouchableOpacity>
    </View>
  ), [getFilterSummary, handleToggleActive, handleShareSearch, handleDeleteSearch, formatDate, handleLoadSearch]);

  const renderAlertItem = useCallback(({ item }: { item: SearchAlert }) => (
    <View style={[styles.alertItem, !item.isRead && styles.unreadAlert]}>
      <View style={styles.alertHeader}>
        <View style={styles.alertIcon}>
          <Ionicons 
            name={
              item.alertType === 'new_vehicle' ? 'car' :
              item.alertType === 'price_drop' ? 'trending-down' :
              item.alertType === 'availability' ? 'flash' :
              'star'
            }
            size={16}
            color={colors.primary}
          />
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertMessage}>{item.message}</Text>
          <Text style={styles.alertTime}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.alertActions}>
          {!item.isRead && (
            <TouchableOpacity
              style={styles.markReadButton}
              onPress={() => handleMarkAlertAsRead(item.id)}
            >
              <Ionicons name="checkmark" size={16} color={colors.success} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteAlertButton}
            onPress={() => handleDeleteAlert(item.id)}
          >
            <Ionicons name="close" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [formatDate, handleMarkAlertAsRead, handleDeleteAlert]);

  const renderPreferencesModal = useCallback(() => (
    <Modal
      visible={showPreferences}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.preferencesModal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Notification Preferences</Text>
          <TouchableOpacity onPress={() => setShowPreferences(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.preferencesContent}>
          {preferences && (
            <>
              <View style={styles.preferenceSection}>
                <Text style={styles.sectionTitle}>General Settings</Text>
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Enable Notifications</Text>
                  <Switch
                    value={preferences.enabled}
                    onValueChange={(value) => updatePreferences({ enabled: value })}
                  />
                </View>
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Default Frequency</Text>
                  <View style={styles.frequencyButtons}>
                    {['immediate', 'daily', 'weekly'].map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        style={[
                          styles.frequencyButton,
                          preferences.frequency === freq && styles.selectedFrequency
                        ]}
                        onPress={() => updatePreferences({ frequency: freq as any })}
                      >
                        <Text style={[
                          styles.frequencyButtonText,
                          preferences.frequency === freq && styles.selectedFrequencyText
                        ]}>
                          {freq}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.preferenceSection}>
                <Text style={styles.sectionTitle}>Quiet Hours</Text>
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Enable Quiet Hours</Text>
                  <Switch
                    value={preferences.quietHours.enabled}
                    onValueChange={(value) => updatePreferences({
                      quietHours: { ...preferences.quietHours, enabled: value }
                    })}
                  />
                </View>
                {preferences.quietHours.enabled && (
                  <View style={styles.timeSettings}>
                    <Text style={styles.timeLabel}>
                      {preferences.quietHours.start} - {preferences.quietHours.end}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.preferenceSection}>
                <Text style={styles.sectionTitle}>Alert Types</Text>
                {Object.entries(preferences.alertTypes).map(([key, value]) => (
                  <View key={key} style={styles.preferenceItem}>
                    <Text style={styles.preferenceLabel}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Text>
                    <Switch
                      value={value}
                      onValueChange={(newValue) => updatePreferences({
                        alertTypes: { ...preferences.alertTypes, [key]: newValue }
                      })}
                    />
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  ), [showPreferences, preferences, updatePreferences]);

  const renderSaveDialog = useCallback(() => (
    <Modal
      visible={showSaveDialog}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.saveDialog}>
          <Text style={styles.saveDialogTitle}>Save Current Search</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Enter search name..."
            value={searchName}
            onChangeText={setSearchName}
          />
          <View style={styles.notificationSettings}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Switch
                value={notificationEnabled}
                onValueChange={setNotificationEnabled}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Frequency</Text>
              <View style={styles.frequencySelector}>
                {(['immediate', 'daily', 'weekly'] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.freqButton,
                      notificationFrequency === freq && styles.selectedFreq
                    ]}
                    onPress={() => setNotificationFrequency(freq)}
                  >
                    <Text style={[
                      styles.freqButtonText,
                      notificationFrequency === freq && styles.selectedFreqText
                    ]}>
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.dialogActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSaveDialog(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!searchName.trim() || !currentFilters) && styles.disabledButton
              ]}
              onPress={handleSaveCurrentSearch}
              disabled={!searchName.trim() || !currentFilters || loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ), [showSaveDialog, searchName, notificationEnabled, notificationFrequency, currentFilters, loading, handleSaveCurrentSearch]);

  const unreadAlertsCount = searchAlerts.filter(a => !a.isRead).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Saved Searches</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowPreferences(true)}
            >
              <Ionicons name="settings" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'searches' && styles.activeTab]}
            onPress={() => setActiveTab('searches')}
          >
            <Text style={[styles.tabText, activeTab === 'searches' && styles.activeTabText]}>
              Searches ({savedSearches.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'alerts' && styles.activeTab]}
            onPress={() => setActiveTab('alerts')}
          >
            <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>
              Alerts ({unreadAlertsCount})
            </Text>
            {unreadAlertsCount > 0 && (
              <View style={styles.badgeContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadAlertsCount}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {activeTab === 'searches' ? (
          <View style={styles.content}>
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={styles.saveCurrentButton}
                onPress={() => setShowSaveDialog(true)}
                disabled={!currentFilters}
              >
                <Ionicons name="bookmark" size={16} color={colors.white} />
                <Text style={styles.saveCurrentButtonText}>Save Current Search</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={savedSearches}
              renderItem={renderSavedSearchItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              // Performance optimizations
              removeClippedSubviews={true}
              maxToRenderPerBatch={6}
              updateCellsBatchingPeriod={50}
              initialNumToRender={4}
              windowSize={6}
              getItemLayout={(data, index) => ({
                length: 180, // Approximate saved search item height
                offset: 180 * index,
                index,
              })}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="bookmark-outline" size={64} color={colors.lightGrey} />
                  <Text style={styles.emptyStateTitle}>No Saved Searches</Text>
                  <Text style={styles.emptyStateText}>
                    Save your current search to get notifications when new matches are found
                  </Text>
                </View>
              }
            />
          </View>
        ) : (
          <View style={styles.content}>
            <FlatList
              data={searchAlerts}
              renderItem={renderAlertItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              // Performance optimizations
              removeClippedSubviews={true}
              maxToRenderPerBatch={6}
              updateCellsBatchingPeriod={50}
              initialNumToRender={4}
              windowSize={6}
              getItemLayout={(data, index) => ({
                length: 160, // Approximate alert item height
                offset: 160 * index,
                index,
              })}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="notifications-outline" size={64} color={colors.lightGrey} />
                  <Text style={styles.emptyStateTitle}>No Alerts</Text>
                  <Text style={styles.emptyStateText}>
                    You'll see notifications here when new vehicles match your saved searches
                  </Text>
                </View>
              }
            />
          </View>
        )}

        {renderSaveDialog()}
        {renderPreferencesModal()}
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.heading2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  badgeContainer: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.sm,
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  actionBar: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  saveCurrentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  saveCurrentButtonText: {
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  searchItem: {
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  searchTitleContainer: {
    flex: 1,
  },
  searchTitle: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  searchSummary: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  searchActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.offWhite,
  },
  activeButton: {
    backgroundColor: colors.primary,
  },
  searchStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.body,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  loadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  loadButtonText: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  alertItem: {
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  alertTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  alertActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  markReadButton: {
    padding: spacing.xs,
  },
  deleteAlertButton: {
    padding: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveDialog: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  saveDialogTitle: {
    ...typography.heading3,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...typography.body,
  },
  notificationSettings: {
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  settingLabel: {
    ...typography.body,
    flex: 1,
  },
  frequencySelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  freqButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedFreq: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  freqButtonText: {
    ...typography.caption,
    color: colors.text,
  },
  selectedFreqText: {
    color: colors.white,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.offWhite,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  disabledButton: {
    backgroundColor: colors.lightGrey,
  },
  saveButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  preferencesModal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.heading3,
  },
  preferencesContent: {
    flex: 1,
    padding: spacing.lg,
  },
  preferenceSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.subheading,
    marginBottom: spacing.md,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  preferenceLabel: {
    ...typography.body,
    flex: 1,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  frequencyButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedFrequency: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  frequencyButtonText: {
    ...typography.caption,
    color: colors.text,
  },
  selectedFrequencyText: {
    color: colors.white,
  },
  timeSettings: {
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
  },
  timeLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateTitle: {
    ...typography.heading3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default SavedSearchComponent;