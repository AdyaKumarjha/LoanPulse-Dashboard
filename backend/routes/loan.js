const express = require('express');
const router = express.Router();
const db = require('../db');


router.get('/', async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
                l.*,
                s.manager_name
            FROM loan_applications l
            LEFT JOIN sales_managers s
            ON l.sales_manager_id = s.sm_id
            ORDER BY l.application_date DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error("Loan API Error:", error);

        res.status(500).json({
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage
        });
    }
});

router.get('/kpis', async (req, res) => {

    try {

        const [[apps]] = await db.query(`
            SELECT COUNT(*) totalApplications
            FROM loan_applications
        `);

        const [[login]] = await db.query(`
            SELECT IFNULL(SUM(login_amount),0) totalLogin
            FROM loan_applications
        `);

        const [[disbursed]] = await db.query(`
            SELECT IFNULL(SUM(disbursed_amount),0) totalDisbursed
            FROM loan_applications
        `);

        const [status] = await db.query(`
            SELECT
                status,
                COUNT(*) count
            FROM loan_applications
            GROUP BY status
        `);

        res.json({
            totalApplications: apps.totalApplications,
            totalLogin: login.totalLogin,
            totalDisbursed: disbursed.totalDisbursed,
            statusDistribution: status
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: 'Error'
        });
    }
});

router.get('/sales-manager-performance', async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
                sm.manager_name,

                COUNT(*) applications,

                SUM(CASE WHEN la.status='Approved' THEN 1 ELSE 0 END) approved,

                SUM(CASE WHEN la.status='Rejected' THEN 1 ELSE 0 END) rejected,

                SUM(CASE WHEN la.status='Pending' THEN 1 ELSE 0 END) pending,

                SUM(CASE WHEN la.status='Disbursed' THEN 1 ELSE 0 END) disbursed

            FROM loan_applications la
            LEFT JOIN sales_managers sm
                ON la.sales_manager_id = sm.sm_id

            GROUP BY sm.manager_name
            ORDER BY applications DESC
        `);

        res.json(rows);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/amount-comparison', async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                sm.manager_name,

                ROUND(SUM(la.login_amount),2) loginAmount,

                ROUND(SUM(la.disbursed_amount),2) disbursedAmount

            FROM loan_applications la
            LEFT JOIN sales_managers sm
                ON la.sales_manager_id = sm.sm_id

            GROUP BY sm.manager_name
        `);

        res.json(rows);

    } catch(err) {

        res.status(500).json({
            message: err.message
        });
    }
});

router.get('/product-mix', async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                product_type,
                COUNT(*) count
            FROM loan_applications
            GROUP BY product_type
        `);

        res.json(rows);

    } catch(err) {

        res.status(500).json({
            message: err.message
        });
    }
});


router.get('/region-volume', async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
                region,
                ROUND(SUM(login_amount),2) loginAmount
            FROM loan_applications
            GROUP BY region
        `);

        res.json(rows);

    } catch(err) {
        res.status(500).json({
            message: err.message
        });
    }
});


router.get('/manager-scorecard', async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                sm.manager_name,

                COUNT(*) totalApps,

                SUM(CASE WHEN la.status='Approved' THEN 1 ELSE 0 END) approved,

                SUM(CASE WHEN la.status='Disbursed' THEN 1 ELSE 0 END) disbursed,

                SUM(CASE WHEN la.status='Rejected' THEN 1 ELSE 0 END) rejected,

                SUM(CASE WHEN la.status='Pending' THEN 1 ELSE 0 END) pending,

                ROUND(SUM(la.login_amount),2) loginAmount,

                ROUND(SUM(la.disbursed_amount),2) disbursedAmount,

                ROUND(
                    (
                        SUM(CASE WHEN la.status='Disbursed' THEN 1 ELSE 0 END)
                        / COUNT(*)
                    ) * 100,
                    2
                ) disbursalRate

            FROM loan_applications la

            LEFT JOIN sales_managers sm
                ON la.sales_manager_id = sm.sm_id

            GROUP BY sm.manager_name
        `);

        res.json(rows);

    } catch(err) {

        res.status(500).json({
            message: err.message
        });
    }
});


router.get('/branch-performance', async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT

                b.branch_name,
                b.region,

                COUNT(*) applications,

                ROUND(
                    SUM(la.login_amount),
                    2
                ) loginAmount,

                SUM(
                    CASE
                        WHEN la.status='Disbursed'
                        THEN 1
                        ELSE 0
                    END
                ) disbursed,

                ROUND(
                    SUM(la.disbursed_amount),
                    2
                ) disbursedAmount,

                ROUND(
                    (
                        SUM(
                            CASE
                                WHEN la.status='Disbursed'
                                THEN 1
                                ELSE 0
                            END
                        ) / COUNT(*)
                    ) * 100,
                    2
                ) conversionRate

            FROM loan_applications la

            LEFT JOIN branches b
                ON la.branch_id = b.branch_id

            GROUP BY b.branch_id
        `);

        res.json(rows);

    } catch(err) {

        res.status(500).json({
            message: err.message
        });
    }
});


