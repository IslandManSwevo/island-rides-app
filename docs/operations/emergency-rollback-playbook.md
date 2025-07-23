# Emergency Navigation Rollback Playbook

## Overview

This playbook provides step-by-step procedures for operations team members to execute emergency rollbacks of KeyLo navigation enhancements. These procedures can be executed without development expertise and are designed to restore original navigation functionality within 5 minutes.

## When to Execute Emergency Rollback

### Immediate Rollback Scenarios (Execute Immediately)

- **User-Facing Errors**: Navigation crashes, blank screens, or broken functionality
- **Performance Degradation**: App response time > 5 seconds or frequent timeouts
- **Critical Bug Reports**: Multiple user reports of navigation issues
- **System Alerts**: Monitoring alerts indicating navigation failures

### Escalation Scenarios (Contact Development Team First)

- **Minor UI Issues**: Cosmetic problems that don't block functionality
- **Single User Reports**: Isolated issues that may be user-specific
- **Performance Questions**: General performance concerns without clear impact

## Emergency Contact Information

### Primary Contacts
- **Development Team Lead**: [Contact Information]
- **DevOps Engineer**: [Contact Information]
- **Product Manager**: [Contact Information]

### Escalation Chain
1. **Level 1**: Operations Team Member (You)
2. **Level 2**: Senior Operations Engineer
3. **Level 3**: Development Team Lead
4. **Level 4**: Engineering Manager

## Pre-Rollback Checklist

Before executing rollback, complete these steps:

- [ ] **Verify the Issue**: Confirm the problem affects multiple users
- [ ] **Document the Problem**: Note symptoms, time started, affected features
- [ ] **Check System Status**: Verify other systems are functioning normally
- [ ] **Notify Stakeholders**: Alert relevant team members about the issue
- [ ] **Prepare Rollback Reason**: Write clear reason for audit purposes

## Rollback Procedures

### Option 1: Full Emergency Rollback (Recommended for Critical Issues)

**When to Use**: Critical navigation failures, widespread user impact, or when unsure of specific cause.

**Steps**:

1. **Open Terminal/Command Prompt**
   ```bash
   cd /path/to/IslandRidesApp
   ```

2. **Execute Full Rollback**
   ```bash
   node scripts/rollback/emergency-rollback.js \
     --environment production \
     --type full \
     --reason "Brief description of issue" \
     --validate
   ```

3. **Monitor Output**
   - Look for "ROLLBACK COMPLETED SUCCESSFULLY" message
   - Note the rollback time (should be < 5 minutes)
   - Save any error messages for escalation

4. **Verify Success**
   - Check that validation passes
   - Test navigation functionality manually
   - Monitor user reports for improvement

**Example**:
```bash
node scripts/rollback/emergency-rollback.js \
  --environment production \
  --type full \
  --reason "Navigation crashes reported by multiple users" \
  --validate
```

### Option 2: Partial Rollback (For Specific Feature Issues)

**When to Use**: Issues isolated to specific navigation features (home screen, search, etc.).

**Steps**:

1. **Execute Partial Rollback**
   ```bash
   node scripts/rollback/emergency-rollback.js \
     --environment production \
     --type partial \
     --reason "Brief description of issue" \
     --validate
   ```

2. **Monitor and Verify** (same as full rollback)

### Option 3: Specific Feature Rollback (Advanced)

**When to Use**: Issues with known specific features only.

**Available Features**:
- `ENHANCED_HOME_SCREEN` - Enhanced home screen functionality
- `SMART_ISLAND_SELECTION` - Smart island selection features
- `OPTIMIZED_NAVIGATION` - Overall navigation optimizations
- `ENHANCED_VEHICLE_DETAIL` - Enhanced vehicle detail screens
- `STREAMLINED_BOOKING` - Booking flow improvements

**Steps**:

1. **Execute Specific Rollback**
   ```bash
   node scripts/rollback/emergency-rollback.js \
     --environment production \
     --type specific \
     --flags "ENHANCED_HOME_SCREEN,SMART_ISLAND_SELECTION" \
     --reason "Home screen and island selection issues" \
     --validate
   ```

## Post-Rollback Procedures

### Immediate Actions (Within 15 minutes)

