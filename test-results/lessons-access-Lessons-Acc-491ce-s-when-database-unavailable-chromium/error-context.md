# Page snapshot

```yaml
- alert
- link "Master-AI":
  - /url: /
  - img
  - text: Master-AI
- heading "Welcome back" [level=1]
- paragraph: Sign in to continue your AI learning journey
- heading "Sign In" [level=3]
- paragraph: Enter your credentials to access your account
- button "Continue with Google":
  - img
  - text: Continue with Google
- text: Or continue with Email
- textbox "Email"
- text: Password
- textbox "Password"
- button:
  - img
- checkbox "Remember me"
- text: Remember me
- link "Forgot password?":
  - /url: /auth/forgot-password
- button "Sign In"
- paragraph:
  - text: Don't have an account?
  - link "Sign up for free":
    - /url: /auth/signup
- paragraph:
  - text: By signing in, you agree to our
  - link "Terms of Service":
    - /url: /terms
  - text: and
  - link "Privacy Policy":
    - /url: /privacy
```