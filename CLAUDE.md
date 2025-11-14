# lotto

**SPEC-First TDD Development with Alfred SuperAgent**

> **Version**: 0.25.7 | **Language**: English | **Mode**: Claude Code v4.0+

---

## 🚀 Quick Start

### Core Workflow

```bash
# 1. Create SPEC (requirements in EARS format)
/alfred:1-plan "feature description"

# 2. Implement with TDD (tests → code → refactor)
/alfred:2-run SPEC-001

# 3. Auto-sync documentation
/alfred:3-sync auto SPEC-001
```

### What is SPEC-First?

**SPEC-First**: Define clear requirements BEFORE coding using **EARS format**

```
Traditional:  Requirements (vague) → Code → Tests → Bugs
SPEC-First:   SPEC (clear) → Tests (Red) → Code (Green) → Docs (auto)
```

**Benefits**:
- 80% fewer bugs (clear specs prevent miscommunication)
- 50% faster (no rework, parallel execution)
- 100% team alignment (unambiguous requirements)
- Zero documentation work (auto-generated)

---

## 🛡️ TRUST 5 Quality Principles

Every feature automatically validates against 5 principles:

| Principle | Meaning | Check |
|-----------|---------|-------|
| **T**est-first | No code without tests | Tests before implementation |
| **R**eadable | Clear, maintainable code | mypy, ruff, pylint pass |
| **U**nified | Consistent patterns & style | Follows .moai conventions |
| **S**ecured | Security-first approach | OWASP checks, no vulnerabilities |
| **T**rackable | Full requirements traceability | SPEC → Code → Tests → Docs |

Alfred enforces TRUST 5 automatically:
```bash
/alfred:2-run SPEC-001

✅ Test-first: 100% coverage
✅ Readable: Code quality 9.5/10
✅ Unified: Follows conventions
✅ Secured: No vulnerabilities
✅ Trackable: Linked to SPEC-001

→ Feature production-ready
```

---

## 🎩 Alfred - 5-Phase Intelligent Execution

Alfred automatically breaks down complex work:

```
User Request
    ↓
Phase 1: Intent Analysis (Ask clarifying questions if needed)
Phase 2: Complexity Assessment (Plan needed? Or direct implementation?)
Phase 3: Strategic Planning (If complex, create execution plan)
Phase 4: User Confirmation (Approve plan before execution)
Phase 5: Intelligent Execution (Optimal agent delegation)
    ↓
Result
```

### When Plan is Triggered

Use Plan mode (Phase 3) if:
- Complexity is HIGH
- Multiple domains involved (≥3)
- Time estimate ≥30 minutes
- User explicitly requests it

### Agent Priority

1. **MoAI-ADK Agents** (Primary):
   - spec-builder, tdd-implementer, backend-expert, frontend-expert
   - database-expert, security-expert, docs-manager, etc.

2. **MoAI-ADK Skills** (Implementation):
   - moai-lang-python, moai-lang-typescript
   - moai-domain-backend, moai-domain-frontend
   - moai-essentials-debug, moai-essentials-perf

3. **Claude Code Native Agents** (Fallback):
   - Explore, Plan, debug-helper

---

## 🎭 5 Personas

Switch interaction style based on your needs:

| Persona | Best For | Command |
|---------|----------|---------|
| 🎩 **Alfred** | Workflows, structured guidance | `/alfred:0-project` |
| 🧙 **Yoda** | Learning principles deeply | "Yoda, explain [topic]" |
| 🤖 **R2-D2** | Production issues, quick fixes | "R2-D2, [urgent issue]" |
| 🤖 **R2-D2 Partner** | Pair programming, code reviews | "Let's pair on [task]" |
| 🧑‍🏫 **Keating** | Skill mastery, personalized learning | "Keating, teach me [skill]" |

---

## 📐 EARS Format (Requirements Specification)

Use these 5 patterns in SPECs:

```
UBIQUITOUS (Always):
  The system SHALL [action]

EVENT-DRIVEN (Triggers):
  WHEN [event] The system SHALL [response]

UNWANTED BEHAVIOR (Prevention):
  IF [bad condition] THEN the system SHALL [preventive action]

STATE-DRIVEN (Conditions):
  WHILE [state] The system SHALL [continuous action]

OPTIONAL (User choice):
  WHERE [user enables feature] The system SHALL [action]
```

---

## 🔧 Configuration

### Language Settings

```json
{
  "language": {
    "conversation_language": "en",
    "conversation_language_name": "English"
  }
}
```

Supported: English, Korean, Japanese, Chinese, Spanish

### Core Directories (English Only)

These MUST stay in English:
- `.claude/agents/`
- `.claude/commands/`
- `.claude/skills/`
- `.moai/memory/`

**Why**: Technical infrastructure needs single source of truth for reliability

---

## ⚡ Advanced Features

### Plan Mode

For complex multi-step features:
```bash
/alfred:1-plan "complex feature with 3+ domains"
# Alfred creates phased implementation plan
```

### Explore Subagent

Fast codebase exploration:
```bash
"Where are error handling patterns implemented?"
# Explore subagent searches efficiently
```

### Task() Delegation

```python
# Simple delegation
result = await Task(
    subagent_type="spec-builder",
    prompt="Create SPEC for authentication"
)

# Sequential workflow
spec = await Task(subagent_type="spec-builder", prompt="...")
code = await Task(subagent_type="tdd-implementer", prompt=f"Implement {spec}")

# Parallel execution
results = await asyncio.gather(
    Task(...),
    Task(...),
    Task(...)
)
```

### Token Efficiency

Agent delegation saves **80-85% tokens**:
- Monolithic: 130,000+ tokens (context overflow)
- Delegated: 20,000-30,000 per agent (focused context)

---

## 📚 Command Reference

```bash
# Initialize project
/alfred:0-project

# Create SPEC with planning
/alfred:1-plan "feature description"

# Implement with TDD
/alfred:2-run SPEC-001

# Sync documentation
/alfred:3-sync auto SPEC-001

# Create issue
/alfred:9-feedback
```

---

## 🎯 Best Practices

1. **Be Specific**: "Integrate Stripe payment" not "Add payments"
2. **Use Plans for Complex Work**: 2 min planning saves 2 weeks rework
3. **Trust Clarification**: Answer questions in Phase 1 for better results
4. **Test Coverage**: Minimum 85% (enforced automatically)
5. **SPEC First**: Always define requirements before coding

---

## 🔗 Quick References

- **EARS Format**: 5 statement patterns for clear requirements
- **TRUST 5**: Test, Readable, Unified, Secured, Trackable
- **Alfred Workflow**: Intent → Complexity → Plan → Confirm → Execute
- **Agents**: Specialized domain experts for optimal execution
- **MCP Integration**: External services via Model Context Protocol

---

## Project Information

- **Name**: lotto
- **Type**: SPEC-First TDD Development
- **Framework**: MoAI-ADK v0.7.0
- **Codebase Language**: Python
- **Version**: 0.25.7

### Implementation Status

✅ SPEC-First workflow integrated
✅ TRUST 5 quality enforcement
✅ 19 specialized agents available
✅ Automatic documentation generation
✅ Language localization complete (5 languages)

---

**Need help?** Use personas:
- 🎩 Alfred for workflows
- 🧙 Yoda for deep learning
- 🤖 R2-D2 for production issues
- 🧑‍🏫 Keating for skill mastery
