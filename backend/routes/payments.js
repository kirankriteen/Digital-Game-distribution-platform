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
        } else if (session.metadata.info === 'games-checkout') {
            console.log('Payment successful!', session.id)
            console.log('User ID:', session.metadata.userId)

            const games = JSON.parse(session.metadata.games)

            for (const game of games) {
                const [existing] = await pool.query(
                    `SELECT * FROM user_games WHERE user_id = ? AND game_id = ?`,
                    [session.metadata.userId, game.gameId]
                )

                if (existing.length === 0) {    
                    await pool.query(
                        `INSERT INTO user_games(user_id, game_id)
                 VALUES(?, ?)`,
                        [session.metadata.userId, game.game_id]
                    );
                    console.log(`Game "${game.title}" assigned to user.`);
                } else {
                    console.log(`Game "${game.title}" already owned by user, skipping.`);
                }

                // console.log(`Game "${game.title}" assigned to user. Dev acc_id: ${game.acc_id}`);
            }
            await payDevelopers(games);
        }
    }

    res.sendStatus(200)
})

router.use(express.json())

async function payDevelopers(games) {

    const balance = await stripe.balance.retrieve();
    const availableUSD = balance.available.find(b => b.currency === 'usd')?.amount || 0;

    const totalPayout = games.reduce((sum, g) => sum + g.price, 0);

    if (availableUSD < totalPayout) {
        console.log(`Insufficient USD balance. Available: ${availableUSD} cents, Needed: ${totalPayout} cents`);
        return;
    }
    const platformFeePercent = 2;
    for (const game of games) {
        try {
            const devAmount = Math.floor(game.price * (100 - platformFeePercent) / 100);

            // Get the transfer
            const transfer = await stripe.transfers.create({
                amount: devAmount,
                currency: 'usd',
                destination: game.acc_id,
                description: `Payout for game "${game.title}" (game_id: ${game.game_id})`
            });


            console.log(`Developer ${game.dev_id} paid for game "${game.title}"`);

            await pool.query(
                `UPDATE payments
                SET method = ?, amount = ?, currency_id = ?, status = ?
                WHERE payment_id = ?`,
                ['stripe_account', devAmount, 1, 'completed', game.payment_id]
            )
        } catch (e) {
            console.log(e.message)
            throw new Error(e.message);
        }
    }
}

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

        if (hasGame.length !== 0) {
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

router.post('/games-checkout', authenticateToken, authenticateRole([ROLE.USER, ROLE.DEVELOPER]), async (req, res) => {
    const balance = await stripe.balance.retrieve();

    console.log('Available balance:');
    balance.available.forEach(item => {
        console.log(`Currency: ${item.currency}, Amount: ${item.amount}`);
    });

    console.log('Pending balance:');
    balance.pending.forEach(item => {
        console.log(`Currency: ${item.currency}, Amount: ${item.amount}`);
    });
    try {
        // Get all the game titles from the body
        const getGameTitles = (games) => {
            if (!games || !Array.isArray(games)) {
                throw new Error('Invalid games format');
            }

            return games.map(g => {
                if (!g.title || typeof g.title !== 'string' || !g.title.trim()) {
                    throw new Error('Invalid or missing game title');
                }
                return g.title.trim();
            });
        };

        const gameTitles = getGameTitles(req.body.games);

        // Get the developer id and account id for each game
        const gameInfos = [];

        for (const game of req.body.games) {
            const [gameRows] = await pool.query(
                `SELECT title, game_id, price FROM games WHERE title = ?`,
                [game.title]
            )

            if (gameRows.length === 0) {
                console.log(`No game found with the title "${game.title}"`);
                return res.status(400).json({ error: `No game found with the title "${game.title}"` });
            }

            const gameData = gameRows[0];

            const [ownedRows] = await pool.query(
                `SELECT game_id FROM user_games WHERE user_id = ? AND game_id = ?`,
                [req.user.id, gameData.game_id]
            );

            if (ownedRows.length > 0) {
                console.log(`User already owns the game "${game.title}"`);
                return res.status(400).json({ error: `User already owns the game "${game.title}"` });
            }

            const [devRows] = await pool.query(
                `SELECT dev_id FROM dev_games WHERE game_id = ?`,
                [gameData.game_id]
            );

            if (devRows.length === 0) {
                console.log(`No developer found for the game "${game.title}"`);
                return res.status(400).json({ error: `No developer found for the game "${game.title}"` });
            }

            const devId = devRows[0].dev_id;

            const [accRows] = await pool.query(
                `SELECT acc_id FROM developer WHERE dev_id = ?`,
                [devId]
            );

            if (accRows.length === 0) {
                console.log(`No account found for developer of game "${game.title}"`);
                return res.status(400).json({ error: `No account found for developer of game "${game.title}"` });
            }

            const accId = accRows[0].acc_id;
            const [pay] = await pool.query(
                `INSERT INTO payments(dev_id, amount)
                VALUES(?, ?)`,
                [devId, gameData.price]
            )
            const payment_id = pay.insertId


            gameInfos.push({
                title: gameData.title,
                game_id: gameData.game_id,
                price: gameData.price,
                dev_id: devId,
                acc_id: accId,
                payment_id: payment_id
            });
        }

        // Give a total checkout and make payment to the platform
        const total = gameInfos.reduce((sum, game) => sum + game.price, 0);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: gameInfos.map(game => ({
                price_data: {
                    currency: 'usd',
                    product_data: { name: game.title },
                    unit_amount: game.price
                },
                quantity: 1
            })),
            mode: 'payment',
            metadata: {
                userId: req.user.id,
                info: 'games-checkout',
                games: JSON.stringify(gameInfos)
            },
            success_url: `http://localhost:3000/pages/downloads/base.htm`,
            cancel_url: `http://localhost:3000/pages/cart/cart.html`
        })

        res.json({ url: session.url, total });
        // Wait for the webhook

        // Once the webhook arrives make the seperate payments to the others
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