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
            req.body,
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
        if (session.metadata.info === 'dev-checkout') {
            console.log('Payment successful!', session.id)
            console.log('User ID:', session.metadata.userId)
            // role_id = 2 is for developer
            const [roleRow] = await pool.query(
                `UPDATE userlogin SET role_id = 2 WHERE user_id = ?`,
                [session.metadata.userId]
            )
        } else if (session.metadata.info === 'game-checkout') {
            console.log('Payment successful!', session.id)
            console.log('User ID:', session.metadata.userId)

            const [gameRow] = await pool.query(
                `INSERT INTO user_games(user_id, game_id)
                VALUES(?, ?)`,
                [session.metadata.userId, session.metadata.gameId]
            )
        }
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
            metadata: { userId: req.user.id, info: 'dev-checkout' },
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
        // const account = await stripe.accounts.retrieve('acct_1TDQ6QQQMeUR7LJZ');
        // console.log(account);
        const [rows] = await pool.query(
            `SELECT acc_id FROM developer
            WHERE user_id = ?`,
            [req.user.id]
        )
        if (rows.length === 0 || rows[0].acc_id === null) {
            console.log(rows[0])
            console.log('user does not have an account id')
            return res.status(400).json({ error: 'user does not have an account id' });
        }

        const account = await stripe.accounts.retrieve(rows[0].acc_id);
        if (!account.details_submitted || !account.payouts_enabled) {
            return res.json({
                message: 'Seller onboarding not complete yet.',
                url: `http://localhost:3000/pages/cancel.html`,
            });
        }

        const [gameRows] = await pool.query(
            `SELECT title, game_id, price FROM games
            WHERE title = ?`,
            [req.body.title]
        )
        if (gameRows.length === 0) {
            console.log(`There is not game with the title  ${req.body.title}`)
            return res.status(400).json({ error: `There is not game with the title  ${req.body.title}` });
        }

        const [hasGame] = await pool.query(
            `SELECT game_id FROM user_games WHERE user_id = ?`,
            [req.user.id]
        )

        if(hasGame.length !== 0) {
            console.log(`User already has the game with the title ${req.body.title}`)
            return res.status(400).json({ error: `User already has the game with the title ${req.body.title}` });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: gameRows[0].title },
                    unit_amount: gameRows[0].price
                },
                quantity: 1
            }],
            mode: 'payment',
            payment_intent_data: {
                application_fee_amount: Math.floor(gameRows[0].price * 0.2),
                transfer_data: {
                    destination: rows[0].acc_id
                }
            },
            metadata: { userId: req.user.id, info: 'game-checkout', gameId: gameRows[0].game_id },
            success_url: `http://localhost:3000/pages/success.html`,
            cancel_url: `http://localhost:3000/pages/cancel.html`
        })
        res.json({ url: session.url })
    } catch (e) {
        console.log(e.message)
        res.status(500).json({ error: e.message })
    }
})

router.post('/onboard', authenticateToken, authenticateRole(ROLE.DEVELOPER), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT email, acc_id FROM developer
            WHERE user_id = ?`,
            [req.user.id]
        )
        if (rows.length > 0 && rows[0].acc_id !== null) {
            console.log('user already linked his account')
            return res.status(400).json({ error: 'user already linked his account' });
        }

        const account = await stripe.accounts.create({
            type: 'express',
            country: 'GB',
            email: rows[0].email,
            business_type: 'individual',
        })
        let sellerAccountId = account.id

        const accountLink = await stripe.accountLinks.create({
            account: sellerAccountId,
            refresh_url: 'http://localhost:3000/pages/cancel.html',
            return_url: 'http://localhost:3000/pages/success.html',
            type: 'account_onboarding',
        });

        const [acc_id] = await pool.query(
            `UPDATE developer SET acc_id = ?
            WHERE user_id = ?`,
            [sellerAccountId, req.user.id]
        )

        return res.json({
            message: 'Seller account created. Complete onboarding first.',
            url: accountLink.url,
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
})

module.exports = router