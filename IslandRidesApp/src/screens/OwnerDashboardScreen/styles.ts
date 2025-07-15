import { StyleSheet } from 'react-native';
import { colors } from '../../styles/Theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    elevation: 1,
  },
  timeframeOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  timeframeOptionActive: {
    backgroundColor: colors.primary,
  },
  timeframeOptionText: {
    color: colors.text,
    fontWeight: '600',
  },
  timeframeOptionTextActive: {
    color: colors.white,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  metricSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  chartContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  chartBarContainer: {
    width: 12,
    height: '100%',
    backgroundColor: colors.lightGrey,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
  },
  chartBarLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
  noDataText: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: 20,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataSubtext: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  goalCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: colors.sectionBackground,
    borderRadius: 6,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalType: {
    fontWeight: 'bold',
    color: colors.text,
  },
  goalProgress: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.lightGrey,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  goalTarget: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    marginTop: 8,
    color: colors.textSecondary,
  },
  createGoalButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  createGoalButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  vehicleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontWeight: 'bold',
  },
  vehicleStats: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  vehicleRank: {
    width: 40,
    alignItems: 'flex-end',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.offWhite,
    width: '30%',
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    margin: 4,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pickerOptionText: {
    color: colors.text,
  },
  pickerOptionTextSelected: {
    color: colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    color: colors.textSecondary,
  },
  createButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 4,
    marginLeft: 12,
  },
  createButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: colors.lightGrey,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalSubmitButton: {
    backgroundColor: colors.primary,
  },
  modalSubmitButtonText: {
    color: colors.white,
  },
});