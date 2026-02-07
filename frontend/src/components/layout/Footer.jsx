import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-foreground text-background mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold text-xl">A</span>
              </div>
              <span className="font-heading text-2xl font-bold">Afrovending</span>
            </div>
            <p className="text-background/70 text-sm leading-relaxed">
              The heartbeat of African commerce. Connecting African vendors with global customers.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-background/70 hover:text-primary transition-colors" data-testid="footer-facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-primary transition-colors" data-testid="footer-twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-primary transition-colors" data-testid="footer-instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-primary transition-colors" data-testid="footer-email">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Shop</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/products" className="text-background/70 hover:text-primary transition-colors text-sm" data-testid="footer-products">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/products?category=fashion" className="text-background/70 hover:text-primary transition-colors text-sm" data-testid="footer-fashion">
                  Fashion
                </Link>
              </li>
              <li>
                <Link to="/products?category=art" className="text-background/70 hover:text-primary transition-colors text-sm" data-testid="footer-art">
                  Art & Crafts
                </Link>
              </li>
              <li>
                <Link to="/vendors" className="text-background/70 hover:text-primary transition-colors text-sm" data-testid="footer-vendors">
                  Vendors
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Account</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-background/70 hover:text-primary transition-colors text-sm" data-testid="footer-login">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-background/70 hover:text-primary transition-colors text-sm" data-testid="footer-register">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-background/70 hover:text-primary transition-colors text-sm" data-testid="footer-dashboard">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/register?vendor=true" className="text-background/70 hover:text-primary transition-colors text-sm" data-testid="footer-become-vendor">
                  Become a Vendor
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-background/70 hover:text-primary transition-colors text-sm" data-testid="footer-help">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-primary transition-colors text-sm" data-testid="footer-shipping">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-primary transition-colors text-sm" data-testid="footer-returns">
                  Returns & Refunds
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-primary transition-colors text-sm" data-testid="footer-contact">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-background/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/60 text-sm">
            © {new Date().getFullYear()} Afrovending. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-background/60 hover:text-primary transition-colors text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-background/60 hover:text-primary transition-colors text-sm">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
