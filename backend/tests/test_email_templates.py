"""
Test Jinja2 email templates for Afrovending
Tests: Template rendering, variable substitution, conditional blocks
"""
import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from utils.email_templates import (
    render_template,
    render_booking_created,
    render_booking_status,
    render_payment_released,
    render_order_status,
    render_weekly_report
)


class TestEmailTemplates:
    """Test email template rendering"""
    
    def test_booking_created_template(self):
        """Test booking_created.html renders correctly"""
        booking_data = {
            "service_name": "Hair Braiding",
            "customer_name": "Jane Doe",
            "customer_email": "jane@example.com",
            "booking_date": "2026-02-15",
            "booking_time": "10:00 AM",
            "duration_minutes": 120,
            "price": 75.00,
            "notes": "Please bring hair extensions"
        }
        
        html = render_booking_created("African Beauty Salon", booking_data)
        
        # Verify template rendered
        assert html is not None
        assert len(html) > 100, "Template should render substantial HTML"
        
        # Verify variables substituted
        assert "African Beauty Salon" in html
        assert "Hair Braiding" in html
        assert "Jane Doe" in html
        assert "jane@example.com" in html
        assert "2026-02-15" in html
        assert "10:00 AM" in html
        assert "120 minutes" in html
        assert "$75.00" in html
        assert "Please bring hair extensions" in html
        
        # Verify structure
        assert "New Booking!" in html
        assert "Afrovending" in html
        print("booking_created.html: All variables correctly substituted")
    
    def test_booking_created_without_notes(self):
        """Test booking_created.html with empty notes (conditional block)"""
        booking_data = {
            "service_name": "Massage",
            "customer_name": "John Smith",
            "customer_email": "john@example.com",
            "booking_date": "2026-02-20",
            "booking_time": "2:00 PM",
            "duration_minutes": 60,
            "price": 50.00,
            "notes": ""  # Empty notes
        }
        
        html = render_booking_created("Wellness Spa", booking_data)
        
        assert "Wellness Spa" in html
        assert "Massage" in html
        # Notes block should not appear when empty
        assert "<strong>Notes:</strong>" not in html
        print("booking_created.html: Conditional notes block works correctly")
    
    def test_booking_status_template(self):
        """Test booking_status.html renders correctly"""
        booking_data = {
            "service_name": "Photography Session",
            "booking_date": "2026-02-18",
            "booking_time": "3:00 PM"
        }
        
        html = render_booking_status("Customer Name", booking_data, "confirmed")
        
        assert "Customer Name" in html
        assert "Photography Session" in html
        assert "CONFIRMED" in html
        assert "confirmed by the vendor" in html
        assert "Booking Update" in html
        print("booking_status.html: Rendered with confirmed status")
    
    def test_booking_status_cancelled(self):
        """Test booking_status.html with cancelled status"""
        booking_data = {
            "service_name": "Catering Service",
            "booking_date": "2026-02-25",
            "booking_time": "12:00 PM"
        }
        
        html = render_booking_status("Jane Customer", booking_data, "cancelled")
        
        assert "CANCELLED" in html
        assert "cancelled" in html.lower()
        print("booking_status.html: Rendered with cancelled status")
    
    def test_payment_released_template(self):
        """Test payment_released.html renders correctly"""
        booking_data = {
            "service_name": "Event Planning",
            "customer_name": "Corporate Client",
            "booking_date": "2026-02-10",
            "price": 500.00
        }
        
        html = render_payment_released("Event Master Inc", booking_data)
        
        assert "Event Master Inc" in html
        assert "Event Planning" in html
        assert "Corporate Client" in html
        assert "$500.00" in html
        print("payment_released.html: All variables correctly substituted")
    
    def test_order_status_template(self):
        """Test order_status.html renders correctly"""
        order_data = {
            "id": "abc12345-6789-0def-ghij-klmnopqrstuv",
            "items": [{"name": "Item 1"}, {"name": "Item 2"}, {"name": "Item 3"}],
            "total": 150.00
        }
        
        html = render_order_status("Buyer Name", order_data, "shipped")
        
        assert "Buyer Name" in html
        assert "abc12345" in html  # First 8 chars of order ID
        assert "3" in html  # Items count
        assert "$150.00" in html
        assert "SHIPPED" in html
        assert "shipped" in html.lower()
        print("order_status.html: Rendered with shipped status")
    
    def test_weekly_report_template(self):
        """Test weekly_report.html renders correctly with complex data"""
        report_data = {
            "vendor_name": "African Crafts Store",
            "period_start": "2026-02-01",
            "period_end": "2026-02-07",
            "total_revenue": 2500.00,
            "total_orders": 45,
            "average_order_value": 55.56,
            "revenue_change": 15.5,  # Positive change
            "orders_change": -5.2,   # Negative change
            "views_change": 25.0,
            "total_views": 1200,
            "unique_visitors": 850,
            "view_to_cart_rate": 12.5,
            "cart_to_purchase_rate": 45.0,
            "overall_conversion_rate": 5.6,
            "top_products": [
                {"name": "Handwoven Basket", "sales": 12},
                {"name": "Beaded Necklace", "sales": 8}
            ],
            "new_customers": 25,
            "returning_customers": 20,
            "top_locations": [
                {"name": "United States", "count": 30},
                {"name": "United Kingdom", "count": 10}
            ]
        }
        
        html = render_weekly_report(report_data)
        
        # Verify basic data
        assert "African Crafts Store" in html
        assert "2026-02-01" in html
        assert "2026-02-07" in html
        assert "$2500.00" in html
        assert "45" in html
        
        # Verify change indicators
        assert "15.5" in html  # Revenue change
        assert "5.2" in html   # Orders change (absolute value)
        
        # Verify color coding
        assert "#16a34a" in html  # Green for positive
        assert "#dc2626" in html  # Red for negative
        
        print("weekly_report.html: Complex report rendered correctly")
    
    def test_weekly_report_all_negative_changes(self):
        """Test weekly_report.html with all negative changes"""
        report_data = {
            "vendor_name": "Test Vendor",
            "period_start": "2026-02-01",
            "period_end": "2026-02-07",
            "total_revenue": 1000.00,
            "total_orders": 20,
            "average_order_value": 50.00,
            "revenue_change": -10.0,
            "orders_change": -15.0,
            "views_change": -5.0,
            "total_views": 500,
            "unique_visitors": 300,
            "view_to_cart_rate": 8.0,
            "cart_to_purchase_rate": 30.0,
            "overall_conversion_rate": 4.0,
            "top_products": [],
            "new_customers": 10,
            "returning_customers": 10,
            "top_locations": []
        }
        
        html = render_weekly_report(report_data)
        
        # All changes negative - should use red and down arrow
        assert "↓" in html
        assert "#dc2626" in html  # Red color
        print("weekly_report.html: Negative changes render correctly")
    
    def test_template_html_structure(self):
        """Verify templates produce valid HTML structure"""
        booking_data = {
            "service_name": "Test Service",
            "customer_name": "Test Customer",
            "customer_email": "test@test.com",
            "booking_date": "2026-01-01",
            "booking_time": "10:00",
            "duration_minutes": 60,
            "price": 100.00,
            "notes": ""
        }
        
        html = render_booking_created("Test Vendor", booking_data)
        
        # Verify basic HTML structure
        assert "<!DOCTYPE html>" in html
        assert "<html>" in html
        assert "</html>" in html
        assert "<body" in html
        assert "</body>" in html
        print("Templates produce valid HTML structure")
    
    def test_template_escaping(self):
        """Test that templates properly escape HTML entities (XSS prevention)"""
        booking_data = {
            "service_name": "<script>alert('XSS')</script>",
            "customer_name": "Test & Customer",
            "customer_email": "test@test.com",
            "booking_date": "2026-01-01",
            "booking_time": "10:00",
            "duration_minutes": 60,
            "price": 100.00,
            "notes": ""
        }
        
        html = render_booking_created("Test <b>Vendor</b>", booking_data)
        
        # Script tags should be escaped
        assert "<script>" not in html
        assert "&lt;script&gt;" in html or "alert" not in html
        
        # & should be escaped
        assert "Test &amp; Customer" in html or "Test & Customer" not in html
        print("Templates properly escape HTML entities")