1. **Verify Rollback Success**
   - [ ] Check validation output shows "PASS"
   - [ ] Test navigation manually on different devices
   - [ ] Monitor user reports and support channels

2. **Update Stakeholders**
   - [ ] Notify development team of rollback execution
   - [ ] Update incident tracking system
   - [ ] Inform customer support team

3. **Document the Incident**
   - [ ] Record rollback time and reason
   - [ ] Save rollback logs and validation reports
   - [ ] Note any issues encountered during rollback

### Follow-up Actions (Within 1 hour)

1. **System Monitoring**
   - [ ] Monitor application performance metrics
   - [ ] Watch for any new issues or side effects
   - [ ] Check error logs for unusual patterns

2. **Communication**
   - [ ] Provide status update to management
   - [ ] Coordinate with development team on next steps
   - [ ] Prepare incident summary if required

## Troubleshooting Common Issues

### Rollback Script Fails

**Symptoms**: Script exits with error, no "ROLLBACK COMPLETED" message

**Solutions**:
1. Check file permissions: `chmod +x scripts/rollback/emergency-rollback.js`
2. Verify Node.js is installed: `node --version`
3. Check script syntax: `node scripts/rollback/emergency-rollback.js --help`
4. Contact development team if errors persist

### Validation Fails After Rollback

**Symptoms**: Rollback completes but validation shows "FAIL" or "PARTIAL"

**Solutions**:
1. Run validation manually: `node scripts/rollback/validate-rollback.js --environment production --verbose`
2. Check validation report in `logs/rollback-validation-report.json`
3. If navigation still works manually, proceed with monitoring
4. Escalate to development team with validation logs

### App Still Shows Issues After Rollback

**Symptoms**: Users still report navigation problems after successful rollback

**Solutions**:
1. Verify rollback was applied: Check `temp/emergency-rollback.json` file
2. Clear app cache/restart app servers if applicable
3. Check if issue is related to different system component
4. Escalate to development team immediately

### Rollback Takes Too Long

**Symptoms**: Rollback process exceeds 5 minutes

**Solutions**:
1. Do not interrupt the process - let it complete
2. Monitor system resources (CPU, memory, disk)
3. Document the delay for development team review
4. Consider infrastructure scaling if this becomes recurring

## Testing Rollback (Dry Run)

Before executing actual rollback, you can test the process:

```bash
node scripts/rollback/emergency-rollback.js \
  --environment staging \
  --type full \
  --reason "Testing rollback procedure" \
  --dry-run
```

This shows what would be done without actually executing the rollback.

## Recovery Procedures

### Re-enabling Features After Rollback

**Important**: Only re-enable features after development team approval and testing.

1. **Coordinate with Development Team**
   - Confirm issue has been resolved
   - Get approval for feature re-enablement
   - Plan gradual rollout if needed

2. **Monitor During Re-enablement**
   - Watch for return of original issues
   - Be prepared to rollback again if needed
   - Document any problems immediately

## Audit and Reporting

### Required Documentation

After any rollback execution, ensure these items are documented:

- [ ] **Incident Timeline**: When issue started, when rollback executed, when resolved
- [ ] **Rollback Details**: Type of rollback, features affected, execution time
- [ ] **Validation Results**: Success/failure of post-rollback validation
- [ ] **User Impact**: Estimated number of users affected, duration of impact
- [ ] **Root Cause**: Initial assessment of what caused the need for rollback

### Log Files Location

All rollback activities are logged in:
- **Rollback Logs**: `logs/rollback.log`
- **Validation Logs**: `logs/rollback-validation.log`
- **Validation Reports**: `logs/rollback-validation-report.json`
- **Rollback Data**: `temp/emergency-rollback.json`

## Quick Reference Card

### Emergency Full Rollback (Copy & Paste)
```bash
cd /path/to/IslandRidesApp
node scripts/rollback/emergency-rollback.js --environment production --type full --reason "DESCRIBE_ISSUE_HERE" --validate
```

### Validation Only
```bash
node scripts/rollback/validate-rollback.js --environment production --verbose --report
```

### Check Rollback Status
```bash
cat temp/emergency-rollback.json
cat logs/rollback-validation-report.json
```

---

**Remember**: When in doubt, execute full rollback and escalate to development team. It's better to be safe than sorry with user-facing issues.
