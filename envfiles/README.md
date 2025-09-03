# Environment Configuration Files

This directory contains example environment files for the Shared Media Streaming application.

## Setup Instructions

### Frontend Environment

1. Copy `frontend.env.example` to `apps/frontend/.env`
2. Update the values as needed for your environment

### Backend Environment

1. Copy `backend.env.example` to `apps/backend/.env.development`
2. Update the values as needed for your environment

## Required Configuration

### Stripe Configuration

- **Frontend**: `VITE_STRIPE_PUBLISHABLE_KEY` - Used for Stripe Elements (if implemented)
- **Backend**: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` - Used for payment processing

### Database Configuration

- **MongoDB**: Update `MONGO_URI` with your MongoDB connection string

### AWS S3 Configuration

- **AWS Keys**: Update with your AWS credentials for file storage
- **S3 Bucket**: Update with your S3 bucket name

### JWT Configuration

- **Secrets**: Generate secure random strings for JWT signing
- **Expiration**: Adjust token expiration times as needed

## Security Notes

- Never commit actual `.env` files to version control
- Use different keys for development, staging, and production
- Rotate secrets regularly
- Use environment-specific configurations

## Getting Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **API Keys**
3. Copy the appropriate keys:
   - **Publishable Key**: For frontend (starts with `pk_`)
   - **Secret Key**: For backend (starts with `sk_`)
   - **Webhook Secret**: For webhook verification (starts with `whsec_`)
