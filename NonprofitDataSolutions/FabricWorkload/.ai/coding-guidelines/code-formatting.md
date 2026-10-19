# Code Formatting Guidelines

## 📋 Overview
This document outlines code formatting standards and automatic formatting setup for consistent code style across the project.

## 🎯 Formatting Configuration

### Primary Configuration
The project uses **Prettier** for code formatting with configuration defined in:
```
Workload/.prettierrc.json
```

All code formatting should follow the rules defined in this configuration file.

## 🔧 Prettier Configuration Location

### File Path
```
FabricWorkload/Workload/.prettierrc.json
```

### Scope
- Applies to all TypeScript/JavaScript files in the `Workload/` directory
- Includes React components, contexts, utilities, and test files
- Covers `.ts`, `.tsx`, `.js`, `.jsx` file extensions

## 🚀 Automatic Formatting Setup

### VS Code Integration
Ensure your VS Code settings include:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "prettier.configPath": "./Workload/.prettierrc.json",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  }
}
```

### Manual Formatting Commands
```bash
# Format specific file
npx prettier --write "path/to/file.tsx"

# Format all files in Workload directory
npx prettier --write "Workload/**/*.{ts,tsx,js,jsx}"

# Check formatting without making changes
npx prettier --check "Workload/**/*.{ts,tsx,js,jsx}"
```

## 📝 Formatting Rules Application

### When to Format
- **Before committing** - Always format code before commit
- **During refactoring** - Apply formatting when making code changes
- **When adding new files** - Ensure new files follow formatting rules
- **During code reviews** - Check that formatting is consistent

### AI Assistant Guidelines
When modifying or creating code:

1. **Apply Prettier rules** from `Workload/.prettierrc.json`
2. **Maintain consistency** with existing formatted code
3. **Format entire files** when making significant changes
4. **Preserve existing formatting** when making small targeted changes
5. **Don't mix formatting changes** with logic changes in the same commit

## ✅ Quality Checklist

Before committing code, verify:
- [ ] Code follows Prettier configuration rules
- [ ] No formatting inconsistencies exist
- [ ] Indentation and spacing are consistent
- [ ] Line breaks and brackets follow project standards
- [ ] String quotes are consistent (single vs double)
- [ ] Semicolons are handled according to config
- [ ] Trailing commas follow configuration

## 🎯 Integration with Other Guidelines

### Import Organization
- Format imports according to Prettier rules **after** organizing them
- Ensure import organization (from `import-organization.md`) is applied **before** Prettier formatting
- Both guidelines work together for clean, consistent file headers

### Code Style
- Prettier handles mechanical formatting (spaces, brackets, quotes)
- Focus on logical code organization and readability
- Use meaningful variable names regardless of formatting rules

## 🔍 Common Formatting Issues

### Avoid Manual Formatting
❌ **Don't manually format** - Let Prettier handle it
```typescript
// Don't manually adjust spacing/brackets
const myFunction = (param: string) => {
    return {
        value: param,
        formatted: true
    };
};
```

✅ **Let Prettier format** - Trust the configuration
```typescript
// Prettier will format consistently
const myFunction = (param: string) => {
  return {
    value: param,
    formatted: true,
  };
};
```

### Configuration Conflicts
- If formatting looks wrong, check `Workload/.prettierrc.json`
- Don't override Prettier rules in individual files
- Discuss configuration changes with the team

## 📊 Formatting Workflow

1. **Write code** with focus on logic and structure
2. **Organize imports** using import organization guidelines
3. **Apply Prettier formatting** automatically or manually
4. **Review for consistency** with existing codebase
5. **Commit formatted code** following project standards

---
*Configuration: `Workload/.prettierrc.json`*
*Last updated: October 12, 2025*