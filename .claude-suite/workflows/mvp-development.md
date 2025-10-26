# MVP Development Workflow

<workflow_meta>
  <name>mvp-development</name>
  <description>Rapid MVP development workflow for solo founder</description>
  <estimated_time>45-60 minutes per feature</estimated_time>
  <priority>critical_path</priority>
</workflow_meta>

<workflow_steps>
  <step number="1">
    <command>@analyze-codebase</command>
    <condition>before_feature_work</condition>
    <purpose>Understand current state and dependencies</purpose>
  </step>
  
  <step number="2">
    <command>@plan-feature</command>
    <condition>always</condition>
    <purpose>Break down feature into manageable tasks</purpose>
  </step>
  
  <step number="3">
    <command>@create-spec</command>
    <condition>complex_features</condition>
    <purpose>Detailed specification for multi-component features</purpose>
  </step>
  
  <step number="4">
    <command>@execute-tasks</command>
    <condition>always</condition>
    <purpose>Implement the planned feature</purpose>
  </step>
  
  <step number="5">
    <command>@test-feature</command>
    <condition>always</condition>
    <purpose>Manual testing and validation</purpose>
  </step>
  
  <step number="6">
    <command>@pre-deploy-check</command>
    <condition>if_ready_for_deployment</condition>
    <purpose>Ensure production readiness</purpose>
  </step>
</workflow_steps>

<quality_gates>
  <gate name="user_experience">
    <checks>
      - [ ] Feature works on desktop and mobile
      - [ ] Loading states implemented
      - [ ] Error handling in place
      - [ ] User feedback provided
    </checks>
  </gate>
  
  <gate name="data_integrity">
    <checks>
      - [ ] Database operations are safe
      - [ ] User progress tracked correctly
      - [ ] No data loss scenarios
      - [ ] Proper validation implemented
    </checks>
  </gate>
  
  <gate name="performance">
    <checks>
      - [ ] Page loads under 3 seconds
      - [ ] Database queries optimized
      - [ ] Images properly sized
      - [ ] No memory leaks detected
    </checks>
  </gate>
</quality_gates>

<solo_founder_optimizations>
  - Focus on critical path features first
  - Use existing UI components when possible
  - Implement quick wins for user feedback
  - Document decisions for future reference
  - Prioritize user-facing over admin features
</solo_founder_optimizations>