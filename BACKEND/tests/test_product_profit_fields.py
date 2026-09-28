from API.home.DB.MODELS.Table.order_item import OrderItem
from API.home.DB.MODELS.Table.product import Product


def test_product_model_tracks_cost_and_selling_price():
    assert 'cost_price' in Product.__annotations__
    assert 'selling_price' in Product.__annotations__

    product = Product(
        name='Test Product',
        description='Test description',
        price=120.0,
        cost_price=60.0,
        selling_price=120.0,
        stock_quantity=10,
        category_id=1,
    )

    assert product.cost_price == 60.0
    assert product.selling_price == 120.0


def test_order_item_tracks_sale_snapshot_for_profit_chart():
    assert 'unit_cost_price' in OrderItem.__annotations__
    assert 'unit_selling_price' in OrderItem.__annotations__

    item = OrderItem(
        order_id=1,
        product_id=2,
        quantity=3,
        unit_price=120.0,
        unit_cost_price=60.0,
        unit_selling_price=120.0,
    )

    assert item.unit_cost_price == 60.0
    assert item.unit_selling_price == 120.0
    assert (item.unit_selling_price - item.unit_cost_price) * item.quantity == 180.0
