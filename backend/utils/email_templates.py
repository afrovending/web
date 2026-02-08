"""
Email template utilities for Afrovending
Uses Jinja2 for template rendering
"""
import os
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

# Get templates directory
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

# Initialize Jinja2 environment
env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(['html', 'xml'])
)


def render_template(template_name: str, **context) -> str:
    """
    Render an email template with the given context.
    
    Args:
        template_name: Name of the template file (e.g., 'booking_created.html')
        **context: Variables to pass to the template
    
    Returns:
        Rendered HTML string
    """
    template = env.get_template(template_name)
    return template.render(**context)


def render_booking_created(vendor_name: str, booking: dict) -> str:
    """Render booking created email template"""
    return render_template(
        'booking_created.html',
        vendor_name=vendor_name,
        service_name=booking.get('service_name', ''),
        customer_name=booking.get('customer_name', ''),
        customer_email=booking.get('customer_email', ''),
        booking_date=booking.get('booking_date', ''),
        booking_time=booking.get('booking_time', ''),
        duration_minutes=booking.get('duration_minutes', 0),
        price=f"{booking.get('price', 0):.2f}",
        notes=booking.get('notes', '')
    )


def render_booking_status(customer_name: str, booking: dict, new_status: str) -> str:
    """Render booking status update email template"""
    status_messages = {
        "confirmed": "Your booking has been confirmed by the vendor.",
        "in_progress": "Your service is now in progress.",
        "completed": "Your service has been marked as completed.",
        "cancelled": "Your booking has been cancelled."
    }
    
    return render_template(
        'booking_status.html',
        customer_name=customer_name,
        service_name=booking.get('service_name', ''),
        booking_date=booking.get('booking_date', ''),
        booking_time=booking.get('booking_time', ''),
        status=new_status.upper(),
        status_message=status_messages.get(new_status, f"Your booking status has been updated to: {new_status}")
    )


def render_payment_released(vendor_name: str, booking: dict) -> str:
    """Render payment released email template"""
    return render_template(
        'payment_released.html',
        vendor_name=vendor_name,
        service_name=booking.get('service_name', ''),
        customer_name=booking.get('customer_name', ''),
        booking_date=booking.get('booking_date', ''),
        price=f"{booking.get('price', 0):.2f}"
    )


def render_order_status(customer_name: str, order: dict, new_status: str) -> str:
    """Render order status update email template"""
    status_messages = {
        "processing": "Your order is being processed.",
        "shipped": "Your order has been shipped!",
        "delivered": "Your order has been delivered.",
        "cancelled": "Your order has been cancelled."
    }
    
    return render_template(
        'order_status.html',
        customer_name=customer_name,
        order_id=order.get('id', '')[:8],
        items_count=len(order.get('items', [])),
        total=f"{order.get('total', 0):.2f}",
        status=new_status.upper(),
        status_message=status_messages.get(new_status, f"Your order status has been updated to: {new_status}")
    )


def render_weekly_report(report_data: dict) -> str:
    """Render weekly analytics report email template"""
    # Calculate change indicators
    rev_change_color = "#16a34a" if report_data.get('revenue_change', 0) >= 0 else "#dc2626"
    rev_change_icon = "↑" if report_data.get('revenue_change', 0) >= 0 else "↓"
    
    orders_change_color = "#16a34a" if report_data.get('orders_change', 0) >= 0 else "#dc2626"
    orders_change_icon = "↑" if report_data.get('orders_change', 0) >= 0 else "↓"
    
    views_change_color = "#16a34a" if report_data.get('views_change', 0) >= 0 else "#dc2626"
    views_change_icon = "↑" if report_data.get('views_change', 0) >= 0 else "↓"
    
    return render_template(
        'weekly_report.html',
        vendor_name=report_data.get('vendor_name', 'Vendor'),
        period_start=report_data.get('period_start', ''),
        period_end=report_data.get('period_end', ''),
        total_revenue=f"{report_data.get('total_revenue', 0):.2f}",
        total_orders=report_data.get('total_orders', 0),
        average_order_value=f"{report_data.get('average_order_value', 0):.2f}",
        revenue_change_abs=f"{abs(report_data.get('revenue_change', 0)):.1f}",
        orders_change_abs=f"{abs(report_data.get('orders_change', 0)):.1f}",
        views_change_abs=f"{abs(report_data.get('views_change', 0)):.1f}",
        rev_change_color=rev_change_color,
        rev_change_icon=rev_change_icon,
        orders_change_color=orders_change_color,
        orders_change_icon=orders_change_icon,
        views_change_color=views_change_color,
        views_change_icon=views_change_icon,
        total_views=report_data.get('total_views', 0),
        unique_visitors=report_data.get('unique_visitors', 0),
        view_to_cart_rate=report_data.get('view_to_cart_rate', 0),
        cart_to_purchase_rate=report_data.get('cart_to_purchase_rate', 0),
        overall_conversion_rate=report_data.get('overall_conversion_rate', 0),
        top_products=report_data.get('top_products', []),
        new_customers=report_data.get('new_customers', 0),
        returning_customers=report_data.get('returning_customers', 0),
        top_locations=report_data.get('top_locations', [])
    )
