from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.db import database_connect_args, migration_database_url
from app.models import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(url=migration_database_url(), target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    migration_url = migration_database_url()
    configuration["sqlalchemy.url"] = migration_url
    # A web deploy must never wait forever for a PostgreSQL connection or DDL
    # lock. Render cannot detect the service port until migrations finish, so
    # bounded timeouts turn lock contention into a visible retryable error.
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args={
            **database_connect_args(migration_url),
            "options": "-c lock_timeout=10000 -c statement_timeout=60000",
        },
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
