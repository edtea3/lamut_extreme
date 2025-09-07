# Overview

This is a Flask-based web application for "Lamut Extreme" - a hunting tourism service specializing in snow sheep hunting in Verkhoyansk. The application serves as a landing page with tour information, reviews, gallery, contact details, and an application form for booking hunting expeditions.

# Recent Changes

**September 2025:** Successfully set up Lamut Extreme Flask application in Replit environment:
- Installed Python 3.11 and all required dependencies from requirements.txt
- Configured Flask app to run on 0.0.0.0:5000 for Replit's proxy system
- Set up workflow for automatic server management on port 5000
- Made environment variables optional so app runs without database/email configuration
- Configured deployment with Gunicorn for production readiness
- App is now fully functional with working contact forms and review system

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend uses a traditional server-side rendering approach with Flask's Jinja2 templating engine. The main template (`index.html`) implements a single-page design with sections for tour information, reviews, contacts, and booking forms. The UI is enhanced with:
- Custom CSS with fade-in animations and responsive design
- JavaScript for scroll-based header visibility and intersection observer animations
- External fonts from Google Fonts (Alumni Sans, Roboto, Montserrat)
- Static assets served through Flask's static file handling

## Backend Architecture
The backend is built on Flask with a minimalist approach:
- Single `app.py` file containing all route handlers and business logic
- Environment variable configuration using python-dotenv
- Email functionality for contact form submissions using SMTP
- Session management with Flask's built-in session handling

## Data Storage Solutions
- **Supabase**: Used as the primary database backend for storing application data, user submissions, and potentially review/booking information
- **No local database**: All persistent data is handled through Supabase's cloud infrastructure

## Authentication and Authorization
Currently, the application appears to have minimal authentication requirements, focusing primarily on public-facing content and form submissions. Authentication mechanisms are not explicitly implemented in the current codebase.

## Email Integration
- **SMTP Configuration**: Uses Gmail's SMTP server (smtp.gmail.com:465) with SSL
- **Email Functionality**: Automated email sending for contact form submissions and booking inquiries
- **Self-notification System**: Emails are sent to the same address as the sender for internal notification purposes

# External Dependencies

## Core Framework
- **Flask**: Web framework for Python with Werkzeug WSGI toolkit
- **Gunicorn**: WSGI HTTP server for production deployment

## Database and Backend Services
- **Supabase**: Cloud database and backend-as-a-service platform providing PostgreSQL database, authentication, and real-time features

## Email Services
- **Gmail SMTP**: Email delivery service using Gmail's SMTP servers for sending notifications and contact form submissions

## Deployment Platform
- **Vercel**: Configured for serverless deployment with Python runtime support

## Development Tools
- **python-dotenv**: Environment variable management for configuration
- **Semgrep**: Static code analysis tool configured for security scanning

## External Integrations
- **Google Drive**: Integration for hosting and sharing hunting expedition gallery images
- **Google Fonts**: External font resources for enhanced typography