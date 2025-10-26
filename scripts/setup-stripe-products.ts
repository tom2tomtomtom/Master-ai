#!/usr/bin/env tsx

/**
 * Setup Stripe Products and Prices for Master-AI Subscription Tiers
 * 
 * This script creates the necessary Stripe products and prices for the Master-AI platform.
 * Run this script after setting up your Stripe account and configuring webhook endpoints.
 * 
 * Usage:
 * npm run setup-stripe-products
 * 
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Your webhook endpoint secret
 * 
 * Products Created:
 * - Master-AI Pro Monthly ($49/month)
 * - Master-AI Pro Annual ($490/year)
 * - Master-AI Team Monthly ($99/user/month)
 * - Master-AI Team Annual ($990/user/year)
 */

import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import { promises as fs } from 'fs'
import path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is required')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
})

interface ProductConfig {
  name: string
  description: string
  prices: {
    nickname: string
    amount: number
    currency: string
    interval: 'month' | 'year'
    envVarName: string
  }[]
}

const PRODUCTS: ProductConfig[] = [
  {
    name: 'Master-AI Pro',
    description: 'Complete access to all 81 AI lessons, exercises, certificates, and email support. Perfect for individual learners.',
    prices: [
      {
        nickname: 'Pro Monthly',
        amount: 4900, // $49.00 in cents
        currency: 'usd',
        interval: 'month',
        envVarName: 'STRIPE_PRO_MONTHLY_PRICE_ID',
      },
      {
        nickname: 'Pro Annual',
        amount: 49000, // $490.00 in cents (17% discount)
        currency: 'usd',
        interval: 'year',
        envVarName: 'STRIPE_PRO_ANNUAL_PRICE_ID',
      },
    ],
  },
  {
    name: 'Master-AI Team',
    description: 'Everything in Pro plus team management, progress analytics, custom learning paths, and priority support.',
    prices: [
      {
        nickname: 'Team Monthly',
        amount: 9900, // $99.00 per user per month in cents
        currency: 'usd',
        interval: 'month',
        envVarName: 'STRIPE_TEAM_MONTHLY_PRICE_ID',
      },
      {
        nickname: 'Team Annual',
        amount: 99000, // $990.00 per user per year in cents (17% discount)
        currency: 'usd',
        interval: 'year',
        envVarName: 'STRIPE_TEAM_ANNUAL_PRICE_ID',
      },
    ],
  },
]

async function createOrUpdateProduct(productConfig: ProductConfig): Promise<string> {
  console.log(`\n🔄 Processing product: ${productConfig.name}`)

  try {
    // Check if product already exists
    const existingProducts = await stripe.products.list({
      limit: 100,
    })
    
    let product = existingProducts.data.find(p => p.name === productConfig.name)
    
    if (product) {
      console.log(`✅ Product "${productConfig.name}" already exists (${product.id})`)
      
      // Update product if needed
      product = await stripe.products.update(product.id, {
        description: productConfig.description,
        metadata: {
          tier: productConfig.name.toLowerCase().includes('pro') ? 'pro' : 'team',
          updated_at: new Date().toISOString(),
        },
      })
    } else {
      // Create new product
      product = await stripe.products.create({
        name: productConfig.name,
        description: productConfig.description,
        type: 'service',
        metadata: {
          tier: productConfig.name.toLowerCase().includes('pro') ? 'pro' : 'team',
          created_at: new Date().toISOString(),
        },
      })
      console.log(`✅ Created product "${productConfig.name}" (${product.id})`)
    }

    return product.id
  } catch (error) {
    console.error(`❌ Error with product "${productConfig.name}":`, error)
    throw error
  }
}

