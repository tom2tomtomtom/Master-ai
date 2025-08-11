/**
 * Refactor Compatibility Test
 * 
 * Tests to ensure all refactored modules maintain backward compatibility
 * and can be imported without issues.
 */

describe('Refactored Modules Compatibility', () => {
  describe('Achievement System', () => {
    it('should import from legacy achievement-system.ts', async () => {
      const { AchievementSystem, achievementSystem } = await import('../achievement-system');
      
      expect(AchievementSystem).toBeDefined();
      expect(achievementSystem).toBeDefined();
      expect(typeof achievementSystem.processUserActivity).toBe('function');
      expect(typeof achievementSystem.checkAndAwardAchievements).toBe('function');
      expect(typeof achievementSystem.getUserAchievementProgress).toBe('function');
    });

    it('should import from new achievement-system directory', async () => {
      const { AchievementSystem, achievementSystem } = await import('../achievement-system/index');
      
      expect(AchievementSystem).toBeDefined();
      expect(achievementSystem).toBeDefined();
      expect(typeof achievementSystem.processUserActivity).toBe('function');
    });

    it('should import types correctly', async () => {
      const types = await import('../achievement-system/types');
      
      expect(types.AchievementCriteria).toBeUndefined(); // Types are interfaces, not runtime values
      // But the import should not throw
    });
  });

  describe('Certification Engine', () => {
    it('should import from legacy certification-engine.ts', async () => {
      const { CertificationEngine, certificationEngine } = await import('../certification-engine');
      
      expect(CertificationEngine).toBeDefined();
      expect(certificationEngine).toBeDefined();
      expect(typeof certificationEngine.checkEligibility).toBe('function');
      expect(typeof certificationEngine.awardCertification).toBe('function');
      expect(typeof certificationEngine.verifyCertification).toBe('function');
    });

    it('should import from new certification-engine directory', async () => {
      const { CertificationEngine, certificationEngine } = await import('../certification-engine/index');
      
      expect(CertificationEngine).toBeDefined();
      expect(certificationEngine).toBeDefined();
      expect(typeof certificationEngine.checkEligibility).toBe('function');
    });
  });

  describe('Logger System', () => {
    it('should import from legacy logger.ts', async () => {
      const { appLogger, winstonLogger, PerformanceTimer, createTimer } = await import('../logger');
      
      expect(appLogger).toBeDefined();
      expect(winstonLogger).toBeDefined();
      expect(PerformanceTimer).toBeDefined();
      expect(createTimer).toBeDefined();
      
      // Test structured logging categories
      expect(appLogger.security).toBeDefined();
      expect(appLogger.performance).toBeDefined();
      expect(appLogger.userActivity).toBeDefined();
      expect(appLogger.system).toBeDefined();
      expect(appLogger.errors).toBeDefined();
      
      // Test generic logging methods
      expect(typeof appLogger.info).toBe('function');
      expect(typeof appLogger.warn).toBe('function');
      expect(typeof appLogger.logError).toBe('function');
      expect(typeof appLogger.debug).toBe('function');
      expect(typeof appLogger.trace).toBe('function');
    });

    it('should import from new logger directory', async () => {
      const { appLogger, winstonLogger } = await import('../logger/index');
      
      expect(appLogger).toBeDefined();
      expect(winstonLogger).toBeDefined();
    });

    it('should maintain utility functions', async () => {
      const { 
        generateRequestId, 
        setRequestContext, 
        getRequestContext, 
        clearRequestContext 
      } = await import('../logger');
      
      expect(typeof generateRequestId).toBe('function');
      expect(typeof setRequestContext).toBe('function');
      expect(typeof getRequestContext).toBe('function');
      expect(typeof clearRequestContext).toBe('function');
      
      // Test that they work
      const requestId = generateRequestId();
      expect(typeof requestId).toBe('string');
      expect(requestId).toMatch(/^req_/);
      
      setRequestContext(requestId, { test: true });
      const context = getRequestContext(requestId);
      expect(context).toEqual({ test: true });
      
      clearRequestContext(requestId);
      const clearedContext = getRequestContext(requestId);
      expect(clearedContext).toBeUndefined();
    });
  });

  describe('Background Jobs', () => {
    it('should import from legacy background-jobs.ts', async () => {
      const { 
        BackgroundJobSystem, 
        backgroundJobSystem, 
        runBackgroundJobs, 
        updateAllUserStats 
      } = await import('../background-jobs');
      
      expect(BackgroundJobSystem).toBeDefined();
      expect(backgroundJobSystem).toBeDefined();
      expect(typeof runBackgroundJobs).toBe('function');
      expect(typeof updateAllUserStats).toBe('function');
      
      expect(typeof backgroundJobSystem.runDailyJobs).toBe('function');
      expect(typeof backgroundJobSystem.updateUserStatistics).toBe('function');
      expect(typeof backgroundJobSystem.isJobsRunning).toBe('function');
    });

    it('should import from new background-jobs directory', async () => {
      const { BackgroundJobSystem, backgroundJobSystem } = await import('../background-jobs/index');
      
      expect(BackgroundJobSystem).toBeDefined();
      expect(backgroundJobSystem).toBeDefined();
    });
  });

  describe('Cross-module Integration', () => {
    it('should allow achievement system to use certification engine', async () => {
      // This tests that the modules can work together
      const { achievementSystem } = await import('../achievement-system');
      const { certificationEngine } = await import('../certification-engine');
      
      expect(achievementSystem).toBeDefined();
      expect(certificationEngine).toBeDefined();
      
      // These should be different instances but both functional
      expect(typeof achievementSystem.processUserActivity).toBe('function');
      expect(typeof certificationEngine.checkEligibility).toBe('function');
    });

    it('should allow logger to be used across modules', async () => {
      const { appLogger } = await import('../logger');
      
      expect(appLogger).toBeDefined();
      
      // Logger should be usable for logging (no actual logs in test)
      expect(() => {
        appLogger.info('Test message');
        appLogger.security.loginSuccess(
          { id: 'test', email: 'test@example.com', role: 'user' } as any,
          {}
        );
        appLogger.performance.apiRequest('/test', 100, 200, {});
      }).not.toThrow();
    });
  });
});