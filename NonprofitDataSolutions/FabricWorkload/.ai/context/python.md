## Project Setup & Management

- Always use `uv` for package management - never edit `pyproject.toml` manually
- Initialize projects with `uv init` and manage dependencies with `uv add <package>`
- Use `uv sync` to install dependencies and `uv run` to execute scripts
- Create virtual environments automatically with `uv venv`

## Code Structure

- **File size limit**: Keep files under 300 lines - split into modules when approaching this limit
- **Modular design**: Separate concerns into logical modules (models, services, routes, utils)
- Use clear folder structure: `src/`, `tests/`, `docs/`
- Group related functionality in packages with `__init__.py` files

## Documentation Standards

- Use inline docstrings for all functions and classes
- Follow Google/NumPy docstring format
- Add type hints for function parameters and return values
- Include brief module-level docstrings explaining purpose

## Preferred Packages

- **FastAPI** for web APIs
- **python-dotenv** for environment variables
- **Pydantic** for data validation
- **SQLAlchemy** for database operations
- **pytest** for testing

## Best Practices

- Load environment variables with `python-dotenv` at startup
- Use Pydantic models for request/response validation
- Implement proper error handling with custom exception classes
- Follow PEP 8 naming conventions
- Add comprehensive tests with good coverage
- Use dependency injection pattern for FastAPI routes

## Commands Reference

```bash
uv init                    # Initialize project
uv add <package>          # Add dependency
uv add --dev <package>    # Add dev dependency
uv sync                   # Install dependencies
uv run <script>           # Run script
```
