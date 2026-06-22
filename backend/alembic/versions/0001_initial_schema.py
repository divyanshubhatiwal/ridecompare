"""initial schema

Revision ID: 0001
Revises:
Create Date: 2025-01-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("phone_number", sa.String(20), nullable=True),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("google_id", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("is_verified", sa.Boolean(), default=False, nullable=False),
        sa.Column("fcm_token", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)

    # refresh_tokens
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(512), nullable=False),
        sa.Column("is_revoked", sa.Boolean(), default=False, nullable=False),
        sa.Column("device_info", sa.String(512), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"])
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])

    # saved_places
    op.create_table(
        "saved_places",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(100), nullable=False),
        sa.Column("place_id", sa.String(255), nullable=True),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("is_favorite", sa.Boolean(), default=False),
        sa.Column("icon", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_saved_places_user_id", "saved_places", ["user_id"])

    # ride_searches
    op.create_table(
        "ride_searches",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("pickup_address", sa.Text(), nullable=False),
        sa.Column("pickup_lat", sa.Float(), nullable=False),
        sa.Column("pickup_lng", sa.Float(), nullable=False),
        sa.Column("destination_address", sa.Text(), nullable=False),
        sa.Column("destination_lat", sa.Float(), nullable=False),
        sa.Column("destination_lng", sa.Float(), nullable=False),
        sa.Column("distance_km", sa.Float(), nullable=True),
        sa.Column("duration_minutes", sa.Float(), nullable=True),
        sa.Column("searched_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ride_searches_user_id", "ride_searches", ["user_id"])

    # ride_results
    op.create_table(
        "ride_results",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("search_id", sa.Integer(), nullable=False),
        sa.Column("provider_name", sa.String(50), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("eta_minutes", sa.Integer(), nullable=True),
        sa.Column("fare_min", sa.Float(), nullable=True),
        sa.Column("fare_max", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(10), default="INR"),
        sa.Column("surge_multiplier", sa.Float(), default=1.0),
        sa.Column("is_available", sa.Boolean(), default=True),
        sa.Column("deeplink_url", sa.Text(), nullable=True),
        sa.Column("raw_response", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["search_id"], ["ride_searches.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ride_results_search_id", "ride_results", ["search_id"])

    # preferences
    op.create_table(
        "preferences",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("preferred_sort", sa.String(20), default="cheapest"),
        sa.Column("avoid_surge", sa.Boolean(), default=False),
        sa.Column("max_surge_multiplier", sa.Float(), default=1.5),
        sa.Column("preferred_providers", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("preferred_ride_types", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("airport_mode", sa.Boolean(), default=False),
        sa.Column("notifications_enabled", sa.Boolean(), default=True),
        sa.Column("price_alert_enabled", sa.Boolean(), default=True),
        sa.Column("surge_alert_enabled", sa.Boolean(), default=True),
        sa.Column("default_pickup_place_id", sa.Integer(), nullable=True),
        sa.Column("currency", sa.String(10), default="INR"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    # price_alerts
    op.create_table(
        "price_alerts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("alert_type", sa.String(20), nullable=False),
        sa.Column("pickup_address", sa.String(512), nullable=False),
        sa.Column("pickup_lat", sa.Float(), nullable=True),
        sa.Column("pickup_lng", sa.Float(), nullable=True),
        sa.Column("destination_address", sa.String(512), nullable=False),
        sa.Column("destination_lat", sa.Float(), nullable=True),
        sa.Column("destination_lng", sa.Float(), nullable=True),
        sa.Column("provider", sa.String(50), nullable=True),
        sa.Column("threshold_amount", sa.Float(), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("triggered_count", sa.Integer(), default=0),
        sa.Column("last_triggered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_price_alerts_user_id", "price_alerts", ["user_id"])

    # notification_logs
    op.create_table(
        "notification_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("alert_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.String(1024), nullable=False),
        sa.Column("notification_type", sa.String(50), nullable=False),
        sa.Column("is_sent", sa.Boolean(), default=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["alert_id"], ["price_alerts.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )

    # provider_cache
    op.create_table(
        "provider_cache",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("cache_key", sa.String(512), nullable=False),
        sa.Column("provider_name", sa.String(50), nullable=False),
        sa.Column("response_data", postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cache_key"),
    )
    op.create_index("ix_provider_cache_cache_key", "provider_cache", ["cache_key"], unique=True)


def downgrade():
    op.drop_table("provider_cache")
    op.drop_table("notification_logs")
    op.drop_table("price_alerts")
    op.drop_table("preferences")
    op.drop_table("ride_results")
    op.drop_table("ride_searches")
    op.drop_table("saved_places")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
