require('dotenv').config()
const express = require('express')
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)
const { authenticateToken, setUser, authenticateRole } = require('../middleware/auth')
const { pool } = require('../db/pool')
const { ROLE, DEV_FEE } = require('../data')

const router = express.Router()

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event

    try {
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (err) {
        console.log('Webhook signature verification failed.', err.message)
        return res.sendStatus(400)
    }

    if (event.type === 'checkout.session.completed') {
        // Update the database here
        const session = event.data.object
        console.log('Payment successful!', session.id)
        console.log('User ID:', session.metadata.userId)
        // role_id = 2 is for developer
        const [roleRow] = await pool.query(
            `UPDATE userlogin SET role_id = 2 WHERE user_id = ?`,
            [session.metadata.userId]
        )
    }

    res.sendStatus(200)
})

router.use(express.json())

router.post('/dev-checkout', authenticateToken, authenticateRole([ROLE.USER, ROLE.DEVELOPER]), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT role_id
                 FROM userlogin
                 WHERE user_id = ?`,
            [req.user.id]
        );
        if (rows.length > 0 && rows[0].role_id === 2) {
            console.log('user is already a developer')
            return res.status(400).json({ error: 'user is already a developer' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'dev_fee' },
                    unit_amount: DEV_FEE
                },
                quantity: 1
            }],
            metadata: { userId: req.user.id },
            success_url: `http://localhost:3000/pages/success.html`,
            cancel_url: `http://localhost:3000/pages/cancel.html`
        })
        console.log('came here')
        res.json({ url: session.url })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

router.post('/game-checkout', authenticateToken, authenticateRole([ROLE.USER, ROLE.DEVELOPER]), async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'clone wars' },
                    unit_amount: 2000
                },
                quantity: 1
            }],
            mode: 'payment',
            payment_intent_data: {
                application_fee_amount: Math.floor(2000 * 0.2),
                transfer_data: {
                    destination: 'acct_1TDOFRRDH7btL2vG'
                }
            },
            metadata: { userId: req.user.id },
            success_url: `http://localhost:3000/pages/success.html`,
            cancel_url: `http://localhost:3000/pages/cancel.html`
        })
    } catch(e) {
        console.log(e.message)
        res.status(500).json({ error: e.message })
    }
})

module.exports = router