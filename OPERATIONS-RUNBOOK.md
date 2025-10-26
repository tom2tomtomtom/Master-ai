# Master AI SaaS - Production Operations Runbook

This runbook provides procedures for managing the Master AI SaaS platform in production, including monitoring, troubleshooting, maintenance, and incident response.

## 🎯 Overview

### System Architecture
- **Frontend**: Next.js 15 application hosted on Vercel
- **Database**: PostgreSQL (Vercel Postgres or Railway)
- **Authentication**: NextAuth.js with OAuth providers
- **Payments**: Stripe integration
- **Monitoring**: Sentry (errors) + PostHog (analytics)
- **CI/CD**: GitHub Actions with Vercel deployment

### Key URLs
- **Production**: https://your-domain.com
- **Health Check**: https://your-domain.com/api/health
- **Admin Panel**: https://your-domain.com/admin
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Sentry Dashboard**: https://sentry.io/organizations/your-org/

## 📊 Monitoring & Alerts

### Health Check Monitoring
Monitor these endpoints every 5 minutes:

```bash
# Primary health check
curl -f https://your-domain.com/api/health

# Detailed health check
curl -f https://your-domain.com/api/health?detailed=true

# Database connectivity
curl -f https://your-domain.com/api/health -X HEAD
```

**Expected Response**: HTTP 200 with JSON health status

### Key Performance Indicators (KPIs)
- **Uptime**: > 99.9%
- **Response Time**: < 2s for pages, < 500ms for APIs
- **Error Rate**: < 0.1%
- **Database Connection Time**: < 100ms

### Alert Thresholds
Set up alerts for:
- 3 consecutive health check failures
- Response time > 5 seconds
- Error rate > 1% over 5 minutes
- Database connection failures
- Stripe webhook failures

## 🚨 Incident Response

### Severity Levels

#### P0 - Critical (Immediate Response)
- Complete application outage
- Payment processing failure
- Data breach or security incident
- Database corruption

#### P1 - High (1 hour response)
- Partial application outage
- Authentication system failure
- Major feature unavailable

#### P2 - Medium (4 hour response)
- Non-critical feature issues
- Performance degradation
- Minor UI/UX problems

#### P3 - Low (24 hour response)
- Cosmetic issues
- Documentation updates
- Enhancement requests

### Incident Response Process

1. **Assessment** (5 minutes)
   - Verify incident severity
   - Check health check status
   - Review error logs in Sentry

2. **Communication** (10 minutes)
   - Update status page if available
   - Notify stakeholders
   - Create incident channel/document

3. **Investigation** (Varies)
   - Check recent deployments
   - Review application logs
   - Verify third-party service status

4. **Resolution** (Varies)
   - Apply fixes
   - Test thoroughly
   - Monitor for stability

5. **Post-Incident** (24 hours)
   - Document root cause
   - Update runbooks
   - Implement prevention measures

## 🔧 Common Troubleshooting

### Application Won't Start
```bash
# Check Vercel deployment logs
vercel logs --app your-app-name

# Check build errors
vercel logs --app your-app-name --since 1h

# Common fixes:
# 1. Environment variable issues
# 2. Database connection problems
# 3. Build dependency issues
```

### Database Connection Issues
```bash
# Test database connectivity
npx prisma db pull

# Check connection pool
npx prisma db execute --stdin < "SELECT count(*) FROM pg_stat_activity;"

# Reset connection pool (if using Vercel Postgres)
# Contact Vercel support for pool reset
```

### High Response Times
1. Check Vercel function regions
2. Monitor database query performance
3. Review Sentry performance data
4. Check third-party service status (Stripe, auth providers)

### Authentication Problems
```bash
# Verify OAuth app settings
# Check NEXTAUTH_SECRET configuration
# Review callback URLs
# Test with different browsers/incognito mode
```

### Payment Processing Issues
1. Check Stripe dashboard for webhook status
2. Verify webhook endpoint accessibility
3. Review webhook secret configuration
4. Test payment flow in Stripe test mode

## 🔄 Deployment Procedures

### Standard Deployment
1. Create pull request with changes
2. Review automated tests and preview deployment
3. Merge to main branch
4. Monitor deployment progress
5. Verify production health checks
6. Test critical user flows

### Hotfix Deployment
1. Create hotfix branch from main
2. Make minimal necessary changes
3. Test locally
4. Create pull request
5. Emergency merge if critical
6. Monitor deployment closely

### Rollback Procedure
```bash
# Via Vercel dashboard
# 1. Go to Deployments tab
# 2. Find last known good deployment
# 3. Click "Promote to Production"

# Via CLI
vercel rollback [deployment-url]
```

### Database Migration Rollback
```bash
# Create rollback migration
npx prisma migrate dev --create-only

# Apply rollback (DANGEROUS - backup first)
npx prisma migrate reset --force
npx prisma migrate deploy
```

## 📈 Performance Optimization

### Database Performance
```sql
-- Monitor slow queries
SELECT query, mean_time, calls, total_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename = 'your_table';
```

