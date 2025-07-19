const fs = require('fs');
const path = require('path');

// Files to fix based on the search results
const filesToFix = [
  'src/components/vehiclePerformance/VehicleHeader.tsx',
  'src/screens/RegistrationScreen.tsx',
  'src/components/SeatingCapacityFilter.tsx',
  'src/components/ConditionRatingFilter.tsx',
  'src/screens/ChatConversationScreen.tsx',
  'src/components/vehicle-condition/DamageReportModal.tsx',
  'src/screens/OwnerDashboardScreen/components/QuickActions.tsx',
  'src/screens/OwnerDashboardScreen/components/GoalsSection.tsx',
  'src/screens/AddExpenseModal.tsx',
  'src/navigation/AppNavigator.tsx',
  'src/components/vehiclePerformance/VehicleSummaryCards.tsx',
  'src/screens/PaymentHistoryScreen.tsx',
  'src/components/vehicle/VehicleSpecs.tsx',
  'src/screens/OwnerDashboardScreen/styles.ts',
  'src/components/vehiclePerformance/VehicleMetrics.tsx',
  'src/components/vehicle-condition/ConditionRatingSection.tsx',
  'src/components/FavoriteButton.tsx',
  'src/components/vehiclePerformance/VehicleActions.tsx',
  'src/components/MapView.web.tsx',
  'src/screens/HostStorefrontScreen.tsx',
  'src/screens/FavoritesScreen.tsx',
  'src/components/vehiclePerformance/VehicleEmptyState.tsx',
  'src/components/search/SearchRecommendationCard.tsx',
  'src/screens/LoginScreen.tsx',
  'src/components/vehicle-condition/styles.ts',
  'src/components/vehiclePerformance/VehicleSortControls.tsx',
  'src/screens/PaymentScreen.tsx',
  'src/components/VehiclePhotoUpload/PhotoCaptionModal.tsx',
  'src/components/ApiErrorBoundary.tsx',
  'src/components/vehicle-condition/DamageReportsSection.tsx',
  'src/screens/NotificationPreferencesScreen.tsx',
  'src/constants/photoTypes.ts',
  'src/screens/PublicUserProfileScreen.tsx',
  'src/screens/FleetManagementScreen.tsx',
  'src/components/Button.tsx',
  'src/components/ServiceOptionsFilter.tsx',
  'src/screens/SearchScreen.tsx',
  'src/components/VehiclePhotoUpload/PhotoGrid.tsx',
  'src/components/vehicle/VehicleReviews.tsx',
  'src/components/vehiclePerformance/VehiclePerformanceCard.tsx',
  'src/services/receiptHtmlTemplate.ts',
  'src/screens/IslandSelectionScreen.tsx',
  'src/screens/OwnerDashboardScreen/components/DashboardMetrics.tsx',
  'src/components/PhotoThumbnails.tsx',
  'src/screens/WriteReviewScreen.tsx',
  'src/components/ErrorBoundary.tsx',
  'src/components/VehicleFeatureList.tsx',
  'src/components/VehicleCardSkeleton.tsx',
  'src/components/NotificationItem.tsx',
  'src/components/ReceiptModal.tsx',
  'src/screens/ProfileScreen.tsx',
  'src/screens/MyBookingsScreen.tsx',
  'src/components/VehiclePhotoUpload/PhotoTypeModal.tsx',
  'src/components/ModernVehicleCard.tsx',
  'src/components/Input.tsx',
  'src/screens/OwnerDashboardScreen/components/RevenueChart.tsx',
  'src/components/FeaturesFilter.tsx',
  'src/screens/FinancialReportsScreen.tsx',
  'src/components/PriceRangeFilter.tsx',
  'src/components/DateFilter.tsx',
  'src/components/ModernVehicleCardDemo.tsx',
  'src/components/vehicle/VehicleHeader.tsx',
  'src/components/AppHeader.tsx',
  'src/components/VehiclePhotoUpload.tsx',
  'src/screens/HostDashboardScreen.tsx',
  'src/screens/SavedSearchesScreen.tsx',
  'src/screens/PayPalConfirmationScreen.tsx',
  'src/components/search/IntelligentFilterComponent.tsx',
  'src/screens/VehicleDetailScreen.tsx',
  'src/screens/ChatScreen.tsx',
  'src/components/ShimmerLoading.tsx',
  'src/components/VehicleCard.tsx',
  'src/components/VehiclePhotoUpload/PhotoUploadProgress.tsx',
  'src/screens/VehicleDocumentManagementScreen.tsx',
  'src/components/FleetVehicleCard.tsx',
  'src/components/search/SavedSearchComponent.tsx',
  'src/components/OptionFilter.tsx',
  'src/components/VerificationStatusFilter.tsx',
  'src/screens/BookingConfirmedScreen.tsx',
  'src/components/VehiclePhotoGallery.tsx',
  'src/screens/CheckoutScreen.tsx',
  'src/components/vehiclePerformance/VehiclePerformanceMetrics.tsx',
  'src/components/FullscreenModal.tsx',
  'src/components/ClusteredMapView.tsx',
  'src/screens/VehiclePerformanceScreen.tsx'
];

const baseDir = './IslandRidesApp';

filesToFix.forEach(filePath => {
  const fullPath = path.join(baseDir, filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace Theme.ts with theme.ts in import statements
      const updatedContent = content.replace(
        /from\s+['"]([^'"]*styles\/Theme)['"];?/g,
        "from '$1'.replace('Theme', 'theme');"
      ).replace(
        /import\s+([^'"]*)\s+from\s+['"]([^'"]*styles\/Theme)['"];?/g,
        (match, imports, path) => {
          const newPath = path.replace('Theme', 'theme');
          return `import ${imports} from '${newPath}';`;
        }
      );
      
      if (content !== updatedContent) {
        fs.writeFileSync(fullPath, updatedContent, 'utf8');
        console.log(`Fixed: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('Theme import fixes completed!');