router.get('/kpis', async(req,res)=>{
    
    const [[total]] = await db.query(`
        SELECT COUNT(*) totalQueries
        FROM credit_queries
    `);

    const [[open]] = await db.query(`
        SELECT COUNT(*) openQueries
        FROM credit_queries
        WHERE status='Open'
    `);

    const [[closed]] = await db.query(`
        SELECT COUNT(*) closedQueries
        FROM credit_queries
        WHERE status='Closed'
    `);

    const [[avgTat]] = await db.query(`
        SELECT ROUND(AVG(tat_hours),2) avgTat
        FROM credit_queries
    `);

    const [[overdue]] = await db.query(`
        SELECT COUNT(*) overdue
        FROM credit_queries
        WHERE tat_hours > 20
    `);

    res.json({
        totalQueries: total.totalQueries,
        openQueries: open.openQueries,
        closedQueries: closed.closedQueries,
        avgTat: avgTat.avgTat,
        overdue: overdue.overdue
    });
});

router.get('/manager-volume', async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT

                cm.manager_name,

                SUM(
                    CASE
                        WHEN cq.status = 'Open'
                        THEN 1
                        ELSE 0
                    END
                ) AS openCount,

                SUM(
                    CASE
                        WHEN cq.status = 'Closed'
                        THEN 1
                        ELSE 0
                    END
                ) AS closedCount

            FROM credit_queries cq

            LEFT JOIN credit_managers cm
                ON cq.credit_manager_id = cm.cm_id

            GROUP BY
                cm.cm_id,
                cm.manager_name
        `);

        res.json(rows);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });
    }
});

router.get('/analyst-tat', async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                ca.analyst_name,

                ROUND(
                    AVG(cq.tat_hours),
                    2
                ) AS avgTat

            FROM credit_queries cq

            LEFT JOIN credit_analysts ca
                ON cq.credit_analyst_id = ca.ca_id

            GROUP BY
                ca.ca_id,
                ca.analyst_name

            ORDER BY avgTat DESC
        `);

        res.json(rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: err.message
        });
    }
});


router.get('/type-breakdown', async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT

                query_type,

                COUNT(*) count

            FROM credit_queries

            GROUP BY query_type
        `);

        res.json(rows);

    } catch(err) {

        res.status(500).json({
            message: err.message
        });
    }
});


router.get('/query-log', async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT

                cq.query_id,
                cq.application_id,

                cm.manager_name,

                ca.analyst_name,

                cq.query_type,
                cq.tat_hours,
                cq.status,
                cq.created_at

            FROM credit_queries cq

            LEFT JOIN credit_managers cm
                ON cq.credit_manager_id = cm.cm_id

            LEFT JOIN credit_analysts ca
                ON cq.credit_analyst_id = ca.ca_id

            ORDER BY cq.created_at DESC
        `);

        res.json(rows);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });
    }
});

router.get('/tat-distribution', async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT

                CASE

                    WHEN tat_hours <= 5
                    THEN '0-5 Hrs'

                    WHEN tat_hours <= 10
                    THEN '6-10 Hrs'

                    WHEN tat_hours <= 20
                    THEN '11-20 Hrs'

                    ELSE '20+ Hrs'

                END tatRange,

                COUNT(*) count

            FROM credit_queries

            GROUP BY tatRange
        `);

        res.json(rows);

    } catch(err) {

        res.status(500).json({
            message: err.message
        });
    }
});

module.exports = router;


