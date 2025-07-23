# Documentation Cleanup & Reorganization Plan

## Current Issues Identified

### 1. **Naming Inconsistencies**
- Documents reference both "KeyLo" and "Island Rides"
- App is actually "KeyLo" but some docs still reference "Island Rides"
- Need consistent "KeyLo" branding throughout all documentation

### 2. **Redundant Architecture Documents**
- `architecture.md` - Brownfield enhancement architecture (outdated)
- `fullstack-architecture.md` - Incomplete template document
- `frontend-architecture.md` - Frontend-specific architecture
- `ui-architecture.md` - UI component architecture
- **Action**: Consolidate into single, current architecture document

### 3. **Outdated Feature Documentation**
- `prd.md` - References features not yet implemented
- Documents mention "KeyLo" branding transition
- Authentication docs are more current than main PRD
- **Action**: Update to reflect current implemented features

### 4. **Template/Incomplete Documents**
- `fullstack-architecture.md` - Contains template placeholders
- Some docs have workflow instructions rather than content
- **Action**: Complete or remove incomplete documents

### 5. **Misaligned Technical Specs**
- Some docs reference Firebase Auth, others mention different auth systems
- Database references inconsistent (SQLite vs PostgreSQL)
- **Action**: Align with actual implementation

## Cleanup Actions

### Phase 1: Remove/Archive Outdated Documents
- [ ] Archive old architecture documents that conflict with current state
- [ ] Remove incomplete template documents
- [ ] Clean up redundant troubleshooting guides

### Phase 2: Update Core Documents
- [ ] Update `README.md` with current setup instructions
- [ ] Revise `prd.md` to reflect actual implemented features
- [ ] Create single, authoritative architecture document
- [ ] Update development setup guide

### Phase 3: Create Missing Documentation
- [ ] Current feature status document
- [ ] API documentation reflecting actual endpoints
- [ ] Deployment guide for current infrastructure
- [ ] User guide for implemented features

### Phase 4: Reorganize Structure
- [ ] Group related documents into subdirectories
- [ ] Create clear documentation index
- [ ] Establish documentation maintenance guidelines

## Recommended Final Structure

```
docs/
├── README.md                          # Documentation index
├── setup/
│   ├── development-setup.md           # Updated setup guide
│   ├── deployment.md                  # Deployment instructions
│   └── troubleshooting.md             # Common issues
├── architecture/
│   ├── system-architecture.md         # Single source of truth
│   ├── api-documentation.md           # Current API endpoints
│   └── database-schema.md             # Current database structure
├── features/
│   ├── authentication.md              # Current auth implementation
│   ├── vehicle-management.md          # Vehicle features
│   ├── booking-system.md              # Booking workflow
│   └── payment-integration.md         # Payment systems
├── user-guides/
│   ├── user-manual.md                 # End user guide
│   └── admin-guide.md                 # Admin/host guide
└── archive/
    └── legacy-documents/               # Outdated docs for reference
```

## Implementation Priority

1. **High Priority** - Fix naming inconsistencies and remove confusing documents
2. **Medium Priority** - Update core technical documentation
3. **Low Priority** - Create comprehensive user guides and advanced documentation

## Success Criteria

- [ ] All documents use consistent "Island Rides" branding
- [ ] Technical documentation matches actual implementation
- [ ] No conflicting or contradictory information
- [ ] Clear documentation hierarchy and navigation
- [ ] Up-to-date setup and deployment instructions