from API.home.payment import create_checkout_session


def test_create_checkout_session_without_stripe_key_returns_demo_checkout():
    result = create_checkout_session(
        items=[{"name": "Test Product", "quantity": 2, "price": 25.0}],
        customer_email="demo@example.com",
        success_url="https://e-commerce-website-sluq.vercel.app/success",
        cancel_url="https://e-commerce-website-sluq.vercel.app/cart",
        stripe_secret_key="",
    )

    assert result["provider"] == "demo"
    assert result["checkout_url"].startswith("https://e-commerce-website-sluq.vercel.app")
    assert result["amount_total"] == 50.0
