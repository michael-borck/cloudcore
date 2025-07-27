# CloudCore TODO List

## Future Enhancements

### Auto-publish Workflow for CMS
- [ ] Add GitHub Actions workflow to automatically run `quarto publish gh-pages` when content is added via CMS
- **Known Issue**: Quarto GitHub Actions often fail due to R dependency requirements
  - Even when not using R, Quarto workflow tries to install R
  - This is a known bug/issue with Quarto in CI environments
  - Workaround options to investigate:
    1. Use `quarto render` only (not publish) and custom gh-pages deployment
    2. Pre-install R in the workflow (adds overhead)
    3. Use Docker image with Quarto pre-configured
    4. Wait for Quarto team to fix the dependency issue

### Current Manual Process
1. Staff add content via `/admin/` interface
2. Content gets committed to `main` branch
3. Admin manually runs `quarto publish gh-pages` locally
4. Site updates on GitHub Pages

This manual step ensures quality control and avoids CI complexity.