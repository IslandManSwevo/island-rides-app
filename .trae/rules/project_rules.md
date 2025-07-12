# Island Rides Development Rules

## Project Overview
Island Rides is a vehicle rental platform for the Bahamas with React Native frontend and Node.js backend.

## Development Guidelines

### Before Writing Code
1. Check `/Docs/Implementation.md` for current tasks
2. Review existing patterns in similar files
3. Consult `/Docs/Bug_tracking.md` for known issues

### File Creation Rules
- Frontend screens: `/IslandRidesApp/src/screens/[FeatureName]/`
- Components: `/IslandRidesApp/src/components/`
- Backend services: `/backend/services/`
- Migrations: `/backend/migrations/XXX_description.sql`

### Code Patterns

#### React Native Screen
```typescript
export const ScreenName = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  return (
    <View style={styles.container}>
      {/* Implementation */}
    </View>
  );
};
```

#### API Service Call
```typescript
const response = await apiService.get('/endpoint');
const data = await apiService.post('/endpoint', payload);
```

#### Backend Endpoint
```javascript
app.get('/api/resource', authenticateToken, async (req, res) => {
  try {
    const result = await service.method(req.user.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});
```

### Testing Requirements
- Test on both iOS and Android
- Verify API endpoints work
- Check database migrations
- Handle edge cases

### Style Guide
- Use theme constants from `/src/styles/theme`
- Follow existing component patterns
- Implement responsive design
- Use TypeScript for all new code

### Error Handling
- Always implement try-catch blocks
- Show user-friendly error messages
- Log errors appropriately
- Handle network failures

### Git Commit Messages
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Testing
- chore: Maintenance