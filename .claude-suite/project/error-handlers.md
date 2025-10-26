# Error Handling Configuration

<error_scenarios>
  <scenario name="missing_dependencies">
    <condition>Required packages not installed or outdated</condition>
    <action>
      1. Run npm install to ensure all dependencies are current
      2. Check package.json for version mismatches
      3. Clear node_modules and reinstall if needed
      4. Verify Next.js and React versions compatibility
    </action>
    <recovery>
      - Provide specific npm install commands
      - Suggest package.json updates if needed
      - Document dependency conflicts
    </recovery>
  </scenario>

  <scenario name="database_connection_failure">
    <condition>Prisma client cannot connect to database</condition>
    <action>
      1. Verify DATABASE_URL environment variable
      2. Check database server status and credentials
      3. Run prisma generate to update client
      4. Test connection with prisma db push
    </action>
    <recovery>
      - Provide DATABASE_URL format examples
      - Suggest local database setup alternatives
      - Guide through Prisma troubleshooting steps
    </recovery>
  </scenario>

  <scenario name="authentication_errors">
    <condition>NextAuth.js configuration or OAuth issues</condition>
    <action>
      1. Verify NEXTAUTH_SECRET environment variable
      2. Check OAuth provider client IDs and secrets
      3. Confirm callback URL configurations
      4. Test authentication flows step by step
    </action>
    <recovery>
      - Guide through OAuth app setup process
      - Provide NextAuth.js debugging tips
      - Suggest fallback authentication methods
    </recovery>
  </scenario>

  <scenario name="build_failures">
    <condition>Next.js build process fails</condition>
    <action>
      1. Check TypeScript compilation errors
      2. Verify all imports are correctly resolved
      3. Review ESLint warnings and errors
      4. Check for missing environment variables
    </action>
    <recovery>
      - Parse and explain specific error messages
      - Provide TypeScript fixes for common issues
      - Suggest build configuration adjustments
    </recovery>
  </scenario>

  <scenario name="prisma_schema_errors">
    <condition>Database schema migration or generation fails</condition>
    <action>
      1. Review schema.prisma for syntax errors
      2. Check for relationship constraint violations
      3. Verify database provider configuration
      4. Run prisma validate for detailed error info
    </action>
    <recovery>
      - Provide corrected schema examples
      - Guide through manual migration steps
      - Suggest schema simplification if needed
    </recovery>
  </scenario>

  <scenario name="deployment_failures">
    <condition>Vercel or Railway deployment issues</condition>
    <action>
      1. Check build logs for specific error messages
      2. Verify environment variables in deployment platform
      3. Confirm database connection in production
      4. Test API routes and serverless functions
    </action>
    <recovery>
      - Provide platform-specific troubleshooting
      - Guide through environment variable setup
      - Suggest local production testing methods
    </recovery>
  </scenario>

  <scenario name="content_integration_errors">
    <condition>Lesson content import or parsing fails</condition>
    <action>
      1. Validate markdown file formats and frontmatter
      2. Check file path accessibility and permissions
      3. Verify content processing pipeline
      4. Test with smaller content subset first
    </action>
    <recovery>
      - Provide content format examples
      - Suggest batch processing approaches
      - Guide through manual content entry
    </recovery>
  </scenario>
</error_scenarios>

<debugging_strategies>
  <development>
    - Use Next.js dev server with detailed error reporting
    - Enable Prisma query logging for database issues
    - Leverage browser dev tools for client-side debugging
    - Implement comprehensive error logging
  </development>
  
  <production>
    - Set up error monitoring (Sentry or similar)
    - Configure structured logging for API routes
    - Implement graceful error boundaries
    - Provide user-friendly error messages
  </production>
</debugging_strategies>

<prevention_measures>
  - Regular dependency updates and security audits
  - Comprehensive TypeScript coverage
  - Database backup and migration testing
  - Staging environment for deployment testing
  - User input validation and sanitization
  - Rate limiting and security headers
</prevention_measures>