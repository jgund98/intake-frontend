# Pre-Push Checklist

Before pushing your code to the Git repository, verify the following:

## ✅ Security Checks

- [ ] `.env` file is NOT being committed (check `.gitignore`)
- [ ] `.env.example` exists with placeholder values (no real credentials)
- [ ] No API keys, tokens, or passwords in code comments
- [ ] No AWS credentials in any committed files
- [ ] No SMTP passwords in any committed files

## ✅ Code Quality

- [ ] Run `npm run lint` - No linting errors
- [ ] Run `npm run format:check` - Code is properly formatted
- [ ] Run `npm run type-check` - No TypeScript errors
- [ ] All console.log statements are intentional (debug logs are OK)
- [ ] No commented-out code blocks (unless documented why)

## ✅ Functionality

- [ ] App runs without errors: `npm run dev`
- [ ] All categories load correctly:
  - [ ] `/?category=weightloss`
  - [ ] `/?category=skin%20care`
  - [ ] `/?category=fungal%20health`
  - [ ] `/?category=mens%20health`
  - [ ] `/?category=wellness`
- [ ] Products display on selection page
- [ ] Form validation works on all steps
- [ ] Payment page loads (if applicable)

## ✅ Documentation

- [ ] README.md is up to date
- [ ] New features documented in appropriate docs/ files
- [ ] Code comments added for complex logic
- [ ] API changes documented (if applicable)

## ✅ Git Best Practices

- [ ] Commit messages follow conventional commits format
  - `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- [ ] No large files (>1MB) being committed
- [ ] No `node_modules/` being committed (check `.gitignore`)
- [ ] No `.nuxt/` build files being committed (check `.gitignore`)

## ✅ Files to Verify

### Should be committed:
- ✅ `docs/INTEGRATION_GUIDE.md`
- ✅ `docs/AI_CONTEXT_SUMMARY.md`
- ✅ `docs/FUNGAL_HEALTH_SETUP.md`
- ✅ `docs/PRE_PUSH_CHECKLIST.md`
- ✅ `.env.example`
- ✅ `README.md`
- ✅ All source code files
- ✅ `package.json` and `package-lock.json`

### Should NOT be committed:
- ❌ `.env` (contains secrets)
- ❌ `node_modules/` (dependencies)
- ❌ `.nuxt/` (build output)
- ❌ `.output/` (build output)
- ❌ Any files with credentials

## Quick Commands

```bash
# Check what will be committed
git status

# Check if .env is being tracked (should return nothing)
git ls-files | grep "^\.env$"

# Run all quality checks
npm run lint && npm run format:check && npm run type-check

# Test the build
npm run build
```

## Final Verification

Before pushing, run:

```bash
# 1. Check git status
git status

# 2. Review changes
git diff

# 3. Ensure .env is not staged
git status | grep ".env"  # Should only show .env.example

# 4. Push to your branch
git push origin your-branch-name
```

## Post-Push

After pushing:

- [ ] Create a pull request (if applicable)
- [ ] Verify CI/CD pipeline passes (if configured)
- [ ] Test deployment in staging environment
- [ ] Notify team members of significant changes

---

## Common Issues

### Issue: `.env` appears in git status

**Solution:**
```bash
# Remove from staging
git reset HEAD .env

# If already committed, remove from history
git rm --cached .env
git commit -m "chore: remove .env from tracking"
```

### Issue: Large files warning

**Solution:**
```bash
# Check file sizes
find . -type f -size +1M

# Remove large files from commit
git rm --cached path/to/large/file
```

### Issue: Linting errors

**Solution:**
```bash
# Auto-fix most issues
npm run lint:fix

# Format code
npm run format
```

---

**Remember:** When in doubt, ask for a code review before pushing!
