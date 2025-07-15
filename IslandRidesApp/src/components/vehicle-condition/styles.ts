import { StyleSheet } from 'react-native';
import { colors } from '../../styles/Theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  recordCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  recordDescription: {
    fontSize: 14,
    color: colors.darkGrey,
    marginBottom: 8,
  },
  recordDetail: {
    fontSize: 14,
    color: colors.text,
  },
  recordDate: {
    fontSize: 12,
    color: colors.lightGrey,
    marginTop: 8,
    textAlign: 'right',
  },
  recordNotes: {
    fontSize: 14,
    color: colors.darkGrey,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.lightGrey,
    marginTop: 20,
  },
  severityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  severityText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay + '80',
  },
  modalContent: {
    width: '80%',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.lightGrey,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});