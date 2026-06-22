const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                q.query_id,
                q.application_id,
                q.query_type,
                q.tat_hours,
                q.status,

                cm.manager_name,
                ca.analyst_name

            FROM credit_queries q

            LEFT JOIN credit_managers cm
            ON q.credit_manager_id = cm.cm_id

            LEFT JOIN credit_analysts ca
            ON q.credit_analyst_id = ca.ca_id

            ORDER BY q.created_at DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Error fetching queries'
        });
    }
});

module.exports = router;