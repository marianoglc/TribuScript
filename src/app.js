const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./modules/auth/auth.routes');
const membersRoutes = require('./modules/members/members.routes');
const disciplinesRoutes = require('./modules/disciplines/disciplines.routes');
const plansRoutes = require('./modules/plans/plans.routes');
const classesRoutes = require('./modules/classes/classes.routes');
const enrollmentsRoutes = require('./modules/enrollments/enrollments.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const reportsRoutes = require('./modules/reports/reports.routes');

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== 'test') {
  app.use(morgan('short'));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/members', membersRoutes);
app.use('/api/v1/disciplines', disciplinesRoutes);
app.use('/api/v1/plans', plansRoutes);
app.use('/api/v1/classes', classesRoutes);
app.use('/api/v1/enrollments', enrollmentsRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/reports', reportsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ status: 'error', message: 'Ruta no encontrada' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
