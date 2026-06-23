const express = require('express');
const cors = require('cors');
require('dotenv').config();

const loanRoutes = require('./routes/loan');
const queryRoutes = require('./routes/query');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors({
    origin: [
        "https://loanpulse-dashboard.vercel.app"
    ]
}));
app.use(express.json());

app.use('/api/loans', loanRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('LoanPulse API Running...');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