### Application Performance
1. Monitor Core Web Vitals in Sentry
2. Use Vercel Analytics for page performance
3. Review Next.js build bundle analyzer
4. Optimize images and static assets

### CDN and Caching
- Verify static asset caching headers
- Monitor CDN hit rates
- Review cache invalidation patterns

## 🔐 Security Operations

### Security Monitoring
Monitor for:
- Unusual authentication patterns
- High rate of failed login attempts  
- Suspicious API requests
- Potential DDoS attacks

### Security Incident Response
1. **Immediate**: Block suspicious IPs if necessary
2. **Assessment**: Review access logs and user activity
3. **Containment**: Disable compromised accounts
4. **Investigation**: Analyze attack vectors
5. **Recovery**: Reset credentials, update security measures
6. **Prevention**: Update security policies and monitoring

### Regular Security Tasks
- Weekly security log review
- Monthly dependency vulnerability scan
- Quarterly security assessment
- Annual penetration testing

## 💾 Backup and Recovery

### Database Backups
- **Automated**: Daily backups via hosting provider
- **Manual**: Weekly exports for critical data
- **Retention**: 30 days automated, 1 year manual archives

```bash
# Manual database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_20241201.sql
```

### Application Backups
- Source code: Git repository with tags
- Configuration: Environment variables documented
- Certificates: Secure storage with access controls

### Recovery Testing
- Monthly restore test from automated backup
- Quarterly disaster recovery simulation
- Annual full system recovery test

## 📊 Capacity Planning

### Resource Monitoring
Track these metrics:
- Vercel function execution count and duration
- Database connection pool usage
- Memory and CPU utilization
- Storage usage trends

### Scaling Triggers
- Function timeout increases
- Database connection pool exhaustion
- Response time degradation
- Error rate increases

### Scaling Actions
1. **Database**: Upgrade plan or connection limits
2. **Vercel**: Review function configuration and regions
3. **CDN**: Optimize caching strategies  
4. **Third-party**: Review rate limits and quotas

## 🔍 Log Analysis

### Application Logs
```bash
# Vercel function logs
vercel logs --follow

# Filter by severity
vercel logs --level error

# Search for specific patterns
vercel logs | grep "payment_error"
```

### Database Logs
- Monitor slow query logs
- Review connection errors
- Track backup and maintenance operations

### Security Logs
- Authentication failures
- Suspicious request patterns
- Rate limiting activations

## 🎛️ Configuration Management

### Environment Variables
- Document all production variables
- Regular audit of unused variables
- Secure rotation of secrets
- Version control for non-sensitive configs

### Feature Flags
Monitor and maintain:
- User registration status
- Payment processing modes
- Feature rollout toggles
- Maintenance mode controls

## 📞 Emergency Contacts

### Primary On-Call
- **Technical Lead**: [contact info]
- **Platform Admin**: [contact info]

### Escalation
- **CTO/Tech Director**: [contact info]
- **Customer Support**: [contact info]

### Third-Party Support
- **Vercel Support**: support@vercel.com
- **Stripe Support**: Via dashboard
- **Database Provider**: [provider support]

## 📋 Maintenance Procedures

### Daily Tasks
- [ ] Check error rates in Sentry
- [ ] Review overnight deployment status
- [ ] Monitor key business metrics
- [ ] Verify backup completion

### Weekly Tasks
- [ ] Security log review
- [ ] Performance trend analysis
- [ ] Dependency vulnerability scan
- [ ] Capacity utilization review

### Monthly Tasks
- [ ] Full system health assessment
- [ ] Database maintenance and optimization
- [ ] Security policy review
- [ ] Disaster recovery testing

### Quarterly Tasks
- [ ] Infrastructure cost optimization
- [ ] Security architecture review
- [ ] Performance benchmarking
- [ ] Business continuity planning

## 📈 Metrics and Reporting

### Technical Metrics
- System uptime and availability
- Performance trends (response times, throughput)
- Error rates and types
- Security incident summary

### Business Metrics
- User growth and retention
- Subscription conversion rates
- Payment processing success rates
- Customer support ticket trends

### Reporting Schedule
- **Daily**: Operational dashboard review
- **Weekly**: Technical metrics summary
- **Monthly**: Business and technical report
- **Quarterly**: Strategic review and planning

## 🔄 Change Management

### Change Categories
- **Standard**: Normal deployments via CI/CD
- **Emergency**: Hotfixes for critical issues
- **Major**: Infrastructure or architecture changes

### Change Approval Process
1. **Standard**: Automatic via pull request approval
2. **Emergency**: Technical lead approval
3. **Major**: Architecture review board

### Change Documentation
- All changes tracked in Git commits
- Infrastructure changes documented
- Configuration changes logged
- Post-change verification results

---

**Last Updated**: [Current Date]
**Next Review**: [Date + 3 months]

**Note**: This runbook should be reviewed and updated regularly based on operational experience and system evolution.