import pytest
import asyncio
from app.providers.uber import UberProvider
from app.providers.ola import OlaProvider
from app.providers.rapido import RapidoProvider
from app.providers.indrive import InDriveProvider
from app.providers.base import RouteInfo

BANGALORE_ROUTE = RouteInfo(
    pickup_lat=12.9716,
    pickup_lng=77.5946,
    destination_lat=12.9352,
    destination_lng=77.6245,
)


@pytest.mark.asyncio
async def test_uber_mock_estimates():
    provider = UberProvider()
    results = await provider.get_estimates(BANGALORE_ROUTE)
    assert len(results) > 0
    for r in results:
        assert r.provider == "uber"
        assert r.fare_min > 0
        assert r.fare_max >= r.fare_min
        assert r.eta_minutes > 0
        assert r.deeplink_url.startswith("uber://")


@pytest.mark.asyncio
async def test_ola_mock_estimates():
    provider = OlaProvider()
    results = await provider.get_estimates(BANGALORE_ROUTE)
    assert len(results) > 0
    for r in results:
        assert r.provider == "ola"
        assert r.fare_min > 0


@pytest.mark.asyncio
async def test_rapido_mock_estimates():
    provider = RapidoProvider()
    results = await provider.get_estimates(BANGALORE_ROUTE)
    assert len(results) > 0
    assert any(r.vehicle_type == "bike" for r in results)


@pytest.mark.asyncio
async def test_indrive_no_surge():
    provider = InDriveProvider()
    results = await provider.get_estimates(BANGALORE_ROUTE)
    assert len(results) > 0
    assert all(r.surge_multiplier == 1.0 for r in results)


@pytest.mark.asyncio
async def test_deeplinks_contain_coords():
    provider = UberProvider()
    deeplink = provider.create_deeplink(BANGALORE_ROUTE, "UberGo")
    assert str(BANGALORE_ROUTE.pickup_lat) in deeplink
    assert str(BANGALORE_ROUTE.destination_lat) in deeplink


def test_ride_estimate_fare_display():
    from app.providers.base import RideEstimate
    e = RideEstimate(
        provider="uber", category="UberGo", category_display="Uber Go",
        eta_minutes=7, fare_min=150, fare_max=180, currency="INR",
        surge_multiplier=1.0, deeplink_url="uber://", available=True,
        comfort_level="economy", vehicle_type="mini",
        logo_url="https://cdn.ridecompare.app/logos/uber.png",
    )
    assert "₹150" in e.fare_display
    assert not e.is_surging

    e.surge_multiplier = 1.5
    assert e.is_surging