async function createOrUpdatePrice(productId: string, priceConfig: ProductConfig['prices'][0]): Promise<string> {
  console.log(`  🔄 Processing price: ${priceConfig.nickname}`)

  try {
    // Check if price already exists
    const existingPrices = await stripe.prices.list({
      product: productId,
      limit: 100,
    })
    
    let price = existingPrices.data.find(p => 
      p.nickname === priceConfig.nickname ||
      (p.unit_amount === priceConfig.amount && 
       p.recurring?.interval === priceConfig.interval)
    )
    
    if (price) {
      console.log(`  ✅ Price "${priceConfig.nickname}" already exists (${price.id})`)
      
      // Update price metadata if needed
      if (!price.nickname || price.nickname !== priceConfig.nickname) {
        price = await stripe.prices.update(price.id, {
          nickname: priceConfig.nickname,
          metadata: {
            tier: productId.includes('pro') ? 'pro' : 'team',
            interval: priceConfig.interval,
            updated_at: new Date().toISOString(),
          },
        })
      }
    } else {
      // Create new price
      price = await stripe.prices.create({
        product: productId,
        unit_amount: priceConfig.amount,
        currency: priceConfig.currency,
        recurring: {
          interval: priceConfig.interval,
        },
        nickname: priceConfig.nickname,
        metadata: {
          tier: productId.includes('pro') ? 'pro' : 'team',
          interval: priceConfig.interval,
          created_at: new Date().toISOString(),
        },
      })
      console.log(`  ✅ Created price "${priceConfig.nickname}" (${price.id})`)
    }

    return price.id
  } catch (error) {
    console.error(`  ❌ Error with price "${priceConfig.nickname}":`, error)
    throw error
  }
}

async function updateEnvFile(envVars: Record<string, string>): Promise<void> {
  const envPath = path.join(process.cwd(), '.env.local')
  
  try {
    let envContent = ''
    
    // Read existing .env.local file if it exists
    try {
      envContent = await fs.readFile(envPath, 'utf-8')
    } catch (error) {
      // File doesn't exist, that's okay
      console.log('📝 Creating new .env.local file')
    }

    // Update or add new environment variables
    const envLines = envContent.split('\n')
    const updatedVars: string[] = []

    // Track which variables we've updated
    const updatedKeys = new Set<string>()

    // Update existing variables
    for (const line of envLines) {
      const [key, ...valueParts] = line.split('=')
      const value = valueParts.join('=')
      
      if (key in envVars) {
        updatedVars.push(`${key}=${envVars[key]}`)
        updatedKeys.add(key)
      } else {
        updatedVars.push(line)
      }
    }

    // Add new variables
    for (const [key, value] of Object.entries(envVars)) {
      if (!updatedKeys.has(key)) {
        updatedVars.push(`${key}=${value}`)
      }
    }

    // Write updated content
    await fs.writeFile(envPath, updatedVars.join('\n'))
    console.log('✅ Updated .env.local with new price IDs')
    
  } catch (error) {
    console.error('❌ Error updating .env.local:', error)
    console.log('\n📋 Please manually add these environment variables to your .env.local file:')
    for (const [key, value] of Object.entries(envVars)) {
      console.log(`${key}=${value}`)
    }
  }
}

export async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products and prices for Master-AI...\n')

  const envVars: Record<string, string> = {}

  try {
    for (const productConfig of PRODUCTS) {
      // Create or update product
      const productId = await createOrUpdateProduct(productConfig)
      
      // Create or update prices for this product
      for (const priceConfig of productConfig.prices) {
        const priceId = await createOrUpdatePrice(productId, priceConfig)
        envVars[priceConfig.envVarName] = priceId
      }
    }

    // Update .env.local file with new price IDs
    await updateEnvFile(envVars)

    console.log('\n🎉 Stripe setup completed successfully!')
    console.log('\n📋 Summary of created resources:')
    console.log('Products and Prices:')
    for (const [envVar, priceId] of Object.entries(envVars)) {
      console.log(`  ${envVar}: ${priceId}`)
    }

    console.log('\n⚠️  Next steps:')
    console.log('1. Set up your Stripe webhook endpoint in the Stripe Dashboard')
    console.log('2. Add the STRIPE_WEBHOOK_SECRET to your .env.local file')
    console.log('3. Configure your webhook to listen to these events:')
    console.log('   - customer.subscription.created')
    console.log('   - customer.subscription.updated')
    console.log('   - customer.subscription.deleted')
    console.log('   - invoice.payment_succeeded')
    console.log('   - invoice.payment_failed')
    console.log('   - customer.subscription.trial_will_end')
    console.log('4. Test your integration with Stripe\'s test cards')
    console.log('\n🔗 Your webhook endpoint should be: https://yourdomain.com/api/stripe/webhooks')

  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Setup interrupted by user')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n⚠️  Setup terminated')
  process.exit(0)
})

// Run the setup
setupStripeProducts().catch(error => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})