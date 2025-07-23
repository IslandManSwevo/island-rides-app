# Emergency Rollback Quick Reference Card

## 🚨 EMERGENCY COMMANDS (Copy & Paste Ready)

### Full Emergency Rollback (Most Common)
```bash
cd /path/to/IslandRidesApp
node scripts/rollback/emergency-rollback.js --environment production --type full --reason "DESCRIBE_ISSUE_HERE" --validate
```

### Validation Check
```bash
node scripts/rollback/validate-rollback.js --environment production --verbose --report
```

### Check Current Status
```bash
cat temp/emergency-rollback.json
```

---

## 🎯 DECISION TREE

### When to Rollback?
- **YES**: Navigation crashes, blank screens, multiple user reports
- **YES**: App response time > 5 seconds consistently  
- **YES**: System monitoring alerts for navigation failures
- **NO**: Single user report, minor UI issues, cosmetic problems

### Which Type of Rollback?
- **Full**: Critical issues, widespread impact, or when unsure
- **Partial**: Issues with specific features only
- **Specific**: Known problematic feature (advanced users only)

---

## 📞 EMERGENCY CONTACTS

| Role | Contact | When to Call |
|------|---------|--------------|
| Development Lead | [Phone/Slack] | Rollback fails or validation fails |
| DevOps Engineer | [Phone/Slack] | System/infrastructure issues |
| Product Manager | [Phone/Slack] | User impact assessment needed |

---

## ✅ SUCCESS INDICATORS

After rollback, you should see:
- ✅ "ROLLBACK COMPLETED SUCCESSFULLY" message
- ✅ Rollback time < 5 minutes (usually < 30 seconds)
- ✅ Validation shows "PASS" status
- ✅ Manual navigation testing works
- ✅ User reports stop coming in

---

## ❌ FAILURE INDICATORS

If you see these, escalate immediately:
- ❌ Script exits with error messages
- ❌ "ROLLBACK FAILED" message
- ❌ Validation shows "FAIL" status
- ❌ Users still report navigation issues
- ❌ Rollback takes > 5 minutes

---

## 🔧 TROUBLESHOOTING

### Script Won't Run
```bash
# Check Node.js
node --version

# Check permissions
chmod +x scripts/rollback/emergency-rollback.js

# Get help
node scripts/rollback/emergency-rollback.js --help
```

### Validation Fails
```bash
# Run detailed validation
node scripts/rollback/validate-rollback.js --environment production --verbose

# Check validation report
cat logs/rollback-validation-report.json
```

### Still Having Issues
1. Document error messages
2. Save log files: `logs/rollback.log`, `logs/rollback-validation.log`
3. Contact development team immediately
4. Do NOT attempt multiple rollbacks

---

## 📋 POST-ROLLBACK CHECKLIST

- [ ] Verify "ROLLBACK COMPLETED SUCCESSFULLY" message
- [ ] Run validation: `--validate` flag or separate validation command
- [ ] Test navigation manually on web/mobile
- [ ] Update incident tracking system
- [ ] Notify development team
- [ ] Monitor user reports for 30 minutes
- [ ] Document incident details

---

## 🔄 ENVIRONMENT COMMANDS

### Production (Live Users)
```bash
--environment production
```

### Staging (Pre-production Testing)
```bash
--environment staging
```

### Development (Internal Testing)
```bash
--environment development
```

---

## 📊 AVAILABLE FEATURES FOR SPECIFIC ROLLBACK

| Feature Flag | Description | When to Disable |
|--------------|-------------|-----------------|
| `ENHANCED_HOME_SCREEN` | Enhanced home screen | Home screen issues |
| `SMART_ISLAND_SELECTION` | Smart island selection | Island selection problems |
| `OPTIMIZED_NAVIGATION` | Overall navigation optimization | General navigation issues |
| `ENHANCED_VEHICLE_DETAIL` | Enhanced vehicle details | Vehicle page problems |
| `STREAMLINED_BOOKING` | Booking flow improvements | Booking process issues |

### Specific Feature Rollback Example
```bash
node scripts/rollback/emergency-rollback.js \
  --environment production \
  --type specific \
  --flags "ENHANCED_HOME_SCREEN,SMART_ISLAND_SELECTION" \
  --reason "Home screen and island selection issues" \
  --validate
```

---

## 🧪 TESTING BEFORE EMERGENCY

### Dry Run (Safe Testing)
```bash
node scripts/rollback/emergency-rollback.js \
  --environment staging \
  --type full \
  --reason "Testing rollback procedure" \
  --dry-run
```

This shows what would happen without actually doing it.

---

## 📁 LOG FILE LOCATIONS

- **Rollback Logs**: `logs/rollback.log`
- **Validation Logs**: `logs/rollback-validation.log`  
- **Validation Reports**: `logs/rollback-validation-report.json`
- **Current Rollback Status**: `temp/emergency-rollback.json`

---

## ⏱️ TIMING EXPECTATIONS

- **Full Rollback**: < 30 seconds typically
- **Validation**: < 60 seconds typically
- **Total Process**: < 5 minutes maximum
- **User Impact Resolution**: Within 10 minutes of rollback

---

## 🚫 WHAT NOT TO DO

- ❌ Don't run multiple rollbacks simultaneously
- ❌ Don't modify rollback scripts during emergency
- ❌ Don't skip validation step
- ❌ Don't forget to document the incident
- ❌ Don't attempt to fix issues manually during emergency

---

## 📞 ESCALATION SCRIPT

*"Hi [Name], this is [Your Name] from Operations. We've executed an emergency rollback of the KeyLo navigation system due to [brief issue description]. The rollback [completed successfully/failed]. Current status is [describe current state]. We need [development team support/further guidance]. The incident started at [time] and rollback was executed at [time]."*

---

**Remember**: When in doubt, execute full rollback and escalate. User experience is the priority.
